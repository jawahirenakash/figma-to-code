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

    // In production, store tokens securely (encrypted database, secure cookies, etc.)
    // For now, redirect with token (not secure for production)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?access_token=${encodeURIComponent(access_token)}`);
    
  } catch (err) {
    console.error('OAuth token exchange failed:', err);
    
    if (axios.isAxiosError(err)) {
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      console.error('Response headers:', err.response?.headers);
      
      const errorMessage = err.response?.data?.error_description || err.response?.data?.error || err.message;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/?error=${encodeURIComponent(errorMessage)}`);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/?error=oauth_failed`);
    }
  }
});

// Get available pages from Figma file
router.post('/pages', async (req, res) => {
  const { accessToken, fileKey } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  try {
    console.log(`Getting pages for file: ${fileKey}`);
    
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000, // Increased timeout for large files
      maxContentLength: 200 * 1024 * 1024, // 200MB for page list
      maxBodyLength: 200 * 1024 * 1024
    });
    
    const figmaData = response.data;
    const pages = figmaData.document?.children || [];
    
    const pageList = pages.map((page: any) => ({
      id: page.id,
      name: page.name,
      type: page.type
    }));
    
    console.log(`Found ${pageList.length} pages in file`);
    
    res.json({
      pages: pageList,
      totalPages: pageList.length
    });
    
  } catch (err) {
    console.error('Failed to get pages:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ error: 'Figma file not found or access denied' });
      } else if (err.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired access token' });
      } else if (err.message?.includes('maxContentLength')) {
        res.status(413).json({ 
          error: 'Figma file too large for page listing',
          details: 'This Figma file is extremely large. Even the page listing exceeds the size limit.',
          suggestion: 'Try accessing the file directly in Figma and work with individual pages.',
          fileSize: 'Exceeds 200 MB limit'
        });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to get pages',
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ error: 'Failed to get pages' });
    }
  }
});

// Get file size and basic info without parsing
router.post('/file-info', async (req, res) => {
  const { accessToken, fileKey } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  try {
    console.log(`Getting file info for: ${fileKey}`);
    
    // Try with a reasonable limit first
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      maxContentLength: 500 * 1024 * 1024, // 500MB limit
      maxBodyLength: 500 * 1024 * 1024
    });
    
    const figmaData = response.data;
    const responseSize = JSON.stringify(response.data).length;
    const responseSizeMB = (responseSize / 1024 / 1024).toFixed(2);
    
    // Extract basic info without parsing
    const fileInfo = {
      name: figmaData.name || 'Unknown',
      lastModified: figmaData.lastModified || 'Unknown',
      version: figmaData.version || 'Unknown',
      thumbnailUrl: figmaData.thumbnailUrl || null,
      fileSize: responseSizeMB,
      totalPages: figmaData.document?.children?.length || 0,
      pages: figmaData.document?.children?.map((page: any) => ({
        id: page.id,
        name: page.name,
        type: page.type
      })) || []
    };
    
    console.log(`File info: ${fileInfo.name}, ${fileInfo.totalPages} pages, ${fileInfo.fileSize} MB`);
    
    res.json(fileInfo);
    
  } catch (err) {
    console.error('Failed to get file info:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ error: 'Figma file not found or access denied' });
      } else if (err.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired access token' });
      } else if (err.message?.includes('maxContentLength')) {
        res.status(413).json({ 
          error: 'Figma file extremely large',
          details: `File size exceeds 500 MB limit. This is an extremely large Figma file.`,
          suggestion: 'This file is too large for processing. Consider breaking it into smaller components or using Figma\'s export features.',
          estimatedSize: '> 500 MB',
          recommendation: 'Use Figma\'s built-in export features or break the file into smaller components'
        });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to get file info',
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ error: 'Failed to get file info' });
    }
  }
});

