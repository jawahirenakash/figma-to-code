import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Paper, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  TextField,
  Divider
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';
import figmaService, { FigmaFileInfo, FigmaFileStatus } from './services/figmaService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#f59e0b',
    },
  },
});

// Backend URL configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://figma-to-code-backend.onrender.com');

interface FigmaFile {
  key: string;
  name: string;
  lastModified: string;
}

interface GeneratedCode {
  code: string;
  platform: string;
}

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'swiftui' | 'react' | 'jetpack'>('react');
  const [figmaUrl, setFigmaUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    size?: string;
    nodeCount?: number;
    processingTime?: number;
  } | null>(null);
  const [availablePages, setAvailablePages] = useState<Array<{
    id: string;
    name: string;
    type: string;
  }>>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [showPageSelector, setShowPageSelector] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    const error = urlParams.get('error');
    
    if (token) {
      console.log('Setting access token from URL');
      setAccessToken(token);
      // Store token in localStorage for persistence
      localStorage.setItem('figma_access_token', token);
      // Set token in Figma service
      figmaService.setAccessToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Try to get token from localStorage on page load
      const storedToken = localStorage.getItem('figma_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        figmaService.setAccessToken(storedToken);
      }
    }
    
    if (error) {
      setError(`OAuth Error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Debug: Log access token changes
  useEffect(() => {
    console.log('Access token changed:', accessToken ? 'Token present' : 'No token');
  }, [accessToken]);

  // Debug: Log backend URL
  useEffect(() => {
    console.log('Backend URL:', BACKEND_URL);
  }, []);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/figma/oauth/login`;
  };

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('figma_access_token');
    figmaService.clearAccessToken();
    figmaService.clearAllCache();
    setGeneratedCode(null);
    setError(null);
    setFileInfo(null);
    setAvailablePages([]);
    setSelectedPageId('');
  };

  const extractDesign = async (file: FigmaFile) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/figma/extract`, {
        accessToken,
        fileKey: file.key
      });
      const codeResponse = await axios.post(`${BACKEND_URL}/api/figma/generate`, {
        ir: response.data,
        platform
      });
      setGeneratedCode(codeResponse.data);
    } catch (err) {
      setError('Failed to extract design or generate code');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figma-design.${getFileExtension(platform)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (platform: string) => {
    switch (platform) {
      case 'swiftui': return 'swift';
      case 'react': return 'tsx';
      case 'jetpack': return 'kt';
      default: return 'txt';
    }
  };

  const extractFileKeyFromUrl = (url: string): string | null => {
    // Handle file URLs: https://www.figma.com/file/KEY/...
    const fileMatch = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    if (fileMatch) {
      return fileMatch[1];
    }
    
    // Handle design URLs: https://www.figma.com/design/KEY/...
    const designMatch = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
    if (designMatch) {
      return designMatch[1];
    }
    
    return null;
  };

  const extractNodeIdFromUrl = (url: string): string | null => {
    // Extract node-id from URL parameters
    const nodeMatch = url.match(/node-id=([a-zA-Z0-9-]+)/);
    if (nodeMatch) {
      return nodeMatch[1];
    }
    return null;
  };

  const validateFigmaUrl = (url: string): boolean => {
    const fileKey = extractFileKeyFromUrl(url);
    return fileKey !== null;
  };

  const convertDesignUrlToFileUrl = (designUrl: string): string => {
    const fileKey = extractFileKeyFromUrl(designUrl);
    if (fileKey) {
      return `https://www.figma.com/file/${fileKey}`;
    }
    return designUrl;
  };

    const getAvailablePages = async (fileKey: string) => {
    try {
      console.log('Getting file info for:', fileKey);
      
      // Try the file-info endpoint first (now using frontend service)
      let fileInfo: FigmaFileInfo;
      try {
        fileInfo = await figmaService.getFileInfo(fileKey);
        
        console.log('File info response:', fileInfo);
        
        // Check if file is extremely large
        const fileSize = parseFloat(fileInfo.fileSize || '0');
        if (fileSize > 100) {
          setError(`⚠️ Large File Detected: ${fileInfo.fileSize} MB\n\nThis file is very large and may cause performance issues. Consider:\n• Working with individual pages\n• Breaking the file into smaller components\n• Using the web interface for better handling`);
          return [];
        }
        
        setAvailablePages(fileInfo.pages || []);
        
        if (fileInfo.pages && fileInfo.pages.length > 0) {
          setShowPageSelector(true);
          // Auto-select first page if none selected
          if (!selectedPageId) {
            setSelectedPageId(fileInfo.pages[0].id);
          }
        }
        
        // Show file info
        setFileInfo({
          size: fileInfo.fileSize,
          nodeCount: fileInfo.totalPages,
          processingTime: 0
        });
        
        return fileInfo.pages;
        
      } catch (fileInfoError) {
        // If file-info fails due to size, try metadata endpoint
        console.log('File info failed, trying metadata endpoint...');
        
        try {
          fileInfo = await figmaService.getFileMetadata(fileKey);
          
          console.log('File metadata response:', fileInfo);
          
          setAvailablePages(fileInfo.pages || []);
      
          if (fileInfo.pages && fileInfo.pages.length > 0) {
            setShowPageSelector(true);
            // Auto-select first page if none selected
            if (!selectedPageId) {
              setSelectedPageId(fileInfo.pages[0].id);
            }
          }
          
          // Show basic info without size
          setFileInfo({
            size: 'Unknown (extremely large)',
            nodeCount: fileInfo.totalPages,
            processingTime: 0
          });
          
          return fileInfo.pages;
          
        } catch (metadataError) {
          // If metadata also fails, try the status endpoint
          console.log('File metadata failed, trying status endpoint...');
          
          try {
            const fileStatus: FigmaFileStatus = await figmaService.checkFileStatus(fileKey);
            
            console.log('File status response:', fileStatus);
            
            // For extremely large files, we can't get page info, but we can show the file is accessible
            if (fileStatus.accessible) {
              setError(`🚨 Extremely Large File Detected\n\n${fileStatus.message}\n\n${fileStatus.recommendation}\n\n💡 ${fileStatus.alternative}`);
              
              // Show basic file info
              setFileInfo({
                size: fileStatus.estimatedSize || 'Unknown (extremely large)',
                nodeCount: 0,
                processingTime: 0
              });
              
              return [];
            } else {
              throw new Error('File not accessible');
            }
            
          } catch (statusError) {
            // All endpoints failed
            throw statusError;
          }
        }
      }
      
    } catch (err) {
      console.error('Failed to get file info:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('extremely large') || err.message.includes('too large')) {
          setError(`🚨 File Size Issue: ${err.message}\n\n💡 Try breaking the file into smaller components or use Figma's export features.`);
        } else {
          setError(`Failed to get file info: ${err.message}`);
        }
      } else {
        setError('Failed to get file information');
      }
      return [];
    }
  };

  const handleUrlSubmit = async () => {
    if (!figmaUrl.trim()) {
      setError('Please enter a Figma URL');
      return;
    }

    if (!validateFigmaUrl(figmaUrl)) {
      setError('Invalid Figma URL. Please use a URL like: https://www.figma.com/file/... or https://www.figma.com/design/...');
      return;
    }

    const fileKey = extractFileKeyFromUrl(figmaUrl);
    if (!fileKey) {
      setError('Could not extract file key from URL');
      return;
    }

    // Check if URL contains a specific node ID
    const nodeId = extractNodeIdFromUrl(figmaUrl);
    if (nodeId) {
      console.log('Found node ID in URL:', nodeId);
      // For now, we'll use this as a hint but still show page selector
    }

    setLoading(true);
    setError(null);
    setFileInfo(null);
    
    try {
      // First, get available pages
      const pages = await getAvailablePages(fileKey);
      
      if (pages.length === 0) {
        setError('No pages found in this Figma file');
        setLoading(false);
        return;
      }
      
      console.log('Getting file data and processing...');
      
      // Get file data from frontend service
      const figmaData = await figmaService.getFileData(fileKey, selectedPageId || undefined);
      
      console.log('Figma data received, sending to backend for parsing...');
      
      // Send to backend for parsing
      const parseResponse = await axios.post(`${BACKEND_URL}/api/figma/parse`, {
        figmaData,
        pageId: selectedPageId || undefined
      });
      
      console.log('Parse response:', parseResponse.data);
      
      const parseData = parseResponse.data;
      const irData = parseData.ir;
      
      // Display processing information
      if (parseData.processingTime) {
        console.log(`Processing time: ${parseData.processingTime}ms`);
        console.log(`Node count: ${parseData.nodeCount}`);
        
        setFileInfo({
          size: fileInfo?.size || 'Unknown',
          nodeCount: parseData.nodeCount,
          processingTime: parseData.processingTime
        });
      }
      
      // Send to backend for code generation
      const codeResponse = await axios.post(`${BACKEND_URL}/api/figma/generate`, {
        ir: irData,
        platform
      });
      
      console.log('Generate response:', codeResponse.data);
      
      setGeneratedCode(codeResponse.data);
    } catch (err) {
      console.error('Detailed error:', err);
      if (axios.isAxiosError(err)) {
        console.error('Response status:', err.response?.status);
        console.error('Response data:', err.response?.data);
        console.error('Response headers:', err.response?.headers);
        
        // Handle specific error cases
        if (err.response?.status === 413) {
          const errorData = err.response.data;
          const errorMessage = `${errorData.error}: ${errorData.details}`;
          const suggestion = errorData.suggestion ? `\n\nSuggestion: ${errorData.suggestion}` : '';
          const fileSizeInfo = errorData.fileSize ? `\n\n📊 File Size: ${errorData.fileSize} MB` : '';
          const maxSizeInfo = errorData.maxAllowedSize ? `\n📏 Maximum Allowed: ${errorData.maxAllowedSize}` : '';
          setError(errorMessage + fileSizeInfo + maxSizeInfo + suggestion);
        } else {
          setError(`Network error: ${err.response?.status} - ${err.response?.data?.error || err.message}`);
        }
      } else {
        setError('Failed to extract design or generate code. Make sure you have access to this file.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          Figma to Code Converter
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Convert your Figma designs into SwiftUI, React, and Jetpack Compose code
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {!accessToken ? (
          <Box textAlign="center">
            <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Get Started
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect your Figma account to start converting designs to code
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleLogin}
                sx={{ px: 4 }}
              >
                Login with Figma
              </Button>
            </Paper>
          </Box>
        ) : (
          <Box>
            {/* Header with logout */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" color="success.main">
                ✅ Connected to Figma
              </Typography>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleLogout}
                size="small"
              >
                Logout
              </Button>
            </Box>
            
            {/* File Information Display */}
            {fileInfo && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h6" gutterBottom>
                  📊 File Information
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2">
                    <strong>File Size:</strong> {fileInfo.size} MB
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nodes Processed:</strong> {fileInfo.nodeCount}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Processing Time:</strong> {fileInfo.processingTime}ms
                  </Typography>
                </Box>
              </Paper>
            )}
            
            {/* Page Selector */}
            {showPageSelector && availablePages.length > 0 && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
                <Typography variant="h6" gutterBottom>
                  📄 Select Page to Convert
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose which page from your Figma file to convert to code. This will reduce processing time and memory usage.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  {availablePages.map((page) => (
                    <Button
                      key={page.id}
                      variant={selectedPageId === page.id ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setSelectedPageId(page.id)}
                      sx={{ minWidth: 120 }}
                    >
                      {page.name}
                    </Button>
                  ))}
                  <Button
                    variant={selectedPageId === '' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedPageId('')}
                    sx={{ minWidth: 120 }}
                  >
                    All Pages
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected: {selectedPageId ? availablePages.find(p => p.id === selectedPageId)?.name : 'All Pages'}
                </Typography>
              </Paper>
            )}
            
            {/* URL Input Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Convert by URL
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                >
                  {showUrlInput ? 'Hide' : 'Show'} URL Input
                </Button>
              </Box>
              
              {showUrlInput && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter a Figma file URL or design URL to convert it to code. 
                    Supports both <code>figma.com/file/...</code> and <code>figma.com/design/...</code> URLs.
                    <br />
                    <strong>Note:</strong> Files larger than 200MB may not process correctly.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      label="Figma URL"
                      placeholder="https://www.figma.com/file/... or https://www.figma.com/design/..."
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      disabled={loading}
                      size="small"
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleUrlSubmit}
                      disabled={loading || !figmaUrl.trim()}
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Convert'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
            
            <Divider sx={{ my: 3 }} />
            
            {generatedCode && (
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Generated Code
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Platform: {platform.toUpperCase()}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={downloadCode}
                    sx={{ mr: 1 }}
                  >
                    Download Code
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setGeneratedCode(null)}
                  >
                    Close
                  </Button>
                </Box>
                <Box 
                  component="pre" 
                  sx={{ 
                    backgroundColor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 400,
                    fontSize: '0.875rem'
                  }}
                >
                  <code>{generatedCode.code}</code>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
