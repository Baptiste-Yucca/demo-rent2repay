'use client';

import React from 'react';
import AppHeader from './AppHeader';
import WalletConnect from './WalletConnect';

interface AppConfigBarProps {
  showContractAddress?: boolean;
}

export default function AppConfigBar({ showContractAddress = false }: AppConfigBarProps) {
  return (
    <div className="card p-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <AppHeader />
        <WalletConnect />
      </div>
    </div>
  );
}

