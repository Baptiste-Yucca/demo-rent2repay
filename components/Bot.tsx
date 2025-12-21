'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RENT2REPAY_ABI, REPAYMENT_TOKENS } from '@/constants';
import { getTokenInfo } from '@/utils/getTokenInfo';
import { AddressDisplay } from '@/utils/copyAddress';

type ExecutionMode = 'single' | 'batch';

export default function Bot() {
  const { address, isConnected } = useAccount();
  
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('single');
  const [selectedToken, setSelectedToken] = useState<string>(REPAYMENT_TOKENS[0].address);
  const [singleUserAddress, setSingleUserAddress] = useState('');
  const [userAddresses, setUserAddresses] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleAddUser = () => {
    setUserAddresses([...userAddresses, '']);
  };

  const handleRemoveUser = (index: number) => {
    if (userAddresses.length > 1) {
      setUserAddresses(userAddresses.filter((_, i) => i !== index));
    }
  };

  const handleUserAddressChange = (index: number, value: string) => {
    const newAddresses = [...userAddresses];
    newAddresses[index] = value;
    setUserAddresses(newAddresses);
  };

  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const getValidAddresses = (): `0x${string}`[] => {
    if (executionMode === 'single') {
      return isValidAddress(singleUserAddress) ? [singleUserAddress as `0x${string}`] : [];
    } else {
      return userAddresses
        .filter(addr => isValidAddress(addr))
        .map(addr => addr as `0x${string}`);
    }
  };

  const handleExecute = async () => {
    if (!address || !isConnected) return;

    const validAddresses = getValidAddresses();
    if (validAddresses.length === 0) return;

    setIsSubmitting(true);
    
    try {
      if (executionMode === 'single' || validAddresses.length === 1) {
        // Single execution
        writeContract({
          address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
          abi: RENT2REPAY_ABI,
          functionName: 'rent2repay',
          args: [validAddresses[0], selectedToken as `0x${string}`],
        });
      } else {
        // Batch execution
        writeContract({
          address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
          abi: RENT2REPAY_ABI,
          functionName: 'batchRent2Repay',
          args: [validAddresses, selectedToken as `0x${string}`],
        });
      }
    } catch (err) {
      console.error('Error submitting transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTokenInfo = REPAYMENT_TOKENS.find(token => token.address === selectedToken);
  const validAddresses = getValidAddresses();
  const canExecute = validAddresses.length > 0 && selectedToken;

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-2 font-display">Trigger Rent to Repay</h2>
      <p className="text-gray-400 text-sm mb-6">Execute Rent2Repay for one or multiple users</p>
      
      <div className="space-y-6">
        {/* Step 1: Execution Mode Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            Step 1: Choose execution mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setExecutionMode('single');
                setUserAddresses(['']);
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${executionMode === 'single'
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-dark-600 bg-dark-700 text-gray-300 hover:border-dark-500'
                }
              `}
            >
              <div className="text-lg font-semibold mb-1">One User</div>
              <div className="text-xs text-gray-400">Execute for a single user</div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setExecutionMode('batch');
                setSingleUserAddress('');
              }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${executionMode === 'batch'
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-dark-600 bg-dark-700 text-gray-300 hover:border-dark-500'
                }
              `}
            >
              <div className="text-lg font-semibold mb-1">Multiple Users</div>
              <div className="text-xs text-gray-400">Execute for multiple users</div>
            </button>
          </div>
        </div>

        {/* Step 2: Repayment Token Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Step 2: Select repayment token
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {REPAYMENT_TOKENS.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => setSelectedToken(token.address)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${selectedToken === token.address
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                    : 'border-dark-600 bg-dark-700 text-gray-300 hover:border-dark-500'
                  }
                `}
              >
                <div className="font-semibold text-sm">{token.symbol}</div>
              </button>
            ))}
          </div>
          {selectedTokenInfo && (
            <p className="text-xs text-gray-400 mt-2">
              Selected token: <span className="text-primary-400 font-semibold">{selectedTokenInfo.symbol}</span>
            </p>
          )}
        </div>

        {/* Step 3: User Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Step 3: {executionMode === 'single' ? 'Enter user address' : 'Select users'}
          </label>
          
          {executionMode === 'single' ? (
            <div>
              <input
                type="text"
                value={singleUserAddress}
                onChange={(e) => setSingleUserAddress(e.target.value)}
                placeholder="0x..."
                className="input-field w-full"
              />
              {singleUserAddress && isValidAddress(singleUserAddress) && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <AddressDisplay 
                      address={singleUserAddress} 
                      label="selected-user" 
                      color="text-green-400" 
                      showFullAddress={false}
                    />
                    <span className="text-xs text-green-400">✓ Valid</span>
                  </div>
                </div>
              )}
              {singleUserAddress && !isValidAddress(singleUserAddress) && (
                <p className="text-xs text-red-400 mt-1">✗ Invalid address format</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {userAddresses.map((userAddr, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={userAddr}
                      onChange={(e) => handleUserAddressChange(index, e.target.value)}
                      placeholder={`User ${index + 1} address (0x...)`}
                      className={`input-field w-full ${
                        userAddr && isValidAddress(userAddr) 
                          ? 'border-green-500/50' 
                          : userAddr && !isValidAddress(userAddr)
                          ? 'border-red-500/50'
                          : ''
                      }`}
                    />
                  </div>
                  {userAddresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(index)}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-colors flex-shrink-0"
                      title="Remove user"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddUser}
                className="w-full py-2 px-4 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg border border-dark-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span>
                Add Another User
              </button>

              {/* Valid addresses summary */}
              {validAddresses.length > 0 && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-green-400 mb-2">
                    ✓ {validAddresses.length} valid user{validAddresses.length > 1 ? 's' : ''} ready:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validAddresses.map((addr, idx) => (
                      <div key={idx} className="text-xs flex items-center gap-2">
                        <span className="text-green-400">•</span>
                        <AddressDisplay 
                          address={addr} 
                          label={`user-${idx}`} 
                          color="text-gray-300" 
                          showFullAddress={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Execute Button */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Step 4: Execute
          </label>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!canExecute || isPending || isConfirming || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all
              ${canExecute && !isPending && !isConfirming && !isSubmitting
                ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isPending ? 'Confirming transaction...' : 
             isConfirming ? 'Processing transaction...' : 
             isSubmitting ? 'Submitting transaction...' : 
             executionMode === 'single' || validAddresses.length === 1 
               ? `Execute Rent2Repay (1 user)` 
               : `Execute Batch Rent2Repay (${validAddresses.length} users)`
            }
          </button>
          {!canExecute && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please select a token and at least one valid user address
            </p>
          )}
        </div>

        {/* Transaction Status */}
        {hash && (
          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              Transaction Hash: <span className="font-mono text-xs">{hash}</span>
            </p>
          </div>
        )}

        {isConfirmed && (
          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 font-semibold">
              ✓ Transaction confirmed successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              Error: {error.message}
            </p>
          </div>
        )}

        {/* Summary */}
        {canExecute && (
          <div className="p-4 bg-dark-700 rounded-lg border border-dark-600">
            <h4 className="text-sm font-semibold text-gray-200 mb-3">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Mode:</span>
                <span className="text-gray-200 font-medium">
                  {executionMode === 'single' ? 'Single User' : 'Multiple Users'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Token:</span>
                <span className="text-primary-400 font-semibold">
                  {selectedTokenInfo?.symbol || 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Users:</span>
                <span className="text-gray-200 font-medium">
                  {validAddresses.length} valid address{validAddresses.length !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
