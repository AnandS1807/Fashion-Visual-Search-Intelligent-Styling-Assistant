
import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface ComplementaryOutfitsProps {
  uploadedImage: string;
}

const ComplementaryOutfits: React.FC<ComplementaryOutfitsProps> = ({ uploadedImage }) => {
  // Sample complementary outfit data
  const complementaryOutfits = [
    { id: '1', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', title: 'Flowing Maxi Dress', price: '$129', brand: 'ZARA' },
    { id: '2', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400', title: 'Denim Jacket', price: '$89', brand: 'Levi\'s' },
    { id: '3', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', title: 'White Canvas Sneakers', price: '$75', brand: 'Converse' },
    { id: '4', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', title: 'Crossbody Bag', price: '$145', brand: 'Coach' },
    { id: '5', image: 'https://images.unsplash.com/photo-1506629905607-c581daa1a6a6?w=400', title: 'Statement Earrings', price: '$45', brand: 'Pandora' },
    { id: '6', image: 'https://images.unsplash.com/photo-1583743089695-4b4992c0c8d2?w=400', title: 'Silk Scarf', price: '$67', brand: 'H&M' },
    { id: '7', image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400', title: 'Wide Brim Hat', price: '$52', brand: 'Asos' },
    { id: '8', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', title: 'Block Heel Sandals', price: '$98', brand: 'Nine West' },
    { id: '9', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', title: 'Cardigan Sweater', price: '$76', brand: 'Uniqlo' },
    { id: '10', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400', title: 'Midi Skirt', price: '$63', brand: 'Mango' },
    { id: '11', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', title: 'Statement Necklace', price: '$89', brand: 'Tiffany' },
    { id: '12', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', title: 'Ankle Boots', price: '$134', brand: 'Steve Madden' },
  ];

  const OutfitCard: React.FC<{ id: string; image: string; title: string; price: string; brand: string }> = ({ 
    id, image, title, price, brand 
  }) => (
    <div className="glass-panel rounded-2xl overflow-hidden hover-lift group border-amber-200/20">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          className="
            absolute top-3 right-3 w-10 h-10 rounded-full
            backdrop-blur-md border border-white/20
            flex items-center justify-center
            transition-all duration-300 hover:scale-110
            bg-white/70 text-slate-600 hover:bg-white/90
          "
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <div className="text-sm text-slate-500 font-medium">{brand}</div>
        <h4 className="font-semibold text-slate-800 line-clamp-2">{title}</h4>
        <div className="text-lg font-bold brand-gold">{price}</div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[600px]">
      {/* User's Reference Image - Fixed in left top corner */}
      <div className="fixed top-32 left-6 z-20 w-48 h-64">
        <div className="glass-panel rounded-2xl p-4 border-amber-200/30">
          <h4 className="text-sm font-medium brand-gold mb-3 text-center">Your Style</h4>
          <div className="relative">
            <div className="w-full h-48 rounded-xl overflow-hidden shadow-lg border-2 border-amber-100">
              <img 
                src={uploadedImage} 
                alt="Your uploaded style" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 brand-gold-bg rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Reference</p>
        </div>
      </div>

      {/* Main content area with padding for fixed image */}
      <div className="pl-56 pt-6">
        {/* Complementary Outfits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 tab-transition">
          {complementaryOutfits.map((outfit) => (
            <OutfitCard key={outfit.id} {...outfit} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplementaryOutfits;
