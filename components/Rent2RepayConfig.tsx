'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { RENT2REPAY_ABI, ERC20_ABI, TOKENS } from '@/constants';
import { normalizeAddress } from '@/utils/addressUtils';
import { EvmAddress } from '@/domain/EvmAddress';
import { formatUnits } from 'viem';
import { getTokenInfo, formatTokenAmount } from '@/utils/getTokenInfo';

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
  const [copiedProxy, setCopiedProxy] = useState(false);
  const contractAddress = process.env.NEXT_PUBLIC_R2R_PROXY;

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

  // Get treasury address
  const treasuryAddress = daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[3] : undefined;

  // Read treasury balances for ARMM-USDC and ARMM-WXDAI
  const { data: treasuryArmmUsdcBalance } = useReadContract({
    address: TOKENS.ARMMUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: treasuryAddress ? [treasuryAddress as `0x${string}`] : undefined,
    query: { enabled: !!treasuryAddress },
  });

  const { data: treasuryArmmWxdaiBalance } = useReadContract({
    address: TOKENS.ARMMWXDAI as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: treasuryAddress ? [treasuryAddress as `0x${string}`] : undefined,
    query: { enabled: !!treasuryAddress },
  });

  // Get reduction token address and min amount
  const reductionTokenAddress = daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[0] : undefined;
  const minAmount = daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) ? daoFeeReductionConfig[1] : undefined;

  // Read user's reduction token balance (if connected)
  const { data: userReductionTokenBalance } = useReadContract({
    address: reductionTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && !!reductionTokenAddress && isConnected },
  });

  // Check if user is eligible for fee reduction
  const isUserEligible = useMemo(() => {
    if (!isConnected || !userReductionTokenBalance || !minAmount) return false;
    return userReductionTokenBalance >= minAmount;
  }, [isConnected, userReductionTokenBalance, minAmount]);

  // Calculate fee rate with discount
  const daoFeeRate = feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[0] ? Number(feeConfiguration[0] as bigint) : 0;
  const reductionRateBPS = daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) && daoFeeReductionConfig[2] ? Number(daoFeeReductionConfig[2] as bigint) : 0;
  // Calculate new DAO fee rate after reduction: DAO fees * (1 - reduction%)
  // reductionRateBPS is in basis points, so reduction% = reductionRateBPS / 10000
  const reductionPercentage = reductionRateBPS / 10000;
  const feeRateWithDiscount = daoFeeRate * (1 - reductionPercentage);

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

  const copyProxyAddress = async () => {
    if (!contractAddress) return;
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopiedProxy(true);
      setTimeout(() => setCopiedProxy(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const openGnosisScan = () => {
    if (contractAddress) {
      window.open(`https://gnosisscan.io/address/${contractAddress}`, '_blank');
    }
  };

  // Format BPS to percentage
  const formatBPS = (bps: bigint | undefined): string => {
    if (!bps) return 'Loading...';
    const percentage = Number(bps) / 100;
    return `${percentage.toFixed(2)}%`;
  };

  // Format with 2 significant digits
  const formatSignificantDigits = (value: string): string => {
    const num = parseFloat(value);
    if (num === 0 || isNaN(num)) return '0.00';
    
    const magnitude = Math.floor(Math.log10(Math.abs(num)));
    const factor = Math.pow(10, 2 - magnitude - 1);
    const rounded = Math.round(num * factor) / factor;
    
    const decimalPlaces = Math.max(0, 2 - magnitude - 1);
    return rounded.toFixed(decimalPlaces);
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-6 font-display">Rent2Repay Configuration</h2>
      
      {/* Contract Address - Compact Display */}
      <div className="mb-6 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg p-4 border border-primary-500/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Contract Address
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={openGnosisScan}
                className="font-mono text-sm text-primary-400 hover:text-primary-300 transition-colors text-left truncate"
              >
                {contractAddress}
              </button>
              <button
                onClick={copyProxyAddress}
                className={`
                  px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex-shrink-0
                  ${copiedProxy 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30'
                  }
                `}
              >
                {copiedProxy ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
              paused ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {paused ? 'Deactivated' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Grid - Square Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* DAO Fees */}
        <div className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-primary-500/30 transition-all aspect-square flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">DAO Fees</h3>
            <div className="space-y-3">
              {isUserEligible && feeRateWithDiscount === 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fee Rate with Discount</p>
                  <p className="text-lg font-bold text-green-400">No fees applied by DAO</p>
                </div>
              ) : isUserEligible ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fee Rate with Discount</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatBPS(BigInt(Math.round(feeRateWithDiscount)))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (Base: {formatBPS(feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[0] ? feeConfiguration[0] as bigint : BigInt(0))})
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fee Rate</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[0] 
                      ? formatBPS(feeConfiguration[0] as bigint)
                      : '...'}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-dark-600">
                <p className="text-xs text-gray-500 mb-1">Treasury</p>
                <ClickableAddressDisplay 
                  address={treasuryAddress} 
                  label="dao-treasury" 
                  color="text-primary-400" 
                  showFullAddress={false}
                />
              </div>
              {treasuryAddress && (
                <>
                  <div className="pt-2 border-t border-dark-600">
                    <p className="text-xs text-gray-500 mb-1">Treasury Balances</p>
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-gray-300">
                        ARMM-USDC: {treasuryArmmUsdcBalance !== undefined 
                          ? formatSignificantDigits(formatUnits(treasuryArmmUsdcBalance as bigint, 6))
                          : '...'}
                      </p>
                      <p className="text-xs font-mono text-gray-300">
                        ARMM-WXDAI: {treasuryArmmWxdaiBalance !== undefined 
                          ? formatSignificantDigits(formatUnits(treasuryArmmWxdaiBalance as bigint, 18))
                          : '...'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">Fees collected by DAO</p>
        </div>

        {/* Fee Reduction */}
        <div className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-primary-500/30 transition-all aspect-square flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Fee Reduction</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Reduction Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {daoFeeReductionConfig && Array.isArray(daoFeeReductionConfig) && daoFeeReductionConfig[2] 
                    ? formatBPS(daoFeeReductionConfig[2] as bigint)
                    : '...'}
                </p>
              </div>
              <div className="pt-2 border-t border-dark-600">
                <p className="text-xs text-gray-500 mb-1">New DAO Fee Rate</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatBPS(BigInt(Math.round(feeRateWithDiscount)))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Base: {formatBPS(feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[0] ? feeConfiguration[0] as bigint : BigInt(0))})
                </p>
              </div>
              <div className="pt-2 border-t border-dark-600">
                <p className="text-xs text-gray-500 mb-1">Token</p>
                <ClickableAddressDisplay 
                  address={reductionTokenAddress} 
                  label="reduction-token" 
                  color="text-primary-400" 
                  showFullAddress={false}
                />
              </div>
              {isConnected && reductionTokenAddress && (
                <div className="pt-2 border-t border-dark-600">
                  <p className="text-xs text-gray-500 mb-1">Your Balance</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-gray-300">
                      {userReductionTokenBalance !== undefined 
                        ? (() => {
                            const tokenInfo = getTokenInfo(reductionTokenAddress);
                            return `${formatTokenAmount(userReductionTokenBalance as bigint, tokenInfo.decimals)} ${tokenInfo.symbol}`;
                          })()
                        : '...'}
                    </p>
                    {isUserEligible && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        ✓ Eligible
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">Discount for eligible tokens</p>
        </div>

        {/* Sender Tips */}
        <div className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-primary-500/30 transition-all aspect-square flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Sender Tips</h3>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tip Rate</p>
              <p className="text-2xl font-bold text-purple-400">
                {feeConfiguration && Array.isArray(feeConfiguration) && feeConfiguration[1] 
                  ? formatBPS(feeConfiguration[1] as bigint)
                  : '...'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Additional fees for senders</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600">
        <p className="text-xs text-gray-400">
          <strong className="text-gray-300">BPS (Basis Points):</strong> 1 BPS = 0.01%. All fees and reductions are expressed in basis points.
        </p>
      </div>
    </div>
  );
}
