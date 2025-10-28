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
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  // State for batchRent2Repay
  const [batchUsers, setBatchUsers] = useState('');
  const [batchToken, setBatchToken] = useState('');
  
  // State for authorizeTokenPair
  const [authToken, setAuthToken] = useState('');
  const [supplyToken, setSupplyToken] = useState('');
  const [debtToken, setDebtToken] = useState('');
  
  // State for unauthorizeToken
  const [unauthToken, setUnauthToken] = useState('');
  
  // State for removeUser
  const [removeUserAddress, setRemoveUserAddress] = useState('');
  
  const { writeContract, isPending, isSuccess, error, reset } = useWriteContract();

  // Reset success message after 3 seconds
  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        reset();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset]);

  const handleBatchRent2Repay = () => {
    if (!batchUsers || !batchToken) return;
    const usersArray = batchUsers.split(',').map(u => u.trim()).filter(Boolean);
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'batchRent2Repay',
      args: [usersArray as `0x${string}`[], batchToken as `0x${string}`],
    });
  };

  const handleAuthorizeTokenPair = () => {
    if (!authToken || !supplyToken || !debtToken) return;
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'authorizeTokenPair',
      args: [
        authToken as `0x${string}`,
        supplyToken as `0x${string}`,
        debtToken as `0x${string}`,
      ],
    });
  };

  const handleUnauthorizeToken = () => {
    if (!unauthToken) return;
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'unauthorizeToken',
      args: [unauthToken as `0x${string}`],
    });
  };

  const handleRemoveUser = () => {
    if (!removeUserAddress) return;
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'removeUser',
      args: [removeUserAddress as `0x${string}`],
    });
  };

  // Filter and sort actions based on user role and permissions
  const filteredAndSortedActions = useMemo(() => {
    const allActions: Array<{
      id: string;
      title: string;
      description: string;
      signature: string;
      requiredRoles: UserRole[];
      component: React.ReactNode;
    }> = [
      {
        id: 'batch',
        title: 'Batch Rent2Repay',
        description: 'Effectuer un remboursement en masse pour plusieurs utilisateurs',
        signature: 'batchRent2Repay(users[], token)',
        requiredRoles: [], // Available to all
        component: (
          <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Users (séparés par virgule)</label>
            <input
              type="text"
              value={batchUsers}
              onChange={(e) => setBatchUsers(e.target.value)}
              placeholder="0x123...,0x456..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Token Address</label>
            <input
              type="text"
              value={batchToken}
              onChange={(e) => setBatchToken(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleBatchRent2Repay}
            disabled={isPending || !batchUsers || !batchToken}
            className="btn-primary w-full text-sm py-2"
          >
            {isPending ? 'Envoi...' : 'Exécuter'}
          </button>
        </div>
      ),
    },
      {
        id: 'authorize',
        title: 'Authorize Token Pair',
        description: 'Autoriser un nouveau token pair (supply et debt token)',
        signature: 'authorizeTokenPair(token, supplyToken, debtToken)',
        requiredRoles: [], // Available to all
        component: (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Token Address</label>
            <input
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Supply Token Address</label>
            <input
              type="text"
              value={supplyToken}
              onChange={(e) => setSupplyToken(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Debt Token Address</label>
            <input
              type="text"
              value={debtToken}
              onChange={(e) => setDebtToken(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleAuthorizeTokenPair}
            disabled={isPending || !authToken || !supplyToken || !debtToken}
            className="btn-primary w-full text-sm py-2"
          >
            {isPending ? 'Envoi...' : 'Exécuter'}
          </button>
        </div>
      ),
    },
      {
        id: 'unauthorize',
        title: 'Unauthorize Token',
        description: 'Désactiver un token pair',
        signature: 'unauthorizeToken(token)',
        requiredRoles: [], // Available to all
        component: (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Token Address</label>
            <input
              type="text"
              value={unauthToken}
              onChange={(e) => setUnauthToken(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleUnauthorizeToken}
            disabled={isPending || !unauthToken}
            className="btn-primary w-full text-sm py-2"
          >
            {isPending ? 'Envoi...' : 'Exécuter'}
          </button>
        </div>
      ),
    },
      {
        id: 'remove',
        title: 'Remove User',
        description: 'Retirer un utilisateur de la configuration Rent2Repay',
        signature: 'removeUser(user)',
        requiredRoles: [UserRole.OPERATOR], // Only OPERATOR
        component: (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">User Address</label>
            <input
              type="text"
              value={removeUserAddress}
              onChange={(e) => setRemoveUserAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded text-sm text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleRemoveUser}
            disabled={isPending || !removeUserAddress}
            className="btn-primary w-full text-sm py-2"
          >
            {isPending ? 'Envoi...' : 'Exécuter'}
          </button>
        </div>
      ),
    },
  ];

    // Filter actions based on user role
    const userRoleType = userRole?.role;
    const filteredActions = allActions.filter(action => {
      // If no required roles, action is available to all
      if (action.requiredRoles.length === 0) return true;
      // If user has no role, filter out restricted actions
      if (!userRoleType) return false;
      // Check if user's role is in required roles
      return action.requiredRoles.includes(userRoleType);
    });

    // Sort actions: actions available to current role first
    const sortedActions = [...filteredActions].sort((a, b) => {
      const aIsAllowed = a.requiredRoles.length === 0 || (userRoleType && a.requiredRoles.includes(userRoleType));
      const bIsAllowed = b.requiredRoles.length === 0 || (userRoleType && b.requiredRoles.includes(userRoleType));
      
      if (aIsAllowed && !bIsAllowed) return -1;
      if (!aIsAllowed && bIsAllowed) return 1;
      return 0;
    });

    return sortedActions;
  }, [userRole?.role]);

  return (
    <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Actions disponibles ({userRole?.name})</h3>
      
      {error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error.message || 'Erreur lors de l\'appel du contrat'}</p>
        </div>
      )}
      
      {isSuccess && (
        <div className="bg-green-900 border border-green-600 rounded-lg p-3 mb-4">
          <p className="text-green-200 text-sm">Transaction envoyée avec succès !</p>
        </div>
      )}
      
      <div className="space-y-3">
        {filteredAndSortedActions.map((action) => {
          const isAllowed = action.requiredRoles.length === 0 || (userRole?.role && action.requiredRoles.includes(userRole.role));
          
          return (
          <div key={action.id} className="bg-dark-800 rounded-lg border border-dark-700">
            <button
              onClick={() => setActiveAction(activeAction === action.id ? null : action.id)}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-dark-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-300">{action.title}</h4>
                  {isAllowed && (
                    <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded">
                      Vous pouvez
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{action.description}</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  activeAction === action.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {activeAction === action.id && (
              <div className="px-4 pb-4 border-t border-dark-700 pt-4">
                <div className="mb-3">
                  <div className="text-xs text-gray-500 font-mono bg-dark-900 p-2 rounded">
                    {action.signature}
                  </div>
                </div>
                {action.component}
              </div>
            )}
          </div>
        );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-300 mb-2">Note importante</h4>
        <p className="text-xs text-yellow-200">
          Ces actions modifient directement le contrat. Assurez-vous de bien comprendre les conséquences avant d'exécuter ces fonctions.
        </p>
      </div>
    </div>
  );
}