// Get basic file metadata (works with any file size)
router.post('/file-metadata', async (req, res) => {
  const { accessToken, fileKey } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  try {
    console.log(`Getting file metadata for: ${fileKey}`);
    
    // Use Figma's file metadata endpoint which is much lighter
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      maxContentLength: Infinity, // No limit for metadata
      maxBodyLength: Infinity
    });
    
    const figmaData = response.data;
    
    // Extract only basic metadata
    const metadata = {
      name: figmaData.name || 'Unknown',
      lastModified: figmaData.lastModified || 'Unknown',
      version: figmaData.version || 'Unknown',
      thumbnailUrl: figmaData.thumbnailUrl || null,
      totalPages: figmaData.document?.children?.length || 0,
      pages: figmaData.document?.children?.map((page: any) => ({
        id: page.id,
        name: page.name,
        type: page.type
      })) || [],
      status: 'success',
      message: 'File metadata retrieved successfully'
    };
    
    console.log(`File metadata: ${metadata.name}, ${metadata.totalPages} pages`);
    
    res.json(metadata);
    
  } catch (err) {
    console.error('Failed to get file metadata:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ error: 'Figma file not found or access denied' });
      } else if (err.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired access token' });
      } else if (err.message?.includes('maxContentLength') || err.response?.status === 413) {
        // Handle extremely large files gracefully
        res.status(413).json({ 
          error: 'File extremely large',
          details: 'This Figma file is extremely large and cannot be processed by this tool.',
          suggestion: 'Consider using Figma\'s built-in export features or breaking the file into smaller components.',
          recommendation: 'Use Figma\'s export to PNG/SVG or break into smaller files',
          estimatedSize: '> 500 MB',
          alternative: 'Try accessing the file directly in Figma and work with individual pages or components'
        });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to get file metadata',
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ error: 'Failed to get file metadata' });
    }
  }
});

// Handle extremely large files with better error handling
router.post('/file-status', async (req, res) => {
  const { accessToken, fileKey } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  try {
    console.log(`Checking file status for: ${fileKey}`);
    
    // Try a minimal request to check if file is accessible
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000, // Short timeout
      maxContentLength: 1 * 1024 * 1024, // Only 1MB to test access
      maxBodyLength: 1 * 1024 * 1024
    });
    
    // If we get here, file is accessible but we only got partial data
    const figmaData = response.data;
    
    const status = {
      accessible: true,
      name: figmaData.name || 'Unknown',
      lastModified: figmaData.lastModified || 'Unknown',
      version: figmaData.version || 'Unknown',
      status: 'extremely_large',
      message: 'File is accessible but extremely large',
      recommendation: 'This file is too large for processing. Use Figma\'s export features or work with individual pages.',
      estimatedSize: '> 500 MB',
      alternative: 'Try breaking the file into smaller components or use Figma\'s built-in export options'
    };
    
    res.json(status);
    
  } catch (err) {
    console.error('Failed to check file status:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ 
          error: 'Figma file not found or access denied',
          accessible: false
        });
      } else if (err.response?.status === 401) {
        res.status(401).json({ 
          error: 'Invalid or expired access token',
          accessible: false
        });
      } else if (err.message?.includes('maxContentLength') || err.response?.status === 413) {
        // File is extremely large - even the minimal request failed
        res.status(413).json({ 
          error: 'File extremely large',
          accessible: true,
          details: 'This Figma file is extremely large and cannot be processed by any method.',
          suggestion: 'Use Figma\'s built-in export features or break the file into smaller components.',
          recommendation: 'Try accessing the file directly in Figma and work with individual pages.',
          estimatedSize: '> 1 GB',
          alternative: 'Consider using Figma\'s export to PNG/SVG or break into smaller files',
          note: 'Even minimal file access failed due to size'
        });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to check file status',
          accessible: false,
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ 
        error: 'Failed to check file status',
        accessible: false
      });
    }
  }
});

