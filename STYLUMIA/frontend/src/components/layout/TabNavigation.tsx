
import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'similar', label: 'Similar Items' },
    { id: 'complementary', label: 'Complementary' },
    { id: 'foryou', label: 'For You' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-2 mb-8 inline-flex gap-2 border-amber-200/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-6 py-3 rounded-xl font-medium tab-transition
            ${activeTab === tab.id
              ? 'bg-white shadow-lg brand-gold tab-active border-amber-200'
              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
