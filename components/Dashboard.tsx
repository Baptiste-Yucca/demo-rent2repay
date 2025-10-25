'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getUSDCBalance, getWXDAIBalance } from '@/lib/viem';
import WalletConnect from './WalletConnect';
import { AddressDisplay } from '@/utils/copyAddress';
import { normalizeAddress } from '@/utils/addressUtils';

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-300 mb-6">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">
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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-6">
            Rent2Repay Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">
                Connected Wallet
              </h2>
              <div className="text-sm text-gray-300">
                <AddressDisplay address={address} label="wallet-address" color="text-gray-300" showFullAddress={true} />
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">
                Wallet Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={fetchBalances}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Balances'}
                </button>
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              USDC Balance
            </h3>
            {usdcBalance ? (
              <div className="text-2xl font-bold text-green-400">
                {usdcBalance.formatted} USDC
              </div>
            ) : (
              <div className="text-gray-400">
                {loading ? 'Loading...' : 'No balance data'}
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              WXDAI Balance
            </h3>
            {wxdaiBalance ? (
              <div className="text-2xl font-bold text-blue-400">
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
