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
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4 font-display">Rent2Repay Demo</h1>
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
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white font-display">
                Rent2Repay Demo
              </h1>
              <p className="text-primary-500 font-semibold text-sm mt-1">
                Don't hesitate to report bug at @BaptisteYucca on Telegram
              </p>
            </div>
            <WalletConnect />
          </div>
          
          <div className="text-sm text-gray-400">
            <p><strong className="text-gray-300">Network:</strong> Gnosis Chain (ID: 100)</p>
            <p><strong className="text-gray-300">Contract:</strong> {process.env.NEXT_PUBLIC_R2R_PROXY || 'Not configured'}</p>
          </div>
        </div>

        <TabNavigation tabs={tabs} defaultTab="tokenholder" />
      </div>
    </div>
  );
}