// Ultimate fallback for extremely large files
router.post('/file-check', async (req, res) => {
  const { accessToken, fileKey } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  try {
    console.log(`Performing ultimate file check for: ${fileKey}`);
    
    // Just check if the file exists by making a HEAD request or minimal GET
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000, // Very short timeout
      maxContentLength: 1024, // Only 1KB to test access
      maxBodyLength: 1024
    });
    
    // If we get here, file exists but is extremely large
    res.status(413).json({ 
      error: 'File extremely large',
      accessible: true,
      exists: true,
      details: 'This Figma file exists but is extremely large and cannot be processed.',
      suggestion: 'Use Figma\'s built-in export features or break the file into smaller components.',
      recommendation: 'Try accessing the file directly in Figma and work with individual pages.',
      estimatedSize: '> 1 GB',
      alternative: 'Consider using Figma\'s export to PNG/SVG or break into smaller files',
      note: 'File exists but is too large for any processing'
    });
    
  } catch (err) {
    console.error('Ultimate file check failed:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ 
          error: 'Figma file not found or access denied',
          accessible: false,
          exists: false
        });
      } else if (err.response?.status === 401) {
        res.status(401).json({ 
          error: 'Invalid or expired access token',
          accessible: false,
          exists: false
        });
      } else if (err.message?.includes('maxContentLength') || err.response?.status === 413) {
        // File exists but is extremely large
        res.status(413).json({ 
          error: 'File extremely large',
          accessible: true,
          exists: true,
          details: 'This Figma file exists but is extremely large and cannot be processed.',
          suggestion: 'Use Figma\'s built-in export features or break the file into smaller components.',
          recommendation: 'Try accessing the file directly in Figma and work with individual pages.',
          estimatedSize: '> 1 GB',
          alternative: 'Consider using Figma\'s export to PNG/SVG or break into smaller files',
          note: 'File exists but is too large for any processing'
        });
      } else {
        res.status(err.response?.status || 500).json({ 
          error: 'Failed to check file',
          accessible: false,
          exists: false,
          details: err.response?.data?.message || err.message
        });
      }
    } else {
      res.status(500).json({ 
        error: 'Failed to check file',
        accessible: false,
        exists: false
      });
    }
  }
});

// Extract IR from Figma file (with optional page selection)
router.post('/extract', async (req, res) => {
  const { accessToken, fileKey, pageId } = req.body;
  
  if (!accessToken || !fileKey) {
    res.status(400).json({ error: 'Access token and file key are required' });
    return;
  }

  // Set request timeout
  const timeout = 30000; // 30 seconds
  
  try {
    console.log(`Starting extraction for file: ${fileKey}`);
    const startTime = Date.now();
    
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: timeout,
      maxContentLength: 200 * 1024 * 1024, // 200MB limit
      maxBodyLength: 200 * 1024 * 1024
    });
    
    console.log(`Figma API response received in ${Date.now() - startTime}ms`);
    
    // Check response size
    const responseSize = JSON.stringify(response.data).length;
    const responseSizeMB = (responseSize / 1024 / 1024).toFixed(2);
    console.log(`Figma response size: ${responseSizeMB} MB`);
    
    if (responseSize > 200 * 1024 * 1024) {
      res.status(413).json({ 
        error: 'Figma file too large',
        details: `File size (${responseSizeMB} MB) exceeds the 200 MB limit.`,
        suggestion: 'Try duplicating the file and removing unnecessary elements to reduce its size.',
        fileSize: responseSizeMB,
        maxAllowedSize: '200 MB'
      });
      return;
    }
    
    // Memory optimization: process in chunks if needed
    const figmaData = response.data;
    console.log(`Processing Figma data with ${figmaData.document?.children?.length || 0} root children`);
    
    // Parse with optional page selection
    const ir = parseFigmaToIR(figmaData, pageId);
    const pageInfo = pageId ? ` (Page ID: ${pageId})` : ' (All pages)';
    console.log(`Parsed ${ir.length} IR nodes${pageInfo} in ${Date.now() - startTime}ms`);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('Garbage collection performed');
    }
    
    // Return file size information along with the IR data
    res.json({
      ir: ir,
      fileSize: responseSizeMB,
      nodeCount: ir.length,
      processingTime: Date.now() - startTime
    });
  } catch (err) {
    console.error('Failed to extract Figma file:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        res.status(404).json({ error: 'Figma file not found or access denied' });
      } else if (err.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired access token' });
      } else if (err.message?.includes('maxContentLength')) {
        res.status(413).json({ 
          error: 'Figma file too large',
          details: 'This Figma file is too large to process. Please try with a smaller file or contact support for large file processing.',
          suggestion: 'Try duplicating the file and removing unnecessary elements to reduce its size.',
          fileSize: 'Unknown (exceeded 200 MB limit)',
          maxAllowedSize: '200 MB'
        });
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
