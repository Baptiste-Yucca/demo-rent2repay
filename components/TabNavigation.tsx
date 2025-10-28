'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function TabNavigation({ tabs, defaultTab }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Calculate width for each tab
  const getTabWidth = (index: number) => {
    const totalTabs = tabs.length;
    if (totalTabs === 5) {
      if (index === 4) {
        // Last tab gets 8%
        return 'w-[8%]';
      } else {
        // First 4 tabs share 92% equally (23% each)
        return 'w-[23%]';
      }
    } else {
      // If not 5 tabs, distribute equally
      const classes = [
        'w-full',
        'w-1/2',
        'w-1/3',
        'w-1/4',
        'w-[20%]',
        'w-[16.66%]',
      ];
      return classes[totalTabs - 1] || 'flex-1';
    }
  };

  return (
    <div className="w-full">
      <div className="border-b border-dark-600">
        <nav className="flex w-full">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${getTabWidth(index)} py-3 border-b-2 font-medium text-sm transition-all duration-200 text-center rounded-t-lg ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-500 bg-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-dark-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-6">
        {activeTabData?.component}
      </div>
    </div>
  );
}
