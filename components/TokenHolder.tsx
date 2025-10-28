'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { RENT2REPAY_ABI, PERIOD_OPTIONS, REPAYMENT_TOKENS, ERC20_ABI } from '@/constants';
import { getTokenInfo } from '@/utils/getTokenInfo';

interface TokenAmount {
  token: string;
  amount: string;
}

interface ApprovalToken {
  token: string;
  amount: string;
}

export default function TokenHolder() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<TokenAmount[]>([
    { token: REPAYMENT_TOKENS[0].address, amount: '' }
  ]);
  const [approvalToken, setApprovalToken] = useState<ApprovalToken>({
    token: REPAYMENT_TOKENS[0].address,
    amount: ''
  });
  const [period, setPeriod] = useState(0);
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  React.useEffect(() => {
    if (isConfirmed || error) {
      setIsApproving(false);
      setIsSubmitting(false);
      setIsRevoking(false);
    }
  }, [isConfirmed, error]);

  const addToken = () => {
    setTokens([...tokens, { token: REPAYMENT_TOKENS[0].address, amount: '' }]);
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
      const amounts = tokens.map(t => {
        const tokenInfo = REPAYMENT_TOKENS.find(token => token.address === t.token);
        const decimals = tokenInfo?.decimals || 18;
        return parseUnits(t.amount || '0', decimals);
      });

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

  const handleApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsApproving(true);
    
    try {
      const tokenInfo = getTokenInfo(approvalToken.token);
      const amount = parseUnits(approvalToken.amount || '0', tokenInfo.decimals);

      writeContract({
        address: approvalToken.token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`, amount],
      });
    } catch (err) {
      console.error('Error approving token:', err);
      setIsApproving(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!address) return;

    setIsRevoking(true);
    
    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
        abi: RENT2REPAY_ABI,
        functionName: 'revokeRent2RepayAll',
        args: [],
      });
    } catch (err) {
      console.error('Error revoking all:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  const formatPeriod = (seconds: number) => {
    if (seconds === 0) return '0 seconds';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${seconds / 60} minutes`;
    if (seconds < 86400) return `${seconds / 3600} hours`;
    return `${seconds / 86400} days`;
  };

  if (!isConnected) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">TokenHolder Configuration</h2>
        <p className="text-gray-400 mb-4">Please connect your wallet to use this feature</p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-2 font-display">TokenHolder Configuration</h2>
      <p className="text-gray-400 text-sm mb-6">Set your tokens for Rent2Repay</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Token Amounts</h3>
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Token Address
                  </label>
                  <select
                    value={token.token}
                    onChange={(e) => updateToken(index, 'token', e.target.value)}
                    className="input-field"
                  >
                    {REPAYMENT_TOKENS.map((tokenOption) => (
                      <option key={tokenOption.address} value={tokenOption.address}>
                        {tokenOption.symbol} ({tokenOption.address})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={token.amount}
                    onChange={(e) => updateToken(index, 'amount', e.target.value)}
                    placeholder="0.0"
                    className="input-field"
                    required
                  />
                </div>
                {tokens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeToken(index)}
                    className="btn-danger px-3 py-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addToken}
              className="btn-secondary px-4 py-2"
            >
              Add Token
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="input-field"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-400 mt-1">
              Selected: {formatPeriod(period)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Timestamp (Epoch)
            </label>
              <input
                type="number"
                value={timestamp}
                onChange={(e) => setTimestamp(Number(e.target.value))}
                className="input-field"
              />
            <p className="text-sm text-gray-400 mt-1">
              Current: {Math.floor(Date.now() / 1000)}
            </p>
              <button
                type="button"
                onClick={() => setTimestamp(Math.floor(Date.now() / 1000))}
                className="btn-secondary mt-2 px-3 py-2 text-sm"
              >
                Use Current Time
              </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending || isConfirming || isSubmitting}
            className="btn-primary w-full py-3 px-4"
          >
            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Configure Rent2Repay'}
          </button>
        </div>

        {hash && (
          <div className="mt-4 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">
              Transaction Hash: <span className="font-mono">{hash}</span>
            </p>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-4 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-semibold">
              Transaction confirmed successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-6 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              Error: {error.message}
            </p>
          </div>
        )}
      </form>

      {/* Token Approval Section */}
      <div className="border-t border-dark-600 pt-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Token Approval</h3>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Token
                </label>
                <select
                  value={approvalToken.token}
                  onChange={(e) => setApprovalToken({ ...approvalToken, token: e.target.value })}
                  className="input-field"
                >
                  {REPAYMENT_TOKENS.map((tokenOption) => (
                    <option key={tokenOption.address} value={tokenOption.address}>
                      {tokenOption.symbol} ({tokenOption.address})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={approvalToken.amount}
                  onChange={(e) => setApprovalToken({ ...approvalToken, amount: e.target.value })}
                  placeholder="0.0"
                  className="input-field"
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleApproval}
              disabled={isPending || isConfirming || isApproving}
              className="btn-primary w-full py-3 px-4 bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Approve Token'}
            </button>
        </div>
      </div>

      {/* Revoke All Section */}
      <div className="border-t border-dark-600 pt-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Revoke All Approvals</h3>
        <p className="text-sm text-gray-400 mb-4">
          This will revoke all Rent2Repay approvals for all tokens.
        </p>
        <button
          onClick={handleRevokeAll}
          disabled={isPending || isConfirming || isRevoking}
          className="btn-danger w-full py-3 px-4"
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Revoke All Approvals'}
        </button>
      </div>

      {/* Status Messages */}
      {hash && (
        <div className="mt-4 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            Transaction Hash: <span className="font-mono">{hash}</span>
          </p>
        </div>
      )}

      {isConfirmed && (
        <div className="mt-4 p-6 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400 font-semibold">
            Transaction confirmed successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-6 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            Error: {error.message}
          </p>
        </div>
      )}
    </div>
  );
}