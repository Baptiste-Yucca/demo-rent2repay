'use client';

import React from 'react';
import { useSidebar } from './Sidebar';
import { useNavigation } from './NavigationContext';
import GlobalConfig from './GlobalConfig';
import ConfigureR2R from './ConfigureR2R';
import CheckConfig from './CheckConfig';
import Dashboard from './Dashboard';
import Bot from './Bot';
import MaintenanceTool from './MaintenanceTool';

interface MainContentProps {
  children?: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isOpen } = useSidebar();
  const { activeItem } = useNavigation();

  // Map navigation items to components
  const renderContent = () => {
    switch (activeItem) {
      case 'global-config':
        return <GlobalConfig />;
      case 'configure-r2r':
        return <ConfigureR2R />;
      case 'check-r2r':
        return <CheckConfig />;
      case 'check-rmm':
        return <Dashboard />;
      case 'trigger-r2r':
        return <Bot />;
      case 'maintenance':
        return <MaintenanceTool />;
      default:
        return <GlobalConfig />;
    }
  };

  return (
    <main 
      className={`
        flex-1 transition-all duration-300
        ${isOpen ? 'ml-80' : 'ml-0'}
      `}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 w-full relative">
        {children}
        {renderContent()}
      </div>
    </main>
  );
}

