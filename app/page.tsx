'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dashboard from '@/components/Dashboard';
import TabNavigation from '@/components/TabNavigation';
import TokenHolder from '@/components/TokenHolder';
import CheckConfig from '@/components/CheckConfig';
import Bot from '@/components/Bot';
import Rent2RepayConfig from '@/components/Rent2RepayConfig';
import WalletConnect from '@/components/WalletConnect';

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Rent2Repay Demo</h1>
          <p className="text-gray-300">Loading...</p>
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
      id: 'checkconfig',
      label: 'Check Config',
      component: <CheckConfig />,
    },
    {
      id: 'bot',
      label: 'Bot',
      component: <Bot />,
    },
    {
      id: 'config',
      label: 'Config Rent2Repay',
      component: <Rent2RepayConfig />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">
              Rent2Repay Demo
            </h1>
            <WalletConnect />
          </div>
          
          <div className="text-sm text-gray-300">
            <p><strong className="text-gray-200">Network:</strong> Gnosis Chain (ID: 100)</p>
            <p><strong className="text-gray-200">Contract:</strong> {process.env.NEXT_PUBLIC_R2R_PROXY || 'Not configured'}</p>
          </div>
        </div>

        <TabNavigation tabs={tabs} defaultTab="tokenholder" />
      </div>
    </div>
  );
}
