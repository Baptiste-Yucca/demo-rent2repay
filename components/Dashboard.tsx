'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getUSDCBalance, getWXDAIBalance } from '@/lib/viem';
import WalletConnect from './WalletConnect';
import { AddressDisplay } from '@/utils/copyAddress';

interface TokenBalance {
  balance: bigint;
  decimals: number;
  formatted: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [usdcBalance, setUsdcBalance] = useState<TokenBalance | null>(null);
  const [wxdaiBalance, setWxdaiBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBalances = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const [usdc, wxdai] = await Promise.all([
        getUSDCBalance(address),
        getWXDAIBalance(address),
      ]);
      
      setUsdcBalance(usdc);
      setWxdaiBalance(wxdai);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="max-w-md w-full card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4 font-display">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-300 mb-6">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="max-w-md w-full card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4 font-display">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-300 mb-6">
            Connect your wallet to test the Rent2Repay smart contract on Gnosis Chain
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-display">
            Rent2Repay Dashboard
          </h1>
          <p className="text-primary-500 font-semibold text-sm mb-6">WALLET INFORMATION</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
              <h2 className="text-lg font-semibold text-gray-200 mb-2 font-display">
                Connected Wallet
              </h2>
              <div className="text-sm text-gray-300">
                <AddressDisplay address={address} label="wallet-address" color="text-primary-500" showFullAddress={true} />
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
              <h2 className="text-lg font-semibold text-gray-200 mb-2 font-display">
                Wallet Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={fetchBalances}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Refreshing...' : 'Refresh Balances'}
                </button>
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4 font-display">
              USDC Balance
            </h3>
            {usdcBalance ? (
              <div className="text-2xl font-bold text-primary-500">
                {usdcBalance.formatted} USDC
              </div>
            ) : (
              <div className="text-gray-400">
                {loading ? 'Loading...' : 'No balance data'}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4 font-display">
              WXDAI Balance
            </h3>
            {wxdaiBalance ? (
              <div className="text-2xl font-bold text-primary-500">
                {wxdaiBalance.formatted} WXDAI
              </div>
            ) : (
              <div className="text-gray-400">
                {loading ? 'Loading...' : 'No balance data'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
