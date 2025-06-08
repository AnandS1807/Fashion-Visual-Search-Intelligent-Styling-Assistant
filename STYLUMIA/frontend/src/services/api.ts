// STYLUMIA/frontend/src/services/api.ts

// API Configuration
const API_BASE_URL = 'http://localhost:8000';  // Adjust if your backend runs on different port

// Types for API responses
export interface SearchResult {
  product_id: string;
  image_url: string;
  product_name: string;
  brand: string;
  price: number;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total_found: number;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  message: string;
}

// API Service Class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log(`🔧 API Service initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Health check to verify backend connectivity
   */
  async healthCheck(): Promise<HealthResponse> {
    console.log(' Performing health check...');
    
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log(`Health check response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const data: HealthResponse = await response.json();
      console.log('Backend is healthy:', data);
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Upload image and search for similar products
   */
  async searchByImage(file: File, topK: number = 5): Promise<SearchResponse> {
    console.log(' Starting image search...');
    console.log(`File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('top_k', topK.toString());

      console.log('Sending request to backend...');
      console.log(` URL: ${this.baseUrl}/search`);

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      console.log(` Search response status: ${response.status}`);
      console.log(` Search response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(` Search request failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SearchResponse = await response.json();
      console.log('Search completed successfully');
      console.log(`Found ${data.total_found} results`);
      console.log('Results preview:', data.results.map(r => ({
        id: r.product_id,
        name: r.product_name,
        brand: r.brand
      })));

      return data;

    } catch (error) {
      console.error(' Image search failed:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw error;
    }
  }

  /**
   * Get the full URL for a product image
   * STYLUMIA\images\images_dresses
   */
    getImageUrl(productId: string): string {
      // const url = `${this.baseUrl}/images/images_dresses/${productId}.jpg`;
      // console.log(`Generated image URL for ${productId}: ${url}`);
      // return url;
      return `https://via.placeholder.com/400?text=Loading`;
    }
  /**
   * Test connectivity to backend
   */
  async testConnection(): Promise<boolean> {
    console.log(' Testing backend connection...');
    
    try {
      await this.healthCheck();
      console.log(' Backend connection successful');
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export utility functions
export const testBackendConnection = () => apiService.testConnection();
export const searchImage = (file: File, topK?: number) => apiService.searchByImage(file, topK);
export const getProductImageUrl = (productId: string) => apiService.getImageUrl(productId);