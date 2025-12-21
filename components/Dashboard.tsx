'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKENS, ERC20_ABI, RMM_ABI, RMM_PROXY, RENT2REPAY_ABI } from '@/constants';
import TokenBalanceTable from './TokenBalanceTable';

interface TokenBalanceData {
  balance: bigint | undefined;
  decimals: number;
  formatted: string;
}

// Fonction pour formater avec 2 chiffres significatifs
const formatSignificantDigits = (value: string): string => {
  const num = parseFloat(value);
  if (num === 0 || isNaN(num)) return '0.00';
  
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, 2 - magnitude - 1);
  const rounded = Math.round(num * factor) / factor;
  
  // Calculate the number of decimal places needed
  const decimalPlaces = Math.max(0, 2 - magnitude - 1);
  
  return rounded.toFixed(decimalPlaces);
};

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // USDC balances
  const { data: usdcBalance } = useReadContract({
    address: TOKENS.USDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: armmUsdcBalance } = useReadContract({
    address: TOKENS.ARMMUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: debtUsdcBalance } = useReadContract({
    address: TOKENS.DEBTUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // WXDAI balances
  const { data: wxdaiBalance } = useReadContract({
    address: TOKENS.WXDAI as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: armmWxdaiBalance } = useReadContract({
    address: TOKENS.ARMMWXDAI as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: debtWxdaiBalance } = useReadContract({
    address: TOKENS.DEBTWXDAI as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Format balances
  const formatBalance = (balance: unknown, decimals: number): string => {
    if (balance === undefined || balance === null) return 'Loading...';
    const balanceBigInt = typeof balance === 'bigint' ? balance : BigInt(balance as string);
    const formatted = formatUnits(balanceBigInt, decimals);
    return formatSignificantDigits(formatted);
  };

  // Read Health Factor from RMM Proxy
  const { data: userAccountData } = useReadContract({
    address: RMM_PROXY as `0x${string}`,
    abi: RMM_ABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Format Health Factor (last element of the array, with 2 decimals)
  // getUserAccountData returns: [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor]
  const healthFactorRaw = userAccountData && Array.isArray(userAccountData) && userAccountData[5] 
    ? Number(userAccountData[5] as bigint) / 1e18
    : null;
  const totalDebtBase = userAccountData && Array.isArray(userAccountData) && userAccountData[1]
    ? userAccountData[1] as bigint
    : null;
  
  // Check if there's no debt (USDC and WXDAI debt balances are 0, or totalDebtBase is 0)
  const hasNoDebt = (
    (debtUsdcBalance === undefined || debtUsdcBalance === BigInt(0)) &&
    (debtWxdaiBalance === undefined || debtWxdaiBalance === BigInt(0))
  ) || (totalDebtBase !== null && totalDebtBase === BigInt(0));
  
  // Display infinity if Health Factor > 10 or no debt
  const shouldShowInfinity = healthFactorRaw !== null && (healthFactorRaw > 10 || hasNoDebt);
  const healthFactor = shouldShowInfinity ? Infinity : healthFactorRaw;

  // Read Reserve Data for USDC and WXDAI
  const { data: usdcReserveData } = useReadContract({
    address: RMM_PROXY as `0x${string}`,
    abi: RMM_ABI,
    functionName: 'getReserveData',
    args: [TOKENS.USDC as `0x${string}`],
  });

  const { data: wxdaiReserveData } = useReadContract({
    address: RMM_PROXY as `0x${string}`,
    abi: RMM_ABI,
    functionName: 'getReserveData',
    args: [TOKENS.WXDAI as `0x${string}`],
  });

  // Read Rent2Repay fee configuration
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
    const balance = typeof userReductionTokenBalance === 'bigint' ? userReductionTokenBalance : undefined;
    if (!balance) return false;
    return balance >= minAmount;
  }, [isConnected, userReductionTokenBalance, minAmount]);

  // Typed user reduction token balance
  const typedUserReductionTokenBalance = useMemo(() => {
    return userReductionTokenBalance && typeof userReductionTokenBalance === 'bigint' 
      ? userReductionTokenBalance 
      : undefined;
  }, [userReductionTokenBalance]);

  // Calculate borrowing rates
  const calculateRates = (
    reserveData: any,
    feeConfig: any,
    reductionConfig: any,
    userBalance: bigint | undefined
  ): { nominal: number | null; effective: number | null } => {
    if (!reserveData || !feeConfig) {
      return { nominal: null, effective: null };
    }

    // ReserveData structure from ABI (tuple returned as array):
    // [0: configuration (tuple), 1: liquidityIndex (uint128), 2: currentLiquidityRate (uint128), 
    //  3: variableBorrowIndex (uint128), 4: currentVariableBorrowRate (uint128), 5: currentStableBorrowRate (uint128), ...]
    // currentVariableBorrowRate is at index 4
    let borrowRateRay: bigint | undefined;
    
    // Temporary debug to understand data structure (will be removed after fixing)
    if (process.env.NODE_ENV === 'development' && reserveData) {
      console.log('ReserveData structure:', {
        isArray: Array.isArray(reserveData),
        length: Array.isArray(reserveData) ? reserveData.length : 'N/A',
        index4: Array.isArray(reserveData) && reserveData.length > 4 ? reserveData[4] : 'N/A',
        typeIndex4: Array.isArray(reserveData) && reserveData.length > 4 ? typeof reserveData[4] : 'N/A'
      });
    }
    
    if (Array.isArray(reserveData) && reserveData.length > 4) {
      const rateValue = reserveData[4];
      if (rateValue !== null && rateValue !== undefined) {
        if (typeof rateValue === 'bigint') {
          borrowRateRay = rateValue;
        } else if (typeof rateValue === 'number') {
          borrowRateRay = BigInt(Math.floor(rateValue));
        } else if (typeof rateValue === 'string') {
          borrowRateRay = BigInt(rateValue);
        }
      }
    } else if (reserveData && typeof reserveData === 'object' && !Array.isArray(reserveData)) {
      // Fallback: try to access as object property (in case wagmi returns it differently)
      if ('currentVariableBorrowRate' in reserveData) {
        const rateValue = (reserveData as any).currentVariableBorrowRate;
        if (rateValue !== null && rateValue !== undefined) {
          if (typeof rateValue === 'bigint') {
            borrowRateRay = rateValue;
          } else if (typeof rateValue === 'number') {
            borrowRateRay = BigInt(Math.floor(rateValue));
          } else if (typeof rateValue === 'string') {
            borrowRateRay = BigInt(rateValue);
          }
        }
      }
    }
    
    if (!borrowRateRay) {
      return { nominal: null, effective: null };
    }

    // Convert from RAY to nominal rate
    const nominalRate = Number(borrowRateRay) / 1e27;

    // Calculate user fees with reduction if eligible
    const feeConfigArray = Array.isArray(feeConfig) ? feeConfig : [feeConfig.daoFees, feeConfig.senderTips];
    const daoFees = Number(feeConfigArray[0] as bigint);
    let userFees = daoFees;

    if (reductionConfig && Array.isArray(reductionConfig) && userBalance && minAmount) {
      const isEligible = userBalance >= minAmount;
      if (isEligible) {
        const reductionRateBPS = Number(reductionConfig[2] as bigint);
        const reductionPercentage = reductionRateBPS / 10000;
        userFees = daoFees * (1 - reductionPercentage);
      }
    }

    const senderTips = Number(feeConfigArray[1] as bigint);
    const totalFeesBPS = userFees + senderTips;
    const feesPercentage = totalFeesBPS / 10000;

    // Prevent division by zero or negative
    if (feesPercentage >= 1) {
      return { nominal: nominalRate, effective: null };
    }

    // Calculate effective rate: taux effectif = taux nominal / (1 - frais)
    const effectiveRate = nominalRate / (1 - feesPercentage);

    return { nominal: nominalRate, effective: effectiveRate };
  };

  // Calculate rates for USDC and WXDAI
  const usdcRates = useMemo(() => {
    return calculateRates(
      usdcReserveData,
      feeConfiguration,
      daoFeeReductionConfig,
      typedUserReductionTokenBalance
    );
  }, [usdcReserveData, feeConfiguration, daoFeeReductionConfig, typedUserReductionTokenBalance]);

  const wxdaiRates = useMemo(() => {
    return calculateRates(
      wxdaiReserveData,
      feeConfiguration,
      daoFeeReductionConfig,
      typedUserReductionTokenBalance
    );
  }, [wxdaiReserveData, feeConfiguration, daoFeeReductionConfig, typedUserReductionTokenBalance]);

  // Format rate as percentage
  const formatRate = (rate: number | null): string => {
    if (rate === null || rate === undefined || isNaN(rate)) return '—';
    return `${(rate * 100).toFixed(4)}%`;
  };

  const usdcData = [
    { label: 'USDC', balance: usdcBalance, decimals: 6 },
    { label: 'ARMM_USDC', balance: armmUsdcBalance, decimals: 6 },
    { label: 'DEBT_USDC', balance: debtUsdcBalance, decimals: 6 },
  ];

  const wxdaiData = [
    { label: 'WXDAI', balance: wxdaiBalance, decimals: 18 },
    { label: 'ARMM_WXDAI', balance: armmWxdaiBalance, decimals: 18 },
    { label: 'DEBT_WXDAI', balance: debtWxdaiBalance, decimals: 18 },
  ];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-full card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4 font-display">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-300 mb-6">Loading...</p>
        </div>
      </div>
    );
  }

  // Expected behavior: connected user - display Check RMM
  return (
    <div className="w-full flex flex-col h-full">
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 font-display">
          Check RMM
        </h1>
        <p className="text-gray-400 text-sm mb-4">RMM Token Balances</p>
        
        {/* Health Factor */}
        {isConnected && (
          <div className="mb-6 bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-primary-500/30 transition-colors">
            <h2 className="text-sm font-semibold text-gray-200 mb-2 font-display">
              Health Factor
            </h2>
            <div className="text-2xl font-bold text-primary-400">
              {healthFactor === null ? 'Loading...' : healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
            </div>
          </div>
        )}

        {/* Borrowing Rates */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 font-display">
              Borrowing Rates
            </h2>
            {isUserEligible && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                ✓ Fee reduction applied
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* USDC Borrowing Rate */}
            <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
              <h3 className="text-md font-semibold text-gray-200 mb-4">USDC Borrowing Rate</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nominal Rate</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatRate(usdcRates.nominal)}
                  </p>
                </div>
                <div className="pt-3 border-t border-dark-600">
                  <p className="text-xs text-gray-400 mb-1">Effective Rate (with R2R fees)</p>
                  <p className="text-xl font-bold text-primary-400">
                    {formatRate(usdcRates.effective)}
                  </p>
                </div>
              </div>
            </div>

            {/* WXDAI Borrowing Rate */}
            <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 hover:border-primary-500/30 transition-colors">
              <h3 className="text-md font-semibold text-gray-200 mb-4">WXDAI Borrowing Rate</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nominal Rate</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatRate(wxdaiRates.nominal)}
                  </p>
                </div>
                <div className="pt-3 border-t border-dark-600">
                  <p className="text-xs text-gray-400 mb-1">Effective Rate (with R2R fees)</p>
                  <p className="text-xl font-bold text-primary-400">
                    {formatRate(wxdaiRates.effective)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* USDC and WXDAI Balances on the same line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TokenBalanceTable 
            title="USDC Balances" 
            data={usdcData} 
            formatBalance={formatBalance}
          />
          <TokenBalanceTable 
            title="WXDAI Balances" 
            data={wxdaiData} 
            formatBalance={formatBalance}
          />
        </div>
      </div>
    </div>
  );
}
