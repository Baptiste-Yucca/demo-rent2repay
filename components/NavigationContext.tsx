'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type NavigationItem = 
  | 'global-config'
  | 'configure-r2r'
  | 'check-r2r'
  | 'check-rmm'
  | 'trigger-r2r'
  | 'maintenance';

interface NavigationContextType {
  activeItem: NavigationItem;
  setActiveItem: (item: NavigationItem) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
  defaultItem?: NavigationItem;
}

export function NavigationProvider({ children, defaultItem = 'global-config' }: NavigationProviderProps) {
  const [activeItem, setActiveItem] = useState<NavigationItem>(defaultItem);

  return (
    <NavigationContext.Provider value={{ activeItem, setActiveItem }}>
      {children}
    </NavigationContext.Provider>
  );
}
