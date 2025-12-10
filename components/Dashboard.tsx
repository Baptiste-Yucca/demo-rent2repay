'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKENS, ERC20_ABI } from '@/constants';
import WalletConnect from './WalletConnect';
import { AddressDisplay } from '@/utils/copyAddress';
import ContractInfo from './ContractInfo';
import DisconnectButton from './DisconnectButton';

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

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-full card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4 font-display">
            Rent2Repay Demo
          </h1>
          <p className="text-gray-300 mb-6">
            Connect your wallet to test the Rent2Repay smart contract on Gnosis Chain
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 font-display">
          Dashboard
        </h1>
        <p className="text-primary-500 font-semibold text-xs mb-4">WALLET INFORMATION</p>
        
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-primary-500/30 transition-colors">
            <h2 className="text-sm font-semibold text-gray-200 mb-2 font-display">
              Connected Wallet
            </h2>
            <div className="text-xs text-gray-300">
              <AddressDisplay address={address} label="wallet-address" color="text-primary-500" showFullAddress={false} />
            </div>
          </div>
          
          <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-primary-500/30 transition-colors">
            <h2 className="text-sm font-semibold text-gray-200 mb-2 font-display">
              Wallet Actions
            </h2>
            <div className="space-y-2">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="text-lg font-semibold text-white mb-3 font-display">
            USDC Balances
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-2 px-3 text-gray-300 font-semibold">Token</th>
                  <th className="text-right py-2 px-3 text-gray-300 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {usdcData.map((item, index) => (
                  <tr key={index} className="border-b border-dark-600/50">
                    <td className="py-2 px-3 text-gray-400">{item.label}</td>
                    <td className="py-2 px-3 text-right font-mono text-primary-500">
                      {formatBalance(item.balance, item.decimals)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-semibold text-white mb-3 font-display">
            WXDAI Balances
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-2 px-3 text-gray-300 font-semibold">Token</th>
                  <th className="text-right py-2 px-3 text-gray-300 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {wxdaiData.map((item, index) => (
                  <tr key={index} className="border-b border-dark-600/50">
                    <td className="py-2 px-3 text-gray-400">{item.label}</td>
                    <td className="py-2 px-3 text-right font-mono text-primary-500">
                      {formatBalance(item.balance, item.decimals)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom section with ContractInfo and Disconnect */}
      <div className="mt-auto pt-6 space-y-4 border-t border-dark-600">
        <ContractInfo showAddress={true} />
        <DisconnectButton />
      </div>
    </div>
  );
}
