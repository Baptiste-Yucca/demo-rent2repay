'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { RENT2REPAY_ABI } from '@/constants';
import { normalizeAddress } from '@/utils/addressUtils';

// Component for clickable address with copy functionality and GnosisScan link
const ClickableAddressDisplay = ({ 
  address, 
  label, 
  color = "text-blue-400",
  showFullAddress = false 
}: { 
  address: string | undefined, 
  label: string, 
  color?: string,
  showFullAddress?: boolean 
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddress = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(normalizeAddress(address));
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const openGnosisScan = (address: string) => {
    const normalizedAddr = normalizeAddress(address);
    window.open(`https://gnosisscan.io/address/${normalizedAddr}`, '_blank');
  };

  if (!address) return <span className="text-gray-400">Loading...</span>;
  
  const isCopied = copiedAddress === label;
  const displayAddress = showFullAddress ? normalizeAddress(address) : `${normalizeAddress(address).slice(0, 6)}...${normalizeAddress(address).slice(-4)}`;
  
  return (
    <div className="flex items-center">
      <button
        onClick={() => openGnosisScan(address)}
        className={`font-mono text-xs ${color} hover:underline cursor-pointer`}
        title="View on GnosisScan"
      >
        {displayAddress}
      </button>
      <button
        onClick={() => copyAddress(address, label)}
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
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <div className="text-center text-gray-400">Loading configuration...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <div className="text-center text-gray-400">Please connect your wallet to view configuration</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Rent2Repay Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DAO Fees */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">DAO Fees</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-300">DAO Fees (BPS):</span>
              <span className="ml-2 font-mono text-blue-400">
                {feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[0] ? feeConfiguration[0].toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-300">DAO Treasury:</span>
              <div className="ml-2">
                <ClickableAddressDisplay 
                  address={daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[3] : undefined} 
                  label="dao-treasury" 
                  color="text-blue-400" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fee Reduction */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Fee Reduction</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-300">Reduction (BPS):</span>
              <span className="ml-2 font-mono text-green-400">
                {daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) && daoFeeReductionConfig[2] ? daoFeeReductionConfig[2].toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-300">Min Amount:</span>
              <span className="ml-2 font-mono text-green-400">
                {daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) && daoFeeReductionConfig[1] ? daoFeeReductionConfig[1].toString() : 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-300">Reduction Token:</span>
              <div className="ml-2">
                <ClickableAddressDisplay 
                  address={daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[0] : undefined} 
                  label="reduction-token" 
                  color="text-green-400" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sender Tips */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Sender Tips</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-300">Tips (BPS):</span>
              <span className="ml-2 font-mono text-purple-400">
                {feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[1] ? feeConfiguration[1].toString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Status */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Contract Status</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-300">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                paused ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
              }`}>
                {paused ? 'PAUSED' : 'ACTIVE'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-300">Contract:</span>
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
      <div className="mt-6 p-4 bg-gray-700 rounded-md border border-gray-600">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Configuration Details</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>• <strong>BPS</strong>: Basis Points (1 BPS = 0.01%)</p>
          <p>• <strong>DAO Fees</strong>: Fees collected by the DAO treasury</p>
          <p>• <strong>Fee Reduction</strong>: Discount applied when using specific tokens</p>
          <p>• <strong>Sender Tips</strong>: Additional fees for transaction senders</p>
        </div>
      </div>
    </div>
  );
}
