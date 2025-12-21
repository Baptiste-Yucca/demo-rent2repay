'use client';

import React, { useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { RENT2REPAY_ABI } from '@/constants';
import { getOperatorRole, getAdminRole, getEmergencyRole, UserRole } from '@/utils/roleUtils';

// Define permissions for each function
const FUNCTION_PERMISSIONS: Record<string, UserRole[]> = {
  batch: [], // Available to all roles
  authorize: [], // Available to all roles
  unauthorize: [], // Available to all roles
  remove: [UserRole.OPERATOR], // Only OPERATOR
  pause: [UserRole.EMERGENCY], // Only EMERGENCY
  unpause: [UserRole.ADMIN], // Only ADMIN
  // Add more as needed
};

export default function MaintenanceTool(): React.ReactElement {
  const { address, isConnected } = useAccount();

  // Check ADMIN_ROLE
  const { data: hasAdminRole } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'hasRole',
    args: address ? [getAdminRole(), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check OPERATOR_ROLE
  const { data: hasOperatorRole } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'hasRole',
    args: address ? [getOperatorRole(), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check EMERGENCY_ROLE
  const { data: hasEmergencyRole } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'hasRole',
    args: address ? [getEmergencyRole(), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Determine which role the user has (priority: ADMIN > EMERGENCY > OPERATOR)
  const userRole = useMemo(() => {
    if (hasAdminRole === true) return { role: UserRole.ADMIN, name: 'Admin' };
    if (hasEmergencyRole === true) return { role: UserRole.EMERGENCY, name: 'Emergency' };
    if (hasOperatorRole === true) return { role: UserRole.OPERATOR, name: 'Operator' };
    return null;
  }, [hasAdminRole, hasOperatorRole, hasEmergencyRole]);

  const isLoading = hasAdminRole === undefined || hasOperatorRole === undefined || hasEmergencyRole === undefined;
  const hasAnyRole = userRole !== null;

  if (!isConnected) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Maintenance Tools</h2>
        <p className="text-gray-400 mb-4">Please connect your wallet to use this feature</p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-2 font-display">Maintenance Tools</h2>
      <p className="text-gray-400 text-sm mb-6">Maintenance tools for operators</p>
      
      <div className="space-y-6">
        {/* Role Status */}
        {isLoading ? (
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-3"></div>
              <span className="text-blue-300">Role checking...</span>
            </div>
          </div>
        ) : hasAnyRole && userRole ? (
          <div className="bg-green-900 border border-green-600 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-green-300 font-semibold">You are {userRole.name}</h3>
                <p className="text-green-200 text-sm mt-1">
                  You have the necessary permissions to use the maintenance tools.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-red-300 font-semibold">You are not</h3>
                <p className="text-red-200 text-sm mt-1">Admin, Operator or Emergency</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {hasAnyRole && <OperatorActions userRole={userRole} />}
      </div>
    </div>
  );
}

// Component for interactive operator actions
function OperatorActions({ userRole }: { userRole: { role: UserRole; name: string } | null }) {
  const [removeUserAddress, setRemoveUserAddress] = useState('');
  
  // Read contract paused state
  const { data: isPaused } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'paused',
  });
  
  const { writeContract, isPending, isSuccess, error, reset } = useWriteContract();

  // Reset success message after 3 seconds
  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        reset();
        setRemoveUserAddress(''); // Clear input after success
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset]);

  // Handle pause (EMERGENCY only)
  const handlePause = () => {
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'pause',
      args: [],
    });
  };

  // Handle unpause (ADMIN only)
  const handleUnpause = () => {
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'unpause',
      args: [],
    });
  };

  // Handle remove user (OPERATOR only)
  const handleRemoveUser = () => {
    if (!removeUserAddress) return;
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'removeUser',
      args: [removeUserAddress as `0x${string}`],
    });
  };

  // Validate Ethereum address format
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  return (
    <div className="space-y-6">
      {/* Contract Status */}
      <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Contract Status</h3>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="text-gray-300">
            {isPaused === undefined ? 'Loading...' : isPaused ? 'Contract paused' : 'Contract active'}
          </span>
        </div>
      </div>

      {/* EMERGENCY: Pause */}
      {userRole?.role === UserRole.EMERGENCY && (
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Emergency Control</h3>
          {isPaused === undefined ? (
            <p className="text-gray-400 text-sm">Loading status...</p>
          ) : isPaused ? (
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-yellow-200 text-sm font-semibold mb-2">
                ⚠️ Contract is already paused
              </p>
              <p className="text-yellow-300/80 text-xs">
                The contract is currently paused. Only an administrator can resume the contract.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">
                Pausing the contract will prevent all Rent2Repay operations until an administrator resumes it.
              </p>
              <button
                onClick={handlePause}
                disabled={isPending}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Pausing...' : 'Pause Contract'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADMIN: Unpause */}
      {userRole?.role === UserRole.ADMIN && (
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Resume Contract</h3>
          <p className="text-gray-400 text-sm mb-4">
            As an administrator, you can resume the contract after it has been paused by an emergency role.
          </p>
          {isPaused === undefined ? (
            <p className="text-gray-400 text-sm">Loading status...</p>
          ) : !isPaused ? (
            <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
              <p className="text-green-200 text-sm font-semibold">
                ✓ Contract is active
              </p>
              <p className="text-green-300/80 text-xs mt-1">
                No action needed. The contract is functioning normally.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-4">
                <p className="text-yellow-200 text-sm font-semibold mb-1">
                  ⚠️ Contract paused
                </p>
                <p className="text-yellow-300/80 text-xs">
                  The contract has been paused. You can resume it to allow all Rent2Repay operations again.
                </p>
              </div>
              <button
                onClick={handleUnpause}
                disabled={isPending}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Resuming...' : 'Resume Contract'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* OPERATOR: Revoke User Config */}
      {userRole?.role === UserRole.OPERATOR && (
        <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 font-display">Revoke User Configuration</h3>
          <p className="text-gray-400 text-sm mb-4">
            Revoke all Rent2Repay configurations for a specific user. This action will remove all token configurations for the selected user.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User address to revoke
              </label>
              <input
                type="text"
                value={removeUserAddress}
                onChange={(e) => setRemoveUserAddress(e.target.value.trim())}
                placeholder="0x..."
                className={`w-full px-4 py-3 bg-dark-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                  removeUserAddress && !isValidAddress(removeUserAddress)
                    ? 'border-red-500 focus:ring-red-500'
                    : removeUserAddress && isValidAddress(removeUserAddress)
                    ? 'border-green-500/50 focus:ring-green-500'
                    : 'border-dark-600 focus:ring-primary-500'
                }`}
              />
              {removeUserAddress && !isValidAddress(removeUserAddress) && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span>✗</span> Invalid address
                </p>
              )}
              {removeUserAddress && isValidAddress(removeUserAddress) && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <span>✓</span> Valid address
                </p>
              )}
            </div>
            <button
              onClick={handleRemoveUser}
              disabled={isPending || !removeUserAddress || !isValidAddress(removeUserAddress)}
              className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Processing...' : 'Revoke Configuration'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Function: <code className="bg-dark-900 px-2 py-1 rounded text-gray-400">removeUser(address)</code>
            </p>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-4">
          <p className="text-red-200 text-sm font-semibold mb-1">Error</p>
          <p className="text-red-300 text-xs">{error.message || 'Error calling contract'}</p>
        </div>
      )}
      
      {isSuccess && (
        <div className="bg-green-900 border border-green-600 rounded-lg p-4">
          <p className="text-green-200 text-sm font-semibold">✓ Transaction sent successfully!</p>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Warning</h4>
        <p className="text-xs text-yellow-200">
          These actions directly modify the contract. Make sure you understand the consequences before executing these functions.
        </p>
      </div>
    </div>
  );
}

