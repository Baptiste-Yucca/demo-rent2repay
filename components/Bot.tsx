'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RENT2REPAY_ABI, REPAYMENT_TOKENS } from '@/constants';

export default function Bot() {
  const { address } = useAccount();
  const [userAddress, setUserAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState(REPAYMENT_TOKENS[0].address);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !userAddress) return;

    setIsSubmitting(true);
    
    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
        abi: RENT2REPAY_ABI,
        functionName: 'rent2repay',
        args: [userAddress as `0x${string}`, selectedToken as `0x${string}`],
      });
    } catch (err) {
      console.error('Error submitting transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !userAddress) return;

    setIsSubmitting(true);
    
    try {
      // Split user addresses by comma and clean them
      const users = userAddress
        .split(',')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0) as `0x${string}`[];

      writeContract({
        address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
        abi: RENT2REPAY_ABI,
        functionName: 'batchRent2Repay',
        args: [users, selectedToken as `0x${string}`],
      });
    } catch (err) {
      console.error('Error submitting batch transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTokenInfo = REPAYMENT_TOKENS.find(token => token.address === selectedToken);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bot - Rent2Repay Execution</h2>
      
      <div className="space-y-8">
        {/* Single User Repayment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Single User Repayment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Address
              </label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repayment Token
              </label>
              <div className="space-y-2">
                {REPAYMENT_TOKENS.map((token) => (
                  <label key={token.address} className="flex items-center">
                    <input
                      type="radio"
                      name="repaymentToken"
                      value={token.address}
                      checked={selectedToken === token.address}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {token.symbol} ({token.address})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming || isSubmitting}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Execute Rent2Repay'}
            </button>
          </form>
        </div>

        {/* Batch Repayment */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Batch User Repayment</h3>
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Addresses (comma-separated)
              </label>
              <textarea
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x..., 0x..., 0x..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple addresses separated by commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repayment Token
              </label>
              <div className="space-y-2">
                {REPAYMENT_TOKENS.map((token) => (
                  <label key={token.address} className="flex items-center">
                    <input
                      type="radio"
                      name="batchRepaymentToken"
                      value={token.address}
                      checked={selectedToken === token.address}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {token.symbol} ({token.address})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming || isSubmitting}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Execute Batch Rent2Repay'}
            </button>
          </form>
        </div>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
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

        {/* Current Selection Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Selection</h4>
          <p className="text-sm text-gray-600">
            <strong>Repayment Token:</strong> {selectedTokenInfo?.symbol} ({selectedTokenInfo?.address})
          </p>
          <p className="text-sm text-gray-600">
            <strong>User Address:</strong> {userAddress || 'Not specified'}
          </p>
        </div>
      </div>
    </div>
  );
}
