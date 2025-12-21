'use client';

import React, { useState, createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

interface SidebarProps {
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

export default function Sidebar({ defaultOpen = true, children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      <>
        {/* Sidebar */}
        <aside
          className={`
            fixed left-0 top-0 h-screen z-40
            bg-dark-800 border-r border-dark-600
            transition-all duration-300 ease-in-out
            overflow-hidden
            flex flex-col
            ${isOpen ? 'w-80' : 'w-0'}
          `}
        >
          <div className={`h-full flex flex-col overflow-y-auto ${isOpen ? 'p-4' : 'hidden'}`}>
            <SidebarNavigation />
          </div>
        </aside>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`
            fixed left-0 bottom-4 z-50
            bg-dark-700 hover:bg-dark-600
            border border-dark-600 hover:border-primary-500
            rounded-r-lg p-2
            transition-all duration-300 ease-in-out
            ${isOpen ? 'translate-x-80' : 'translate-x-0'}
          `}
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-300" />
          )}
        </button>

        {/* Overlay pour mobile */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {children}
      </>
    </SidebarContext.Provider>
  );
}

