'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dashboard from '@/components/Dashboard';
import TabNavigation from '@/components/TabNavigation';
import TokenHolder from '@/components/TokenHolder';
import Bot from '@/components/Bot';
import WalletConnect from '@/components/WalletConnect';

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Rent2Repay Demo</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <Dashboard />;
  }

  const tabs = [
    {
      id: 'tokenholder',
      label: 'Token Holder',
      component: <TokenHolder />,
    },
    {
      id: 'bot',
      label: 'Bot',
      component: <Bot />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Rent2Repay Demo
            </h1>
            <WalletConnect />
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Network:</strong> Gnosis Chain (ID: 100)</p>
            <p><strong>Contract:</strong> {process.env.NEXT_PUBLIC_R2R_PROXY || 'Not configured'}</p>
          </div>
        </div>

        <TabNavigation tabs={tabs} defaultTab="tokenholder" />
      </div>
    </div>
  );
}
