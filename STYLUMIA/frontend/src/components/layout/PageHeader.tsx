
import React from 'react';

interface PageHeaderProps {
  uploadedImage: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ uploadedImage }) => {
  return (
    <div className="glass-panel shadow-lg border-amber-200/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold stylumia-gradient font-clash">Stylumia</h1>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-200 shadow-lg hover-lift">
              <img src={uploadedImage} alt="Your style reference" className="w-full h-full object-cover" />
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Searching for</div>
              <div className="text-sm font-medium brand-gold">Similar styles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
