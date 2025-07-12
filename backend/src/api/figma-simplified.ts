import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { parseFigmaToIR } from '../figma/parser';
import { generateSwiftUI } from '../generators/swiftui';
import { generateJetpack } from '../generators/jetpack';
import { generateReact } from '../generators/react';

dotenv.config();
const router = express.Router();

// Store OAuth state tokens (in production, use Redis or database)
// This is the only server-side storage we need
const oauthStates = new Map<string, { timestamp: number; clientId: string }>();

// Figma OAuth2 endpoints (keep these on server for security)
router.get('/oauth/login', (req, res) => {
  const clientId = process.env.FIGMA_CLIENT_ID;
  const redirectUri = process.env.FIGMA_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    res.status(500).json({ 
      error: 'Figma OAuth not configured. Please set FIGMA_CLIENT_ID and FIGMA_REDIRECT_URI.' 
    });
    return;
  }

  // Generate secure state token
  const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  // Store state for validation (only server-side storage needed)
  oauthStates.set(state, { 
    timestamp: Date.now(), 
    clientId 
  });
  
  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of oauthStates.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      oauthStates.delete(key);
    }
  }

  const authUrl = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=file_read&state=${state}&response_type=code`;
  
  res.redirect(authUrl);
});

router.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?error=${encodeURIComponent(error as string)}`);
    return;
  }
  
  if (!code || !state) {
    console.error('Missing code or state in OAuth callback');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?error=missing_oauth_params`);
    return;
  }

  // Validate state token
  const stateData = oauthStates.get(state as string);
  if (!stateData) {
    console.error('Invalid OAuth state token');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?error=invalid_state`);
    return;
  }
  
  // Remove used state token
  oauthStates.delete(state as string);

  try {
    const tokenData = new URLSearchParams({
      client_id: process.env.FIGMA_CLIENT_ID!,
      client_secret: process.env.FIGMA_CLIENT_SECRET!,
      redirect_uri: process.env.FIGMA_REDIRECT_URI!,
      code: code as string,
      grant_type: 'authorization_code',
    });

    console.log('Attempting OAuth token exchange...');
    
    const response = await axios.post('https://api.figma.com/v1/oauth/token', tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    console.log('OAuth token exchange successful');
    const { access_token, refresh_token, expires_in } = response.data;
    
    if (!access_token) {
      throw new Error('No access token received from Figma');
    }

    // Redirect with token to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?access_token=${encodeURIComponent(access_token)}`);
    
  } catch (err) {
    console.error('OAuth token exchange failed:', err);
    
    if (axios.isAxiosError(err)) {
      const errorMessage = err.response?.data?.error_description || err.response?.data?.error || err.message;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/?error=${encodeURIComponent(errorMessage)}`);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/?error=oauth_failed`);
    }
  }
});

// Parse Figma data to IR (frontend sends the data)
router.post('/parse', async (req, res) => {
  const { figmaData, pageId } = req.body;
  
  if (!figmaData) {
    res.status(400).json({ error: 'Figma data is required' });
    return;
  }

  try {
    console.log('Parsing Figma data to IR...');
    const startTime = Date.now();
    
    // Parse with optional page selection
    const ir = parseFigmaToIR(figmaData, pageId);
    const processingTime = Date.now() - startTime;
    
    console.log(`Parsed ${ir.length} IR nodes in ${processingTime}ms`);
    
    res.json({
      ir: ir,
      processingTime: processingTime,
      nodeCount: ir.length
    });
    
  } catch (err) {
    console.error('Failed to parse Figma data:', err);
    res.status(500).json({ 
      error: 'Failed to parse Figma data',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Generate code from IR (frontend sends the IR data)
router.post('/generate', async (req, res) => {
  const { ir, platform } = req.body;
  
  if (!ir || !platform) {
    res.status(400).json({ error: 'IR data and platform are required' });
    return;
  }

  if (!['swiftui', 'react', 'jetpack'].includes(platform)) {
    res.status(400).json({ error: 'Invalid platform. Must be swiftui, react, or jetpack' });
    return;
  }

  try {
    console.log(`Generating ${platform} code from IR...`);
    const startTime = Date.now();
    
    let generatedCode: string;
    
    switch (platform) {
      case 'swiftui':
        generatedCode = generateSwiftUI(ir);
        break;
      case 'react':
        generatedCode = generateReact(ir);
        break;
      case 'jetpack':
        generatedCode = generateJetpack(ir);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Generated ${platform} code in ${processingTime}ms`);
    
    res.json({
      code: generatedCode,
      platform: platform,
      processingTime: processingTime,
      nodeCount: ir.length
    });
    
  } catch (err) {
    console.error('Failed to generate code:', err);
    res.status(500).json({ 
      error: 'Failed to generate code',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    oauthStatesCount: oauthStates.size
  });
});

export default router; 