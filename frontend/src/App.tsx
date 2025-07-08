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
  CardActions
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

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
  const [files, setFiles] = useState<FigmaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<FigmaFile | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'swiftui' | 'react' | 'jetpack'>('react');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    const error = urlParams.get('error');
    
    if (token) {
      setAccessToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      setError(`OAuth Error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/figma/oauth/login`;
  };

  const fetchFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/figma/files`, {
        accessToken
      });
      setFiles(response.data.files || []);
    } catch (err) {
      setError('Failed to fetch Figma files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
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
      setSelectedFile(file);
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
    a.download = `${selectedFile?.name || 'design'}.${getFileExtension(platform)}`;
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
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">
                Your Figma Files
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">Platform:</Typography>
                <Button 
                  variant={platform === 'react' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setPlatform('react')}
                >
                  React
                </Button>
                <Button 
                  variant={platform === 'swiftui' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setPlatform('swiftui')}
                >
                  SwiftUI
                </Button>
                <Button 
                  variant={platform === 'jetpack' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setPlatform('jetpack')}
                >
                  Jetpack
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={fetchFiles}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Refresh Files'}
                </Button>
              </Box>
            </Box>
            {files.length === 0 && !loading && (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No files found. Click "Refresh Files" to load your Figma files.
                </Typography>
              </Paper>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {files.map((file) => (
                <Card key={file.key}>
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last modified: {new Date(file.lastModified).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => extractDesign(file)}
                      disabled={loading}
                    >
                      Convert to Code
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
            {selectedFile && generatedCode && (
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Generated Code: {selectedFile.name}
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
