'use client';

import React from 'react';
import { useSidebar } from './Sidebar';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isOpen } = useSidebar();

  return (
    <main 
      className={`
        flex-1 transition-all duration-300
        ${isOpen ? 'ml-80' : 'ml-0'}
      `}
    >
      {children}
    </main>
  );
}

