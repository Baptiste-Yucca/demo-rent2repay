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
  console.log('tokenAddress', tokenAddress);
  console.log('userAddress', userAddress);
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
  });
  console.log('balance', balance);

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

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <span className="text-lg font-semibold text-white">
          {tokenInfo.symbol}
        </span>
        <div className="ml-3">
          <AddressDisplay 
            address={tokenAddress} 
            label={`token-${tokenAddress}`} 
            color="text-gray-400" 
          />
        </div>
      </div>
      <div className="ml-4 space-y-1">
        <div className="text-sm text-gray-300">
          <span className="text-green-400">R2R:</span> {formatTokenAmount(amount, tokenInfo.decimals)} {tokenInfo.symbol}
        </div>
        <div className="text-sm text-gray-300">
          <span className="text-blue-400">Balance:</span> {balance !== undefined && typeof balance === 'bigint' ? formatTokenAmount(balance, tokenInfo.decimals) : 'Loading...'} {tokenInfo.symbol}
        </div>
        <div className="text-sm text-gray-300">
          <span className="text-red-400">Debt:</span> {debtTokenAddress ? (debtBalance !== undefined && typeof debtBalance === 'bigint' ? formatTokenAmount(debtBalance, tokenInfo.decimals) : 'Loading...') : 'N/A'} {tokenInfo.symbol}
        </div>
        <div className="text-sm text-gray-300">
          <span className="text-purple-400">Approval:</span> {allowance !== undefined && typeof allowance === 'bigint' ? formatTokenAmount(allowance, tokenInfo.decimals) : 'Loading...'} {tokenInfo.symbol}
        </div>
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

  // Normalize addresses to lowercase
  const normalizeUserConfig = (data: any): UserConfig | undefined => {
    if (!data || !Array.isArray(data) || data.length !== 2) return undefined;
    
    const [tokens, maxAmounts] = data;
    if (!Array.isArray(tokens) || !Array.isArray(maxAmounts)) return undefined;
    
    return {
      tokens: normalizeAddresses(tokens),
      maxAmounts: maxAmounts.map((amount: bigint) => amount)
    };
  };

  const userConfig = normalizeUserConfig(userConfigData);

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: unknown): string => {
    if (!timestamp || typeof timestamp !== 'bigint' || timestamp === BigInt(0)) {
      return 'Never';
    }
    const timestampNumber = Number(timestamp);
    const date = new Date(timestampNumber * 1000); // seconds → ms
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
      <h2 className="text-2xl font-bold text-white mb-2 font-display">Check User Configuration</h2>
      <p className="text-gray-400 text-sm mb-6">Fill any user address to check their Rent2Repay configuration</p>
      
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
            <div className="grid grid-cols-1 gap-4">
              {/* Last Repay Timestamp Section */}
              {lastRepayTimestamp && typeof lastRepayTimestamp !== 'undefined' ? (
                <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
                  <h4 className="text-md font-semibold text-gray-200 mb-3">Repayment Information</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Last Repay:</span>{' '}
                      <span className="font-mono text-green-400">
                        {formatTimestamp(lastRepayTimestamp)}
                      </span>
                    </div>
                    {period !== undefined && typeof period === 'bigint' && (
                      <div className="text-sm text-gray-400">
                        <span>Period:</span>{' '}
                        <span className="font-mono text-orange-400">{period.toString()} seconds</span>
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
            
            <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
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
          <h4 className="text-sm font-semibold text-gray-200 mb-2">Instructions</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Enter a user address to check their Rent2Repay configuration</p>
            <p>• <strong>Last Repay</strong>: Timestamp of the last repayment executed</p>
            <p>• <strong>Period</strong>: Period in seconds for the repayment cycle</p>
            <p>• <strong>R2R</strong>: Maximum amount configured for each token</p>
            <p>• <strong>Balance</strong>: Current token balance of the user</p>
            <p>• <strong>Approval</strong>: Approved amount for Rent2Repay contract</p>
            <p>• <strong>Debt</strong>: Current debt amount for the associated debt token</p>
          </div>
        </div>
      </div>
    </div>
  );
}
