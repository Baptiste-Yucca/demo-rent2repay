'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RENT2REPAY_ABI, REPAYMENT_TOKENS } from '@/constants';
import { getTokenInfo } from '@/utils/getTokenInfo';

export default function Bot() {
  const { address } = useAccount();
  const [userAddress, setUserAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>(REPAYMENT_TOKENS[0].address);
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
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-2 font-display">Bot - Rent2Repay Execution</h2>
      <p className="text-gray-400 text-sm mb-6">Exécutez Rent2Repay pour un utilisateur</p>
      
      <form className="space-y-6">
        {/* User Addresses */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            User Address(es)
          </label>
          <textarea
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="Single: fill one address 0x...&#10;Multi: fill few addresses separated by comma 0x..., 0x..., 0x..."
            rows={3}
            className="input-field w-full"
            required
          />
          <p className="text-sm text-gray-400 mt-1">
            Single user: enter one address | Multiple users: separate addresses with commas
          </p>
        </div>

        {/* Repayment Token */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Repayment Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="input-field w-full"
          >
            {REPAYMENT_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} ({token.address})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isConfirming || isSubmitting}
            className="btn-primary w-full py-3 px-4 bg-green-600 hover:bg-green-700"
          >
            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Execute Rent2Repay'}
          </button>
          
          <button
            type="button"
            onClick={handleBatchSubmit}
            disabled={isPending || isConfirming || isSubmitting}
            className="btn-primary w-full py-3 px-4 bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Execute Batch Rent2Repay'}
          </button>
        </div>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-6 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
              Transaction Hash: <span className="font-mono">{hash}</span>
              </p>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-6 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-semibold">
              Transaction confirmed successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-6 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              Error: {error.message}
            </p>
          </div>
        )}

        {/* Current Selection Info */}
        <div className="mt-6 p-6 bg-dark-700 rounded-lg border border-dark-600">
          <h4 className="text-sm font-semibold text-gray-200 mb-2">Current Selection</h4>
          <p className="text-sm text-gray-300">
            <strong>Repayment Token:</strong> {selectedTokenInfo?.symbol} ({selectedTokenInfo?.address})
          </p>
          <p className="text-sm text-gray-300">
            <strong>User Address(es):</strong> {userAddress || 'Not specified'}
          </p>
        </div>
      </form>
    </div>
  );
}