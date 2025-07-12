import axios from 'axios';

// Figma API base URL
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Cache for file data to avoid repeated API calls
const fileCache = new Map<string, {
  data: any;
  timestamp: number;
  expiresAt: number;
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

export interface FigmaFile {
  key: string;
  name: string;
  lastModified: string;
  version: string;
  thumbnailUrl?: string;
}

export interface FigmaPage {
  id: string;
  name: string;
  type: string;
}

export interface FigmaFileInfo {
  name: string;
  lastModified: string;
  version: string;
  thumbnailUrl?: string;
  fileSize?: string;
  totalPages: number;
  pages: FigmaPage[];
}

export interface FigmaFileStatus {
  accessible: boolean;
  exists: boolean;
  name?: string;
  lastModified?: string;
  version?: string;
  status?: string;
  message?: string;
  recommendation?: string;
  estimatedSize?: string;
  alternative?: string;
  note?: string;
}

class FigmaService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  private getHeaders() {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  private getCacheKey(fileKey: string, endpoint: string = '') {
    return `${fileKey}:${endpoint}`;
  }

  private getCachedData(key: string) {
    const cached = fileCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    if (cached) {
      fileCache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    fileCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRY
    });
  }

  private clearCache() {
    fileCache.clear();
  }

  // Get file info with caching
  async getFileInfo(fileKey: string): Promise<FigmaFileInfo> {
    const cacheKey = this.getCacheKey(fileKey, 'info');
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, {
        headers: this.getHeaders(),
        timeout: 30000,
        maxContentLength: 500 * 1024 * 1024, // 500MB limit
        maxBodyLength: 500 * 1024 * 1024
      });

      const figmaData = response.data;
      const responseSize = JSON.stringify(response.data).length;
      const responseSizeMB = (responseSize / 1024 / 1024).toFixed(2);

      const fileInfo: FigmaFileInfo = {
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

      this.setCachedData(cacheKey, fileInfo);
      return fileInfo;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          throw new Error('File extremely large');
        }
        throw new Error(`Figma API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Get file metadata (lighter version)
  async getFileMetadata(fileKey: string): Promise<FigmaFileInfo> {
    const cacheKey = this.getCacheKey(fileKey, 'metadata');
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, {
        headers: this.getHeaders(),
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const figmaData = response.data;

      const metadata: FigmaFileInfo = {
        name: figmaData.name || 'Unknown',
        lastModified: figmaData.lastModified || 'Unknown',
        version: figmaData.version || 'Unknown',
        thumbnailUrl: figmaData.thumbnailUrl || null,
        totalPages: figmaData.document?.children?.length || 0,
        pages: figmaData.document?.children?.map((page: any) => ({
          id: page.id,
          name: page.name,
          type: page.type
        })) || []
      };

      this.setCachedData(cacheKey, metadata);
      return metadata;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          throw new Error('File extremely large');
        }
        throw new Error(`Figma API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Check file status (minimal request)
  async checkFileStatus(fileKey: string): Promise<FigmaFileStatus> {
    try {
      const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, {
        headers: this.getHeaders(),
        timeout: 10000,
        maxContentLength: 1 * 1024 * 1024, // 1MB limit
        maxBodyLength: 1 * 1024 * 1024
      });

      const figmaData = response.data;

      return {
        accessible: true,
        exists: true,
        name: figmaData.name || 'Unknown',
        lastModified: figmaData.lastModified || 'Unknown',
        version: figmaData.version || 'Unknown',
        status: 'extremely_large',
        message: 'File is accessible but extremely large',
        recommendation: 'This file is too large for processing. Use Figma\'s export features or work with individual pages.',
        estimatedSize: '> 500 MB',
        alternative: 'Try breaking the file into smaller components or use Figma\'s built-in export options'
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            accessible: false,
            exists: false,
            message: 'Figma file not found or access denied'
          };
        } else if (error.response?.status === 401) {
          return {
            accessible: false,
            exists: false,
            message: 'Invalid or expired access token'
          };
        } else if (error.response?.status === 413 || error.message?.includes('maxContentLength')) {
          return {
            accessible: true,
            exists: true,
            status: 'extremely_large',
            message: 'File extremely large',
            recommendation: 'Use Figma\'s built-in export features or break the file into smaller components.',
            estimatedSize: '> 1 GB',
            alternative: 'Consider using Figma\'s export to PNG/SVG or break into smaller files',
            note: 'Even minimal file access failed due to size'
          };
        }
      }
      
      return {
        accessible: false,
        exists: false,
        message: 'Failed to check file status'
      };
    }
  }

  // Get file data for extraction
  async getFileData(fileKey: string, pageId?: string): Promise<any> {
    const cacheKey = this.getCacheKey(fileKey, pageId || 'all');
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, {
        headers: this.getHeaders(),
        timeout: 30000,
        maxContentLength: 200 * 1024 * 1024, // 200MB limit
        maxBodyLength: 200 * 1024 * 1024
      });

      const figmaData = response.data;
      
      // If pageId is specified, filter to that page only
      if (pageId && figmaData.document?.children) {
        const targetPage = figmaData.document.children.find((page: any) => page.id === pageId);
        if (targetPage) {
          figmaData.document.children = [targetPage];
        }
      }

      this.setCachedData(cacheKey, figmaData);
      return figmaData;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          throw new Error('File too large for processing');
        }
        throw new Error(`Figma API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Get specific node data (for parsing individual views/frames)
  async getNodeData(fileKey: string, nodeId: string): Promise<any> {
    const cacheKey = this.getCacheKey(fileKey, `node-${nodeId}`);
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`Fetching specific node: ${nodeId} from file: ${fileKey}`);
      
      const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, {
        headers: this.getHeaders(),
        timeout: 30000,
        maxContentLength: 100 * 1024 * 1024, // 100MB limit for nodes
        maxBodyLength: 100 * 1024 * 1024
      });

      const nodeData = response.data;
      
      if (!nodeData.nodes || !nodeData.nodes[nodeId]) {
        throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
      }

      const node = nodeData.nodes[nodeId];
      console.log(`✅ Retrieved node: ${node.document?.name || 'Unnamed'} (${nodeId})`);

      this.setCachedData(cacheKey, node);
      return node;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Figma API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        
        if (error.response?.status === 404) {
          throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
        }
        if (error.response?.status === 400) {
          throw new Error(`Invalid node ID format: ${nodeId}. Please check the node ID and try again.`);
        }
        if (error.response?.status === 413) {
          throw new Error('Node data too large for processing');
        }
        throw new Error(`Figma API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Extract all views (frames) from a specific node with nested children
  async extractViewsFromNode(fileKey: string, nodeId: string): Promise<{
    nodeInfo: any;
    views: Array<{
      id: string;
      name: string;
      type: string;
      children?: any[];
      nestedCount?: number;
    }>;
    rawNode: any;
  }> {
    try {
      const nodeData = await this.getNodeData(fileKey, nodeId);
      const nodeDocument = nodeData.document;
      
      if (!nodeDocument) {
        throw new Error('No document found in node data');
      }

      // Extract all top-level FRAME nodes (views) with nested children
      const views = nodeDocument.children?.filter((child: any) => child.type === 'FRAME') || [];
      
      console.log(`📊 Found ${views.length} views in node: ${nodeDocument.name}`);
      
      // Process each view to include nested children
      const processedViews = views.map((view: any) => {
        const nestedCount = this.countNestedElements(view);
        console.log(`🔍 View "${view.name}" has ${nestedCount} nested elements`);
        
        return {
          id: view.id,
          name: view.name,
          type: view.type,
          children: view.children || [],
          nestedCount: nestedCount
        };
      });
      
      return {
        nodeInfo: {
          id: nodeDocument.id,
          name: nodeDocument.name,
          type: nodeDocument.type
        },
        views: processedViews,
        rawNode: nodeData // <-- return the raw node data
      };

    } catch (error) {
      console.error('Error extracting views from node:', error);
      throw error;
    }
  }

  // Count nested elements recursively
  private countNestedElements(node: any): number {
    if (!node.children || node.children.length === 0) {
      return 0;
    }

    let count = node.children.length;
    
    // Recursively count children of children
    for (const child of node.children) {
      count += this.countNestedElements(child);
    }
    
    return count;
  }

  // Get detailed node data with all nested children
  async getDetailedNodeData(fileKey: string, nodeId: string): Promise<any> {
    const cacheKey = this.getCacheKey(fileKey, `detailed-node-${nodeId}`);
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`Fetching detailed node data: ${nodeId} from file: ${fileKey}`);
      
      const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&depth=10`, {
        headers: this.getHeaders(),
        timeout: 30000,
        maxContentLength: 200 * 1024 * 1024, // 200MB limit for detailed data
        maxBodyLength: 200 * 1024 * 1024
      });

      const nodeData = response.data;
      
      if (!nodeData.nodes || !nodeData.nodes[nodeId]) {
        throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
      }

      const node = nodeData.nodes[nodeId];
      console.log(`✅ Retrieved detailed node: ${node.document?.name || 'Unnamed'} (${nodeId})`);

      this.setCachedData(cacheKey, node);
      return node;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Figma API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        
        if (error.response?.status === 404) {
          throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
        }
        if (error.response?.status === 400) {
          throw new Error(`Invalid node ID format: ${nodeId}. Please check the node ID and try again.`);
        }
        if (error.response?.status === 413) {
          throw new Error('Node data too large for processing');
        }
        throw new Error(`Figma API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Get user's files
  async getUserFiles(): Promise<FigmaFile[]> {
    try {
      const response = await axios.get(`${FIGMA_API_BASE}/me/files`, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      return response.data.files || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Figma API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Clear all cached data
  clearAllCache() {
    this.clearCache();
  }

  // Get cache statistics
  getCacheStats() {
    const entries = Array.from(fileCache.entries());
    return {
      totalEntries: entries.length,
      totalSize: entries.reduce((acc, [_, data]) => acc + JSON.stringify(data.data).length, 0),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([_, data]) => data.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([_, data]) => data.timestamp)) : null
    };
  }
}

// Export singleton instance
export const figmaService = new FigmaService();
export default figmaService; 