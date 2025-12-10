'use client';

import React, { useState, useEffect } from 'react';
import TabNavigation from '@/components/TabNavigation';
import TokenHolder from '@/components/TokenHolder';
import CheckConfig from '@/components/CheckConfig';
import Bot from '@/components/Bot';
import Rent2RepayConfig from '@/components/Rent2RepayConfig';
import MaintenanceTool from '@/components/MaintenanceTool';
import ConnectionBanner from '@/components/ConnectionBanner';
import AppConfigBar from '@/components/AppConfigBar';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import Footer from '@/components/Footer';
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

  const tabs = [
    {
      id: 'tokenholder',
      label: 'TokenHolder',
      component: <TokenHolder />,
    },
    {
      id: 'checkconfig',
      label: 'Check TokenHolder Config',
      component: <CheckConfig />,
    },
    {
      id: 'bot',
      label: 'Bot (Trigger Rent2Repay)',
      component: <Bot />,
    },
    {
      id: 'config',
      label: 'Config Rent2Repay',
      component: <Rent2RepayConfig />,
    },
    {
      id: 'maintenance',
      label: '+',
      component: <MaintenanceTool />,
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <ConnectionBanner />
      <div className="flex flex-1 relative">
        <Sidebar defaultOpen={true}>
          <MainContent>
            <div className="max-w-6xl mx-auto px-4 py-8 w-full">
              <AppConfigBar />
              <TabNavigation tabs={tabs} defaultTab="tokenholder" />
            </div>
          </MainContent>
        </Sidebar>
      </div>
      <Footer />
    </div>
  );
}
