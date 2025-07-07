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
const oauthStates = new Map<string, { timestamp: number; clientId: string }>();

// Figma OAuth2 endpoints
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
  
  // Store state for validation
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

  // Use the correct OAuth endpoint
  const authUrl = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=file_read&state=${state}&response_type=code`;
  
  res.redirect(authUrl);
});

router.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    res.redirect(`http://localhost:5173/?error=${encodeURIComponent(error as string)}`);
    return;
  }
  
  if (!code || !state) {
    console.error('Missing code or state in OAuth callback');
    res.redirect('http://localhost:5173/?error=missing_oauth_params');
    return;
  }

  // Validate state token
  const stateData = oauthStates.get(state as string);
  if (!stateData) {
    console.error('Invalid OAuth state token');
    res.redirect('http://localhost:5173/?error=invalid_state');
    return;
  }
  
  // Remove used state token
  oauthStates.delete(state as string);

  try {
    // Try the correct OAuth token endpoint - Figma uses a different endpoint
    const tokenData = new URLSearchParams({
      client_id: process.env.FIGMA_CLIENT_ID!,
      client_secret: process.env.FIGMA_CLIENT_SECRET!,
      redirect_uri: process.env.FIGMA_REDIRECT_URI!,
      code: code as string,
      grant_type: 'authorization_code',
    });

    console.log('Attempting OAuth token exchange...');
    
    // Try the correct endpoint - Figma OAuth token endpoint
    const response = await axios.post('https://www.figma.com/oauth/token', tokenData, {
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

    // In production, store tokens securely (encrypted database, secure cookies, etc.)
    // For now, redirect with token (not secure for production)
    res.redirect(`http://localhost:5173/?access_token=${encodeURIComponent(access_token)}`);
    
  } catch (err) {
    console.error('OAuth token exchange failed:', err);
    
    if (axios.isAxiosError(err)) {
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      console.error('Response headers:', err.response?.headers);
      
      const errorMessage = err.response?.data?.error_description || err.response?.data?.error || err.message;
      res.redirect(`http://localhost:5173/?error=${encodeURIComponent(errorMessage)}`);
    } else {
      res.redirect('http://localhost:5173/?error=oauth_failed');
    }
  }
});

// List user files
router.post('/files', async (req, res) => {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    res.status(400).json({ error: 'Access token is required' });
    return;
  }

  try {
    const response = await axios.get('https://api.figma.com/v1/me/files', {
      headers: { 
        'X-Figma-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (err) {
    console.error('Failed to fetch Figma files:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired access token' });
      } else if (err.response?.status === 403) {
        res.status(403).json({ error: 'Insufficient permissions to access files' });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to fetch Figma files',
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ error: 'Failed to fetch Figma files' });
    }
  }
});

// Extract IR from Figma file
router.post('/extract', async (req, res) => {
  const { accessToken, fileKey } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  try {
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'X-Figma-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    const ir = parseFigmaToIR(response.data);
    res.json(ir);
  } catch (err) {
    console.error('Failed to extract Figma file:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ error: 'Figma file not found or access denied' });
      } else if (err.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired access token' });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to extract Figma file',
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ error: 'Failed to extract Figma file' });
    }
  }
});

// Generate code for selected platform
router.post('/generate', async (req, res) => {
  const { ir, platform } = req.body;
  
  if (!ir || !platform) {
    res.status(400).json({ error: 'IR data and platform are required' });
    return;
  }

  const supportedPlatforms = ['swiftui', 'jetpack', 'react'];
  if (!supportedPlatforms.includes(platform)) {
    res.status(400).json({ 
      error: `Unsupported platform. Supported platforms: ${supportedPlatforms.join(', ')}` 
    });
    return;
  }

  try {
    let code = '';
    switch (platform) {
      case 'swiftui':
        code = generateSwiftUI(ir);
        break;
      case 'jetpack':
        code = generateJetpack(ir);
        break;
      case 'react':
        code = generateReact(ir);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    res.json({ code, platform });
  } catch (err) {
    console.error(`Failed to generate ${platform} code:`, err);
    res.status(500).json({ 
      error: `Failed to generate ${platform} code`,
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    figmaConfigured: !!(process.env.FIGMA_CLIENT_ID && process.env.FIGMA_CLIENT_SECRET)
  });
});

export default router;
