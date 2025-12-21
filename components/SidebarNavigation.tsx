'use client';

import React, { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { RENT2REPAY_ABI } from '@/constants';
import { getAdminRole, getOperatorRole, getEmergencyRole } from '@/utils/roleUtils';
import { useNavigation, type NavigationItem } from './NavigationContext';
import WalletConnect from './WalletConnect';
import { AddressDisplay } from '@/utils/copyAddress';
import DisconnectButton from './DisconnectButton';
import { Settings, Wrench, Search, BarChart3, Play, Shield } from 'lucide-react';

interface MenuItem {
  id: NavigationItem;
  label: string;
  icon: React.ReactNode;
  requiresRole?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'global-config', label: 'Global Config', icon: <Settings className="w-4 h-4" /> },
  { id: 'configure-r2r', label: 'Configure R2R', icon: <Wrench className="w-4 h-4" /> },
  { id: 'check-r2r', label: 'Check R2R', icon: <Search className="w-4 h-4" /> },
  { id: 'check-rmm', label: 'Check RMM', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'trigger-r2r', label: 'Trigger Rent to Repay', icon: <Play className="w-4 h-4" /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Shield className="w-4 h-4" />, requiresRole: true },
];

export default function SidebarNavigation() {
  const { activeItem, setActiveItem } = useNavigation();
  const { address, isConnected } = useAccount();

  // Check roles for maintenance menu
  const { data: hasAdminRole } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'hasRole',
    args: address ? [getAdminRole(), address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: hasOperatorRole } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'hasRole',
    args: address ? [getOperatorRole(), address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: hasEmergencyRole } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'hasRole',
    args: address ? [getEmergencyRole(), address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const hasAnyRole = useMemo(() => {
    return hasAdminRole === true || hasOperatorRole === true || hasEmergencyRole === true;
  }, [hasAdminRole, hasOperatorRole, hasEmergencyRole]);

  const handleMenuClick = (item: MenuItem) => {
    if (item.requiresRole && !hasAnyRole) {
      return; // Don't allow click if role required but not present
    }
    setActiveItem(item.id);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-2 font-display">Rent2Repay</h1>
        {isConnected && address && (
          <div className="text-xs text-gray-400 mb-2">
            <AddressDisplay address={address} label="wallet-sidebar" color="text-primary-500" showFullAddress={false} />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeItem === item.id;
          const isDisabled = item.requiresRole && !hasAnyRole;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-left transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : isDisabled
                    ? 'text-gray-500 opacity-50 cursor-not-allowed hover:bg-dark-700/50'
                    : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                }
              `}
              title={isDisabled ? 'Requires Admin, Operator, or Emergency role' : undefined}
            >
              <span className={isDisabled ? 'opacity-50' : ''}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-dark-600 space-y-4">
        {!isConnected ? (
          <WalletConnect />
        ) : (
          <DisconnectButton />
        )}
      </div>
    </div>
  );
}
