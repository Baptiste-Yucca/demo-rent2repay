'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { RENT2REPAY_ABI, PERIOD_OPTIONS, TOKENS } from '@/constants';

interface TokenAmount {
  token: string;
  amount: string;
}

export default function TokenHolder() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<TokenAmount[]>([
    { token: TOKENS.USDC, amount: '' }
  ]);
  const [period, setPeriod] = useState(0);
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const addToken = () => {
    setTokens([...tokens, { token: TOKENS.USDC, amount: '' }]);
  };

  const removeToken = (index: number) => {
    if (tokens.length > 1) {
      setTokens(tokens.filter((_, i) => i !== index));
    }
  };

  const updateToken = (index: number, field: 'token' | 'amount', value: string) => {
    const newTokens = [...tokens];
    newTokens[index] = { ...newTokens[index], [field]: value };
    setTokens(newTokens);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsSubmitting(true);
    
    try {
      const tokenAddresses = tokens.map(t => t.token as `0x${string}`);
      const amounts = tokens.map(t => parseEther(t.amount || '0'));

      writeContract({
        address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
        abi: RENT2REPAY_ABI,
        functionName: 'configureRent2Repay',
        args: [tokenAddresses, amounts, BigInt(period), BigInt(timestamp)],
      });
    } catch (err) {
      console.error('Error submitting transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPeriod = (seconds: number) => {
    if (seconds === 0) return '0 seconds';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${seconds / 60} minutes`;
    if (seconds < 86400) return `${seconds / 3600} hours`;
    return `${seconds / 86400} days`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Token Holder Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Token Amounts</h3>
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Address
                  </label>
                  <select
                    value={token.token}
                    onChange={(e) => updateToken(index, 'token', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TOKENS.USDC}>USDC ({TOKENS.USDC})</option>
                    <option value={TOKENS.WXDAI}>WXDAI ({TOKENS.WXDAI})</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={token.amount}
                    onChange={(e) => updateToken(index, 'amount', e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {tokens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeToken(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addToken}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Add Token
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Selected: {formatPeriod(period)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timestamp (Epoch)
            </label>
            <input
              type="number"
              value={timestamp}
              onChange={(e) => setTimestamp(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Current: {Math.floor(Date.now() / 1000)}
            </p>
            <button
              type="button"
              onClick={() => setTimestamp(Math.floor(Date.now() / 1000))}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Use Current Time
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending || isConfirming || isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Configure Rent2Repay'}
          </button>
        </div>

        {hash && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Transaction Hash: <span className="font-mono">{hash}</span>
            </p>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-semibold">
              Transaction confirmed successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error: {error.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
