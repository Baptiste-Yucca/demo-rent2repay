'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { RENT2REPAY_ABI, ERC20_ABI, REG_TOKEN } from '@/constants';
import { AddressDisplay } from '@/utils/copyAddress';
import { normalizeAddresses } from '@/utils/addressUtils';
import { getTokenInfo, type TokenInfo, formatTokenAmount } from '@/utils/getTokenInfo';
import { getDebtTokenAddress } from '@/utils/debtTokenUtils';

interface UserConfig {
  tokens: string[];
  maxAmounts: bigint[];
}

// Format period in human-readable format
const formatPeriod = (seconds: bigint | undefined): string => {
  if (!seconds || seconds === BigInt(0)) return 'Not set';
  
  const totalSeconds = Number(seconds);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0) parts.push(`${secs} second${secs > 1 ? 's' : ''}`);
  
  return parts.length > 0 ? parts.join(', ') : '0 seconds';
};

// Component for individual token info
const TokenInfo = ({ 
  tokenAddress, 
  amount, 
  userAddress, 
  tokenInfo 
}: { 
  tokenAddress: string;
  amount: bigint;
  userAddress: string;
  tokenInfo: TokenInfo;
}) => {
  // Get token balance
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
  });

  // Get token allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [
      userAddress as `0x${string}`,
      process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`
    ],
  });

  const debtTokenAddress = getDebtTokenAddress(tokenAddress);
  
  // Get debt token balance
  const { data: debtBalance } = useReadContract({
    address: debtTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!debtTokenAddress,
    },
  });

  // Calculate minimum of R2R config, balance, and debt
  const r2rAmount = amount;
  const userBalance = balance && typeof balance === 'bigint' ? balance : BigInt(0);
  const debt = debtBalance && typeof debtBalance === 'bigint' ? debtBalance : BigInt(0);
  const minimum = r2rAmount < userBalance 
    ? (r2rAmount < debt ? r2rAmount : debt)
    : (userBalance < debt ? userBalance : debt);

  // Check if approval is sufficient (approval must be >= minimum)
  const approvalAmount = allowance && typeof allowance === 'bigint' ? allowance : BigInt(0);
  const hasSufficientApproval = approvalAmount >= minimum;
  const isApprovalMissing = !allowance || allowance === undefined;

  return (
    <div className="bg-dark-700 rounded-xl p-6 border border-dark-600 hover:border-primary-500/30 transition-all aspect-square flex flex-col">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white mb-3 font-display">
          {tokenInfo.symbol}
        </h3>
        
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Configured Amount</p>
            <p className="text-sm font-semibold text-green-400">
              {formatTokenAmount(r2rAmount, tokenInfo.decimals)} {tokenInfo.symbol}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-1">Your Balance</p>
            <p className="text-sm font-semibold text-blue-400">
              {balance !== undefined && typeof balance === 'bigint' 
                ? `${formatTokenAmount(balance, tokenInfo.decimals)} ${tokenInfo.symbol}`
                : 'Loading...'}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-1">Current Debt</p>
            <p className="text-sm font-semibold text-red-400">
              {debtTokenAddress 
                ? (debtBalance !== undefined && typeof debtBalance === 'bigint' 
                    ? `${formatTokenAmount(debtBalance, tokenInfo.decimals)} ${tokenInfo.symbol}`
                    : 'Loading...')
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-dark-600">
          <p className="text-xs text-gray-400 mb-1">Amount Used On-Chain</p>
          <p className="text-lg font-bold text-primary-400">
            {formatTokenAmount(minimum, tokenInfo.decimals)} {tokenInfo.symbol}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (Minimum of the 3 values above)
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-600">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">Approval Status</p>
          {isApprovalMissing ? (
            <span className="text-xs font-semibold text-red-400">Missing</span>
          ) : hasSufficientApproval ? (
            <span className="text-xs font-semibold text-green-400">✓ Sufficient</span>
          ) : (
            <span className="text-xs font-semibold text-yellow-400">⚠ Insufficient</span>
          )}
        </div>
        <p className="text-xs text-gray-300">
          Approved: {allowance !== undefined && typeof allowance === 'bigint' 
            ? formatTokenAmount(allowance, tokenInfo.decimals) 
            : '0'} {tokenInfo.symbol}
        </p>
        {!hasSufficientApproval && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
            {isApprovalMissing 
              ? '⚠ Approval missing - Rent2Repay will not work'
              : `⚠ Approval insufficient - Need at least ${formatTokenAmount(minimum, tokenInfo.decimals)} ${tokenInfo.symbol}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default function CheckConfig() {
  const [userAddress, setUserAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Read user configuration
  const { data: userConfigData, error } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getUserConfigs',
    args: shouldFetch && userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: shouldFetch && !!userAddress, // Only fetch when manually triggered
    },
  });

  // Read last repay timestamp
  const { data: lastRepayTimestamp } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getLastRepayTimestamps',
    args: shouldFetch && userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: shouldFetch && !!userAddress,
    },
  });

  // Read periodicity for user
  const { data: period } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getPeriodicity',
    args: shouldFetch && userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: shouldFetch && !!userAddress,
    },
  });

  // Read DAO fee reduction configuration
  const { data: daoConfig } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getDaoFeeReductionConfiguration',
    query: {
      enabled: shouldFetch,
    },
  });

  // Read REG_TOKEN balance for the user
  const { data: regTokenBalance } = useReadContract({
    address: REG_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: shouldFetch && userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: shouldFetch && !!userAddress,
    },
  });

  console.log('userConfigData', userConfigData);

  // Normalize addresses to EvmAddress Value Objects
  const normalizeUserConfig = (data: any): UserConfig | undefined => {
    if (!data || !Array.isArray(data) || data.length !== 2) return undefined;
    
    const [tokens, maxAmounts] = data;
    if (!Array.isArray(tokens) || !Array.isArray(maxAmounts)) return undefined;
    
    return {
      tokens: normalizeAddresses(tokens).map(addr => addr.value()),
      maxAmounts: maxAmounts.map((amount: bigint) => amount)
    };
  };

  const userConfig = normalizeUserConfig(userConfigData);

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: unknown): { formatted: string; isPast: boolean } => {
    if (!timestamp || typeof timestamp !== 'bigint' || timestamp === BigInt(0)) {
      return { formatted: 'Never', isPast: false };
    }
    const timestampNumber = Number(timestamp);
    const now = Date.now() / 1000;
    const isPast = timestampNumber <= now;
    const date = new Date(timestampNumber * 1000); // seconds → ms
    return {
      formatted: date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      isPast,
    };
  };

  // Debug logs
  React.useEffect(() => {
    if (userConfigData) {
      console.log('User config data received:', userConfigData);
      console.log('Normalized user config:', userConfig);
    }
    if (error) {
      console.error('Error fetching user config:', error);
    }
  }, [userConfigData, error, userConfig]);

  const isValidUserConfig = (config: unknown): config is UserConfig => {
    return (
      typeof config === 'object' &&
      config !== null &&
      'tokens' in config &&
      'maxAmounts' in config &&
      Array.isArray((config as UserConfig).tokens) &&
      Array.isArray((config as UserConfig).maxAmounts)
    );
  };

  const handleCheck = async () => {
    if (!userAddress) return;
    
    console.log('Checking user config for:', userAddress);
    console.log('Contract address:', process.env.NEXT_PUBLIC_R2R_PROXY);
    
    setIsChecking(true);
    setShouldFetch(true);
    
    // Reset shouldFetch after a short delay to allow for refetch
    setTimeout(() => {
      setIsChecking(false);
    }, 1000);
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-2 font-display">Check R2R Configuration</h2>
      <p className="text-gray-400 text-sm mb-6">Enter a user address to view their Rent2Repay configuration and status</p>
      
      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            User Address
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="0x..."
              className="input-field flex-1"
            />
            <button
              onClick={handleCheck}
              disabled={!userAddress || isChecking}
              className="btn-primary px-6 py-2"
            >
              {isChecking ? 'Checking...' : 'Check'}
            </button>
          </div>
        </div>

        {/* Error Section */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4">
            <h3 className="text-red-300 font-semibold mb-2">Error</h3>
            <p className="text-red-200 text-sm">
              {error.message || 'Failed to fetch user configuration'}
            </p>
          </div>
        )}

        {/* Loading Section */}
        {isChecking && (
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-3"></div>
              <span className="text-blue-300">Fetching user configuration...</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {(userConfig && userConfig.tokens && userConfig.maxAmounts) ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">
              Configuration for: <AddressDisplay address={userAddress} label="checked-user" color="text-blue-400" />
            </h3>
            
            {/* Info Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Last Repay Timestamp Section */}
              {lastRepayTimestamp && typeof lastRepayTimestamp !== 'undefined' ? (
                <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
                  <h4 className="text-md font-semibold text-gray-200 mb-3">Repayment Information</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Last Repay:</span>{' '}
                      {(() => {
                        const timestampData = formatTimestamp(lastRepayTimestamp);
                        return (
                          <span className={`font-mono ${timestampData.isPast ? 'text-green-400' : 'text-red-400'}`}>
                            {timestampData.formatted}
                          </span>
                        );
                      })()}
                    </div>
                    {period !== undefined && typeof period === 'bigint' && (
                      <div className="text-sm">
                        <span className="text-gray-400">Repayment Period:</span>{' '}
                        <span className="font-semibold text-orange-400">{formatPeriod(period)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* REG Token Balance Section */}
              {daoConfig && Array.isArray(daoConfig) ? (
                <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
                  <h4 className="text-md font-semibold text-gray-200 mb-3">DAO Eligibility</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-400">REG Balance:</span>{' '}
                      <span className={`font-mono ${
                        typeof regTokenBalance === 'bigint' && 
                        Array.isArray(daoConfig) && typeof daoConfig[1] === 'bigint' &&
                        regTokenBalance >= daoConfig[1]
                          ? 'text-green-400'
                          : typeof regTokenBalance === 'bigint' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {typeof regTokenBalance === 'bigint' 
                          ? regTokenBalance.toString() 
                          : 'Loading...'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <span>Required Minimum:</span>{' '}
                      <span className="font-mono text-gray-300">
                        {typeof daoConfig[1] === 'bigint' 
                          ? daoConfig[1].toString() 
                          : 'Loading...'}
                      </span>
                    </div>
                    {typeof regTokenBalance === 'bigint' && 
                     typeof daoConfig[1] === 'bigint' && (
                      <div className="text-sm">
                        <span className="text-gray-400">Status:</span>{' '}
                        <span className={`font-semibold ${
                          regTokenBalance >= daoConfig[1] ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {regTokenBalance >= daoConfig[1] ? 'Eligible ✓' : 'Not Eligible ✗'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Token Cards Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Configured Tokens
              </h3>
              {userConfig.tokens.length === 1 ? (
                <div className="flex justify-start">
                  <div className="w-full max-w-sm">
                    {userConfig.tokens.map((tokenAddress, index) => {
                      const tokenInfo = getTokenInfo(tokenAddress);
                      const amount = userConfig.maxAmounts[index];
                      return (
                        <TokenInfo
                          key={tokenAddress}
                          tokenAddress={tokenAddress}
                          amount={amount}
                          userAddress={userAddress}
                          tokenInfo={tokenInfo}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : userConfig.tokens.length === 2 ? (
                <div className="grid grid-cols-2 gap-4">
                  {userConfig.tokens.map((tokenAddress, index) => {
                    const tokenInfo = getTokenInfo(tokenAddress);
                    const amount = userConfig.maxAmounts[index];
                    return (
                      <TokenInfo
                        key={tokenAddress}
                        tokenAddress={tokenAddress}
                        amount={amount}
                        userAddress={userAddress}
                        tokenInfo={tokenInfo}
                      />
                    );
                  })}
                </div>
              ) : userConfig.tokens.length === 3 ? (
                <div className="grid grid-cols-3 gap-4">
                  {userConfig.tokens.map((tokenAddress, index) => {
                    const tokenInfo = getTokenInfo(tokenAddress);
                    const amount = userConfig.maxAmounts[index];
                    return (
                      <TokenInfo
                        key={tokenAddress}
                        tokenAddress={tokenAddress}
                        amount={amount}
                        userAddress={userAddress}
                        tokenInfo={tokenInfo}
                      />
                    );
                  })}
                  <div className="bg-dark-700 rounded-xl border border-dark-600 aspect-square"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {userConfig.tokens.map((tokenAddress, index) => {
                    const tokenInfo = getTokenInfo(tokenAddress);
                    const amount = userConfig.maxAmounts[index];
                    return (
                      <TokenInfo
                        key={tokenAddress}
                        tokenAddress={tokenAddress}
                        amount={amount}
                        userAddress={userAddress}
                        tokenInfo={tokenInfo}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {userConfig.tokens.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No configuration found for this user
              </div>
            )}
          </div>
        ) : null}

        {/* No Configuration Message */}
        {shouldFetch && !isChecking && !error && (!userConfig || !userConfig.tokens || userConfig.tokens.length === 0) && (
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <div className="text-center text-yellow-300">
              No configuration found for this user
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-6 bg-dark-700 rounded-lg border border-dark-600">
          <h4 className="text-sm font-semibold text-gray-200 mb-2">How it works</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• <strong>Configured Amount</strong>: Maximum amount set in Rent2Repay configuration</p>
            <p>• <strong>Your Balance</strong>: Current token balance in your wallet</p>
            <p>• <strong>Current Debt</strong>: Outstanding debt for this token</p>
            <p>• <strong>Amount Used On-Chain</strong>: The minimum of the 3 values above (this is what will be used)</p>
            <p>• <strong>Approval Status</strong>: Must be equal or higher than the amount used on-chain for Rent2Repay to work</p>
          </div>
        </div>
      </div>
    </div>
  );
}
