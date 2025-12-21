'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKENS, ERC20_ABI } from '@/constants';
import WalletConnect from './WalletConnect';
import { AddressDisplay } from '@/utils/copyAddress';
import ContractInfo from './ContractInfo';
import DisconnectButton from './DisconnectButton';
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
  
  // Calculer le nombre de décimales nécessaires
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

  // Composant factorisé pour l'affichage du wallet connecté (comportement prévu)
  const WalletSection = () => {
    return (
      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-primary-500/30 transition-colors">
        <h2 className="text-sm font-semibold text-gray-200 mb-2 font-display">
          Connected Wallet
        </h2>
        <div className="text-xs text-gray-300">
          <AddressDisplay address={address} label="wallet-address" color="text-primary-500" showFullAddress={false} />
        </div>
      </div>
    );
  };

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

  // Cas non prévu : utilisateur non connecté - afficher uniquement WalletConnect
  if (!isConnected) {
    return (
      <div className="w-full flex flex-col h-full">
        <WalletConnect />
      </div>
    );
  }

  // Comportement prévu : utilisateur connecté - afficher le Check RMM
  return (
    <div className="w-full flex flex-col h-full">
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 font-display">
          Check RMM
        </h1>
        <p className="text-gray-400 text-sm mb-4">RMM Token Balances</p>
        <div className="space-y-4">
          <WalletSection />
        </div>
      </div>

      <div className="space-y-4">
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
  );
}
