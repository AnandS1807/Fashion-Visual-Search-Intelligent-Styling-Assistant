import React, { useState, useEffect, useCallback } from 'react';
import { Heart, ShoppingBag, Sparkles, Shirt } from 'lucide-react';
import PageHeader from './layout/PageHeader';
import TabNavigation from './layout/TabNavigation';
import ComplementaryOutfits from './sections/ComplementaryOutfits';
// Import the API service instead of direct fetch
import { apiService, SearchResult } from '../services/api';

interface ResultsPageProps {
  uploadedImage: string | File;
}

type TabType = 'similar' | 'complementary' | 'foryou';

// Use the same interface as the API service
interface Product extends SearchResult {
  // Add any additional fields if needed
}

const ResultsPage: React.FC<ResultsPageProps> = ({ uploadedImage }) => {
  const [activeTab, setActiveTab] = useState<TabType>('similar');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    console.log('Starting product fetch...');
    console.log('Uploaded image type:', typeof uploadedImage);
    
    setLoading(true);
    setError(null);
    
    try {
      let fileToUpload: File;
      
      if (typeof uploadedImage === 'string') {
        console.log('Converting string/URL to File...');
        // If it's a base64 string or URL, convert to File
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        fileToUpload = new File([blob], 'uploaded_image.jpg', { type: blob.type || 'image/jpeg' });
        console.log('Converted to File:', fileToUpload.name, fileToUpload.type);
      } else {
        // If it's already a File object
        fileToUpload = uploadedImage;
        console.log('Using existing File:', fileToUpload.name, fileToUpload.type);
      }

      console.log('Calling API service...');
      // Use the API service instead of direct fetch
      const searchResponse = await apiService.searchByImage(fileToUpload, 5);
      
      console.log(' Search response received:', searchResponse);
      setProducts(searchResponse.results);
      
    } catch (err) {
      console.error('❌ Fetch products failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [uploadedImage]);

  useEffect(() => {
    if (uploadedImage) {
      console.log('🔄 uploadedImage changed, fetching products...');
      fetchProducts();
    }
  }, [uploadedImage, fetchProducts]);

  const toggleSaved = (id: string) => {
    const newSaved = new Set(savedItems);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedItems(newSaved);
  };

  const EmptyState: React.FC<{ type: TabType }> = ({ type }) => {
    const emptyStates = {
      similar: {
        icon: <Shirt className="w-16 h-16 text-slate-300" strokeWidth={1} />,
        title: "Your style journey begins here.",
        subtitle: "Upload a pic to discover similar items!",
      },
      complementary: {
        icon: <Sparkles className="w-16 h-16 text-amber-400" strokeWidth={1} />,
        title: "Perfect matches coming soon!",
        subtitle: "We're curating complementary pieces for your style.",
      },
      foryou: {
        icon: <Sparkles className="w-16 h-16 text-slate-300" strokeWidth={1} />,
        title: "Your closet's lonely!",
        subtitle: "Add some style sparks ✨",
      },
    };

    const state = emptyStates[type];

    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-6 tab-transition">
        <div className="glass-panel rounded-2xl p-8 border-amber-200/20">
          {state.icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-700">{state.title}</h3>
          <p className="text-slate-500">{state.subtitle}</p>
        </div>
        {type === 'foryou' && (
          <button className="
            w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500
            hover:from-amber-500 hover:to-yellow-600
            text-white text-2xl font-light
            hover-lift glow-on-hover
            flex items-center justify-center
            animate-gentle-pulse
          ">
            +
          </button>
        )}
      </div>
    );
  };

  const ProductCard: React.FC<Product> = ({ 
    product_id, 
    image_url, 
    product_name, 
    price, 
    brand 
  }) => {
    // // Use the API service to get the correct image URL
    // const fullImageUrl = image_url.startsWith('http') ? image_url : apiService.getImageUrl(product_id);
    const displayImageUrl = image_url;
    console.log(` Product ${product_id} image URL:`, image_url);
    
    return (
      <div className="glass-panel rounded-2xl overflow-hidden hover-lift group border-amber-200/20">
        <div className="relative">
          <img 
            src={displayImageUrl} 
            alt={product_name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.warn(` Failed to load S3 image for product ${product_id}`);
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Found';
            }}
          />
          <button
            onClick={() => toggleSaved(product_id)}
            className={`
              absolute top-3 right-3 w-10 h-10 rounded-full
              backdrop-blur-md border border-white/20
              flex items-center justify-center
              transition-all duration-300 hover:scale-110
              ${savedItems.has(product_id) 
                ? 'bg-red-500/90 text-white' 
                : 'bg-white/70 text-slate-600 hover:bg-white/90'
              }
            `}
          >
            <Heart className={`w-5 h-5 ${savedItems.has(product_id) ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-sm text-slate-500 font-medium">{brand}</div>
          <h4 className="font-semibold text-slate-800 line-clamp-2">{product_name}</h4>
          <div className="text-lg font-bold brand-gold">₹{price}</div>
        </div>
      </div>
    );
  };

  // Convert uploadedImage to string for components that expect string
  const getImageAsString = (): string => {
    if (typeof uploadedImage === 'string') {
      return uploadedImage;
    }
    // For File objects, create a URL
    return URL.createObjectURL(uploadedImage);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="ml-4 text-slate-600">Searching for similar products...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-red-800 font-semibold mb-2">Search Failed</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchProducts}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'complementary') {
      return <ComplementaryOutfits uploadedImage={getImageAsString()} />;
    }
    
    if (activeTab === 'similar' && products.length > 0) {
      return (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-slate-600">Found {products.length} similar products</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 tab-transition">
            {products.map((product) => (
              <ProductCard key={product.product_id} {...product} />
            ))}
          </div>
        </div>
      );
    }
    
    return <EmptyState type={activeTab} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <PageHeader uploadedImage={getImageAsString()} />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={(tab: string) => setActiveTab(tab as TabType)} 
        />
        <div className="space-y-6 tab-transition">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;