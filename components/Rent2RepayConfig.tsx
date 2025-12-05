'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { RENT2REPAY_ABI } from '@/constants';
import { normalizeAddress } from '@/utils/addressUtils';
import { EvmAddress } from '@/lib/domain/EvmAddress';

// Component for clickable address with copy functionality and GnosisScan link
const ClickableAddressDisplay = ({ 
  address, 
  label, 
  color = "text-blue-400",
  showFullAddress = false 
}: { 
  address: string | EvmAddress | undefined, 
  label: string, 
  color?: string,
  showFullAddress?: boolean 
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const evmAddress = address instanceof EvmAddress ? address : normalizeAddress(address);

  const copyAddress = async (address: EvmAddress, label: string) => {
    try {
      await navigator.clipboard.writeText(address.value());
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const openGnosisScan = (address: EvmAddress) => {
    window.open(`https://gnosisscan.io/address/${address.value()}`, '_blank');
  };

  if (!evmAddress) return <span className="text-gray-400">Loading...</span>;
  
  const isCopied = copiedAddress === label;
  const displayAddress = showFullAddress ? evmAddress.value() : evmAddress.toShortString();
  
  return (
    <div className="flex items-center">
      <button
        onClick={() => openGnosisScan(evmAddress)}
        className={`font-mono text-xs ${color} hover:underline cursor-pointer`}
        title="View on GnosisScan"
      >
        {displayAddress}
      </button>
      <button
        onClick={() => copyAddress(evmAddress, label)}
        className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
        title="Copy address"
      >
        {isCopied ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default function Rent2RepayConfig() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read contract configuration using new functions
  const { data: feeConfiguration } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getFeeConfiguration',
  });

  const { data: daoFeeReductionConfig } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getDaoFeeReductionConfiguration',
  });

  const { data: paused } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'paused',
  });

  // Debug logs
  React.useEffect(() => {
    console.log('Fee Configuration:', feeConfiguration);
    console.log('DAO Fee Reduction Config:', daoFeeReductionConfig);
    console.log('Contract Address:', process.env.NEXT_PUBLIC_R2R_PROXY);
  }, [feeConfiguration, daoFeeReductionConfig]);

  if (!mounted) {
    return (
      <div className="card p-8">
        <div className="text-center text-gray-400">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-2 font-display">Rent2Repay Configuration</h2>
      <p className="text-gray-400 text-sm mb-6">Read the contract configuration</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DAO Fees */}
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">DAO Fees</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-300">DAO Fees (BPS):</span>
              <span className="ml-2 font-mono text-blue-400">
                {feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[0] ? feeConfiguration[0].toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-400">DAO Treasury:</span>
              <div className="ml-2">
                <ClickableAddressDisplay 
                  address={daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[3] : undefined} 
                  label="dao-treasury" 
                  color="text-primary-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fee Reduction */}
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Fee Reduction</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">Reduction (BPS):</span>
              <span className="ml-2 font-mono text-primary-500">
                {daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) && daoFeeReductionConfig[2] ? daoFeeReductionConfig[2].toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Min Amount (Wei):</span>
              <span className="ml-2 font-mono text-primary-500">
                {daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) && daoFeeReductionConfig[1] ? daoFeeReductionConfig[1].toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Reduction Token:</span>
              <div className="ml-2">
                <ClickableAddressDisplay 
                  address={daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[0] : undefined} 
                  label="reduction-token" 
                  color="text-primary-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sender Tips */}
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Sender Tips</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">Tips (BPS):</span>
              <span className="ml-2 font-mono text-primary-500">
                {feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[1] ? feeConfiguration[1].toString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Status */}
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Contract Status</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">Status:</span>
              <span className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                paused ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {paused ? 'PAUSED' : 'ACTIVE'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Contract:</span>
              <div className="ml-2">
                <ClickableAddressDisplay 
                  address={process.env.NEXT_PUBLIC_R2R_PROXY} 
                  label="contract" 
                  color="text-gray-400" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-6 bg-dark-700 rounded-lg border border-dark-600">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Configuration Details</h4>
        <div className="text-xs text-gray-400 space-y-2">
          <p className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span><strong className="text-gray-300">BPS:</strong> Basis Points (1 BPS = 0.01%)</span>
          </p>
          <p className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span><strong className="text-gray-300">DAO Fees:</strong> Fees collected by the DAO treasury</span>
          </p>
          <p className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span><strong className="text-gray-300">Fee Reduction:</strong> Discount applied when using specific tokens</span>
          </p>
          <p className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span><strong className="text-gray-300">Sender Tips:</strong> Additional fees for transaction senders</span>
          </p>
        </div>
      </div>
    </div>
  );
}
