'use client';

import React, { useState, useEffect } from 'react';
import ConnectionBanner from '@/components/ConnectionBanner';
import AppConfigBar from '@/components/AppConfigBar';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import Footer from '@/components/Footer';
import { NavigationProvider } from '@/components/NavigationContext';
import { APP_CONFIG } from '@/constants/appConfig';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4 font-display">{APP_CONFIG.title}</h1>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationProvider defaultItem="global-config">
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <ConnectionBanner />
        <div className="flex flex-1 relative">
          <Sidebar defaultOpen={true}>
            <MainContent>
              <AppConfigBar />
            </MainContent>
          </Sidebar>
        </div>
        <Footer />
      </div>
    </NavigationProvider>
  );
}
