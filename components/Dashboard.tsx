'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getUSDCBalance, getWXDAIBalance } from '@/lib/viem';
import WalletConnect from './WalletConnect';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-600 mb-6">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to test the Rent2Repay smart contract on Gnosis Chain
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Rent2Repay Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Connected Wallet
              </h2>
              <p className="text-sm text-gray-600 font-mono break-all">
                {address}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Wallet Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={fetchBalances}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Balances'}
                </button>
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              USDC Balance
            </h3>
            {usdcBalance ? (
              <div className="text-2xl font-bold text-green-600">
                {usdcBalance.formatted} USDC
              </div>
            ) : (
              <div className="text-gray-500">
                {loading ? 'Loading...' : 'No balance data'}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              WXDAI Balance
            </h3>
            {wxdaiBalance ? (
              <div className="text-2xl font-bold text-blue-600">
                {wxdaiBalance.formatted} WXDAI
              </div>
            ) : (
              <div className="text-gray-500">
                {loading ? 'Loading...' : 'No balance data'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
