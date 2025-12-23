'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { RENT2REPAY_ABI, REPAYMENT_TOKENS, ERC20_ABI } from '@/constants';
import { getTokenInfo, formatTokenAmount } from '@/utils/getTokenInfo';
import { AddressDisplay } from '@/utils/copyAddress';
import { normalizeAddresses } from '@/utils/addressUtils';
import { X } from 'lucide-react';

interface TokenConfig {
  token: string;
  amount: string;
}

interface UserConfig {
  tokens: string[];
  maxAmounts: bigint[];
}

type ConfigStep = 'check' | 'token-selection' | 'periodicity-selection' | 'timestamp-selection' | 'approval' | 'summary' | 'complete';

export default function ConfigureR2R() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [hasConfig, setHasConfig] = useState<boolean | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [configStep, setConfigStep] = useState<ConfigStep>('check');
  const [configuredTokens, setConfiguredTokens] = useState<TokenConfig[]>([]);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(5); // Default to 5 seconds (minimum)
  const [customPeriod, setCustomPeriod] = useState<string>('');
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [needsApproval, setNeedsApproval] = useState<string[]>([]);
  const [approvingToken, setApprovingToken] = useState<string | null>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read user configuration
  const { data: userConfigData, refetch: refetchConfig } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getUserConfigs',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Read periodicity
  const { data: period } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getPeriodicity',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Read last repay timestamp
  const { data: lastRepayTimestamp } = useReadContract({
    address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
    abi: RENT2REPAY_ABI,
    functionName: 'getLastRepayTimestamps',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has config
  useEffect(() => {
    if (userConfigData && Array.isArray(userConfigData) && userConfigData.length === 2) {
      const [tokens, maxAmounts] = userConfigData;
      if (Array.isArray(tokens) && Array.isArray(maxAmounts) && tokens.length > 0) {
        setHasConfig(true);
        setUserConfig({
          tokens: normalizeAddresses(tokens).map(addr => addr.value()),
          maxAmounts: maxAmounts.map((amt: bigint) => amt),
        });
      } else {
        setHasConfig(false);
      }
    } else if (userConfigData && Array.isArray(userConfigData) && userConfigData[0]?.length === 0) {
      setHasConfig(false);
    }
  }, [userConfigData]);

  // Check approvals when moving to approval step
  useEffect(() => {
    if (configStep === 'approval' && configuredTokens.length > 0 && address) {
      // We'll check approvals in the ApprovalStep component
      // For now, assume all tokens need approval
      setNeedsApproval(configuredTokens.map(t => t.token));
    }
  }, [configStep, configuredTokens, address]);

  // Handle configuration success
  useEffect(() => {
    if (isConfirmed && configStep === 'complete') {
      refetchConfig();
      setTimeout(() => {
        setConfigStep('check');
        setConfiguredTokens([]);
        setSelectedTimestamp(null);
        setSelectedDate('');
        setSelectedTime('');
      }, 3000);
    }
  }, [isConfirmed, configStep, refetchConfig]);

  const handleStartConfiguration = () => {
    setConfigStep('token-selection');
    setCurrentTokenIndex(0);
    setConfiguredTokens([]);
  };

  const handleTokenConfigured = (token: string, amount: string) => {
    const newTokens = [...configuredTokens, { token, amount }];
    setConfiguredTokens(newTokens);
    setCurrentTokenIndex(newTokens.length);
    // Stay on token selection modal - user can add more or continue
  };

  const handleContinueWithCurrentTokens = () => {
    // User has at least 1 token configured, move to periodicity selection
    if (configuredTokens.length > 0) {
      setConfigStep('periodicity-selection');
    }
  };

  const handlePeriodicitySelected = () => {
    let finalPeriod = selectedPeriod;
    
    if (useCustomPeriod && customPeriod) {
      const customValue = parseInt(customPeriod, 10);
      // Ensure minimum of 5 seconds (Gnosis block time)
      finalPeriod = Math.max(5, customValue);
    }
    
    setSelectedPeriod(finalPeriod);
    setConfigStep('timestamp-selection');
  };

  const handleTimestampSelected = (useASAP: boolean) => {
    if (useASAP) {
      setSelectedTimestamp(Math.floor(Date.now() / 1000));
      setConfigStep('approval');
    } else {
      // User will select date/time
    }
  };

  const handleDateTimeSelected = () => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      setSelectedTimestamp(Math.floor(dateTime.getTime() / 1000));
      setConfigStep('approval');
    }
  };

  const handleApproveToken = async (tokenAddress: string) => {
    if (!address) return;
    setApprovingToken(tokenAddress);
    const tokenConfig = configuredTokens.find(t => t.token === tokenAddress);
    if (!tokenConfig) return;

    const tokenInfo = getTokenInfo(tokenAddress);
    const amount = parseUnits(tokenConfig.amount || '0', tokenInfo.decimals);

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`, amount],
    });
  };

  // Reset approving token when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && approvingToken) {
      setApprovingToken(null);
      // Remove from needsApproval list
      setNeedsApproval(prev => prev.filter(token => token !== approvingToken));
    }
  }, [isConfirmed, approvingToken]);

  const handleSubmitConfiguration = () => {
    if (!address || !selectedTimestamp) return;

    const tokenAddresses = configuredTokens.map(t => t.token as `0x${string}`);
    const amounts = configuredTokens.map(t => {
      const tokenInfo = getTokenInfo(t.token);
      return parseUnits(t.amount || '0', tokenInfo.decimals);
    });

    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'configureRent2Repay',
      args: [tokenAddresses, amounts, BigInt(selectedPeriod), BigInt(selectedTimestamp)],
    });

    setConfigStep('complete');
  };

  const handleRevokeConfig = async () => {
    if (!address) return;
    writeContract({
      address: process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`,
      abi: RENT2REPAY_ABI,
      functionName: 'revokeRent2RepayAll',
      args: [],
    });
  };

  if (!mounted) {
    return (
      <div className="card p-8">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Configure R2R</h2>
        <p className="text-gray-400 mb-4">Please connect your wallet to configure Rent2Repay</p>
      </div>
    );
  }

  // Show existing configuration
  if (hasConfig && userConfig && configStep === 'check') {
    return (
      <div className="card p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Configure R2R</h2>
        <p className="text-gray-400 text-sm mb-6">Your current Rent2Repay configuration</p>

        <div className="space-y-4 mb-6 w-full max-w-2xl">
          {userConfig.tokens.map((tokenAddress, index) => {
            const tokenInfo = getTokenInfo(tokenAddress);
            const amount = userConfig.maxAmounts[index];
            return (
              <div key={tokenAddress} className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{tokenInfo.symbol}</h3>
                    <p className="text-sm text-gray-400">{formatTokenAmount(amount, tokenInfo.decimals)} {tokenInfo.symbol}</p>
                    <AddressDisplay address={tokenAddress} label={`token-${index}`} color="text-gray-500" showFullAddress={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleStartConfiguration}
            className="btn-primary px-6 py-2"
          >
            Modify Configuration
          </button>
          <button
            onClick={handleRevokeConfig}
            disabled={isPending || isConfirming}
            className="btn-danger px-6 py-2"
          >
            {isPending || isConfirming ? 'Processing...' : 'Remove Configuration'}
          </button>
        </div>

        {isConfirmed && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">Configuration removed successfully!</p>
          </div>
        )}
      </div>
    );
  }

  // No configuration - start setup
  if (hasConfig === false && configStep === 'check') {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Configure R2R</h2>
        <p className="text-gray-400 text-sm mb-6">You don't have a Rent2Repay configuration yet</p>
        <button
          onClick={handleStartConfiguration}
          className="btn-primary px-6 py-2"
        >
          Configure Rent2Repay
        </button>
      </div>
    );
  }

  // Token selection modal
  if (configStep === 'token-selection') {
    return (
      <TokenSelectionModal
        onConfigure={(token, amount) => {
          handleTokenConfigured(token, amount);
        }}
        onClose={() => setConfigStep('check')}
        configuredTokens={configuredTokens}
        currentIndex={currentTokenIndex}
        onContinueToTimestamp={handleContinueWithCurrentTokens}
      />
    );
  }

  // Periodicity selection modal
  if (configStep === 'periodicity-selection') {
    return (
      <PeriodicitySelectionModal
        selectedPeriod={selectedPeriod}
        customPeriod={customPeriod}
        useCustomPeriod={useCustomPeriod}
        onPeriodChange={setSelectedPeriod}
        onCustomPeriodChange={setCustomPeriod}
        onUseCustomChange={setUseCustomPeriod}
        onContinue={handlePeriodicitySelected}
        onBack={() => setConfigStep('token-selection')}
      />
    );
  }

  // Timestamp selection modal
  if (configStep === 'timestamp-selection') {
    return (
      <TimestampSelectionModal
        onSelectASAP={() => handleTimestampSelected(true)}
        onSelectDateTime={() => {
          if (selectedDate && selectedTime) {
            handleDateTimeSelected();
          }
        }}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        onClose={() => setConfigStep('check')}
      />
    );
  }

  // Approval step
  if (configStep === 'approval') {
    return (
      <ApprovalStep
        configuredTokens={configuredTokens}
        needsApproval={needsApproval}
        approvingToken={approvingToken}
        onApprove={handleApproveToken}
        onContinue={() => setConfigStep('summary')}
        isPending={isPending || isConfirming}
        address={address}
      />
    );
  }

  // Summary step
  if (configStep === 'summary') {
    return (
      <SummaryStep
        configuredTokens={configuredTokens}
        selectedPeriod={selectedPeriod}
        selectedTimestamp={selectedTimestamp}
        onSubmit={handleSubmitConfiguration}
        onBack={() => setConfigStep('timestamp-selection')}
        isPending={isPending || isConfirming}
      />
    );
  }

  // Complete step
  if (configStep === 'complete') {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Configuration Complete!</h2>
        {isConfirmed ? (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">Your Rent2Repay configuration has been successfully submitted!</p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">Transaction pending...</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Token Selection Modal Component
function TokenSelectionModal({
  onConfigure,
  onClose,
  configuredTokens,
  currentIndex,
  onContinueToTimestamp,
}: {
  onConfigure: (token: string, amount: string) => void;
  onClose: () => void;
  configuredTokens: TokenConfig[];
  currentIndex: number;
  onContinueToTimestamp: () => void;
}) {
  const [selectedToken, setSelectedToken] = useState<string>(REPAYMENT_TOKENS[0].address);
  const [amount, setAmount] = useState('');
  const [justConfigured, setJustConfigured] = useState(false);
  const [lastConfiguredToken, setLastConfiguredToken] = useState<{ token: string; amount: string } | null>(null);

  const availableTokens = REPAYMENT_TOKENS.filter(
    token => !configuredTokens.some(ct => ct.token.toLowerCase() === token.address.toLowerCase())
  );

  // Update selected token when available tokens change
  useEffect(() => {
    if (availableTokens.length > 0 && !availableTokens.some(t => t.address === selectedToken)) {
      setSelectedToken(availableTokens[0].address);
    }
  }, [availableTokens, selectedToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedToken && amount) {
      const tokenInfo = REPAYMENT_TOKENS.find(t => t.address === selectedToken);
      setLastConfiguredToken({ token: selectedToken, amount });
      onConfigure(selectedToken, amount);
      setJustConfigured(true);
      // Reset form for next token
      if (availableTokens.length > 1) {
        const nextToken = availableTokens.find(t => t.address !== selectedToken);
        setSelectedToken(nextToken?.address || availableTokens[0]?.address || REPAYMENT_TOKENS[0].address);
      }
      setAmount('');
    }
  };

  const canAddMore = configuredTokens.length < 4 && availableTokens.length > 0;
  const hasAtLeastOne = configuredTokens.length > 0;

  // Show confirmation message after configuring a token
  if (justConfigured && lastConfiguredToken) {
    const tokenInfo = REPAYMENT_TOKENS.find(t => t.address === lastConfiguredToken.token);
    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white font-display">Token Added</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                <strong>{tokenInfo?.symbol}</strong> added with amount <strong>{lastConfiguredToken.amount}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                <strong>{configuredTokens.length}</strong> token{configuredTokens.length > 1 ? 's' : ''} configured
              </p>
              {canAddMore && (
                <p className="text-gray-400 text-xs">
                  You can add up to 4 tokens total
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => {
                    setJustConfigured(false);
                    setLastConfiguredToken(null);
                  }}
                  className="btn-primary w-full py-2"
                >
                  Add Another Token
                </button>
              )}
              {hasAtLeastOne && (
                <button
                  type="button"
                  onClick={onContinueToTimestamp}
                  className="btn-secondary w-full py-2"
                >
                  Continue ({configuredTokens.length}/4)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white font-display">
            {hasAtLeastOne 
              ? `Configure Token ${currentIndex + 1} (${configuredTokens.length} configured, Max 4)`
              : `Configure Token ${currentIndex + 1} (Max 4)`
            }
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasAtLeastOne && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs">
              {configuredTokens.length} token{configuredTokens.length > 1 ? 's' : ''} configured. Add more or continue.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Select token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="input-field w-full"
              disabled={availableTokens.length === 0}
            >
              {availableTokens.length > 0 ? (
                availableTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))
              ) : (
                <option>No more tokens available</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              className="btn-primary w-full py-2" 
              disabled={!canAddMore || availableTokens.length === 0}
            >
              {canAddMore ? 'Add Token' : 'Maximum reached (4/4)'}
            </button>
              {hasAtLeastOne && (
                <button
                  type="button"
                  onClick={onContinueToTimestamp}
                  className="btn-secondary w-full py-2"
                >
                  Continue ({configuredTokens.length}/4)
                </button>
              )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Timestamp Selection Modal Component
function TimestampSelectionModal({
  onSelectASAP,
  onSelectDateTime,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onClose,
}: {
  onSelectASAP: () => void;
  onSelectDateTime: () => void;
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onClose: () => void;
}) {
  const [useASAP, setUseASAP] = useState(true);
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white font-display">When should Rent2Repay start?</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={useASAP}
                onChange={() => setUseASAP(true)}
                className="w-4 h-4"
              />
              <span className="text-gray-200">As soon as possible</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="radio"
                checked={!useASAP}
                onChange={() => setUseASAP(false)}
                className="w-4 h-4"
              />
              <span className="text-gray-200">Schedule for a specific date and time</span>
            </label>

            {!useASAP && (
              <div className="ml-7 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    min={minDate}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Time</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={useASAP ? onSelectASAP : onSelectDateTime}
              disabled={!useASAP && (!selectedDate || !selectedTime)}
              className="btn-primary flex-1 py-2"
            >
              Continue
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 py-2">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Token Approval Item Component
function TokenApprovalItem({
  tokenConfig,
  address,
  onApprove,
  approvingToken,
  isPending,
  onApprovalStatus,
}: {
  tokenConfig: TokenConfig;
  address: string | undefined;
  onApprove: (token: string) => void;
  approvingToken: string | null;
  isPending: boolean;
  onApprovalStatus: (needsApproval: boolean) => void;
}) {
  const { data: allowance } = useReadContract({
    address: tokenConfig.token as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address as `0x${string}`, process.env.NEXT_PUBLIC_R2R_PROXY as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const tokenInfo = getTokenInfo(tokenConfig.token);
  const requiredAmount = parseUnits(tokenConfig.amount || '0', tokenInfo.decimals);
  const allowanceBigInt = allowance && typeof allowance === 'bigint' ? allowance : BigInt(0);
  const needsApproval = !allowance || allowanceBigInt < requiredAmount;

  useEffect(() => {
    onApprovalStatus(needsApproval);
  }, [needsApproval, onApprovalStatus]);

  if (!needsApproval) {
    return null;
  }

  return (
    <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{tokenInfo.symbol}</h3>
          <p className="text-sm text-gray-400">
            Amount: {tokenConfig.amount} {tokenInfo.symbol}
          </p>
        </div>
        <button
          onClick={() => onApprove(tokenConfig.token)}
          disabled={isPending || approvingToken === tokenConfig.token}
          className="btn-primary px-4 py-2"
        >
          {approvingToken === tokenConfig.token ? 'Approving...' : 'Approve'}
        </button>
      </div>
    </div>
  );
}

// Approval Step Component
function ApprovalStep({
  configuredTokens,
  needsApproval,
  approvingToken,
  onApprove,
  onContinue,
  isPending,
  address,
}: {
  configuredTokens: TokenConfig[];
  needsApproval: string[];
  approvingToken: string | null;
  onApprove: (token: string) => void;
  onContinue: () => void;
  isPending: boolean;
  address: string | undefined;
}) {
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, boolean>>({});

  const handleApprovalStatus = (token: string, needsApproval: boolean) => {
    setApprovalStatuses(prev => ({ ...prev, [token]: needsApproval }));
  };

  const allApproved = configuredTokens.every(
    tokenConfig => approvalStatuses[tokenConfig.token] === false
  );

  useEffect(() => {
    if (allApproved && configuredTokens.length > 0) {
      // Auto-continue when all approved
      const timer = setTimeout(() => {
        onContinue();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allApproved, configuredTokens.length, onContinue]);

  if (allApproved && configuredTokens.length > 0) {
    return (
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-4 font-display">Token Approvals</h2>
        <p className="text-gray-400 mb-4">All tokens are approved. Continuing to summary...</p>
      </div>
    );
  }

  return (
    <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-4 font-display">Token Approvals Required</h2>
        <p className="text-gray-400 mb-6">Approve the following tokens to allow Rent2Repay to use them:</p>

      <div className="space-y-4">
        {configuredTokens.map((tokenConfig) => (
          <TokenApprovalItem
            key={tokenConfig.token}
            tokenConfig={tokenConfig}
            address={address}
            onApprove={onApprove}
            approvingToken={approvingToken}
            isPending={isPending}
            onApprovalStatus={(needsApproval) => handleApprovalStatus(tokenConfig.token, needsApproval)}
          />
        ))}
      </div>
    </div>
  );
}

// Periodicity Selection Modal Component
function PeriodicitySelectionModal({
  selectedPeriod,
  customPeriod,
  useCustomPeriod,
  onPeriodChange,
  onCustomPeriodChange,
  onUseCustomChange,
  onContinue,
  onBack,
}: {
  selectedPeriod: number;
  customPeriod: string;
  useCustomPeriod: boolean;
  onPeriodChange: (period: number) => void;
  onCustomPeriodChange: (period: string) => void;
  onUseCustomChange: (use: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const periodOptions = [
    { label: '5 seconds (minimum)', value: 5 },
    { label: '1 hour', value: 3600 },
    { label: '1 day', value: 86400 },
    { label: '1 week', value: 604800 },
    { label: '1 month', value: 2592000 },
    { label: 'Other', value: -1 },
  ];

  const formatPeriod = (seconds: number): string => {
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    if (seconds < 3600) return `${seconds / 60} minute${seconds / 60 !== 1 ? 's' : ''}`;
    if (seconds < 86400) return `${seconds / 3600} hour${seconds / 3600 !== 1 ? 's' : ''}`;
    if (seconds < 604800) return `${seconds / 86400} day${seconds / 86400 !== 1 ? 's' : ''}`;
    if (seconds < 2592000) return `${seconds / 604800} week${seconds / 604800 !== 1 ? 's' : ''}`;
    return `${seconds / 2592000} month${seconds / 2592000 !== 1 ? 's' : ''}`;
  };

  const handleCustomPeriodChange = (value: string) => {
    onCustomPeriodChange(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      // Ensure minimum of 5 seconds
      const finalValue = Math.max(5, numValue);
      onPeriodChange(finalValue);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white font-display">Select Repayment Period</h3>
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Choose how often Rent2Repay should execute. This applies to all configured tokens.
          </p>

          <div className="space-y-2">
            {periodOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!useCustomPeriod && selectedPeriod === option.value}
                  onChange={() => {
                    if (option.value === -1) {
                      onUseCustomChange(true);
                    } else {
                      onUseCustomChange(false);
                      onPeriodChange(option.value);
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-200">{option.label}</span>
              </label>
            ))}
          </div>

          {useCustomPeriod && (
            <div className="ml-7 space-y-2">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Custom period (in seconds)
              </label>
              <input
                type="number"
                min="5"
                step="1"
                value={customPeriod}
                onChange={(e) => handleCustomPeriodChange(e.target.value)}
                placeholder="Enter seconds (minimum 5)"
                className="input-field w-full"
              />
              {customPeriod && !isNaN(parseInt(customPeriod, 10)) && (
                <p className="text-xs text-gray-400">
                  {formatPeriod(selectedPeriod)} (minimum 5 seconds for Gnosis block time)
                </p>
              )}
            </div>
          )}

          {!useCustomPeriod && (
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs">
                Selected: {formatPeriod(selectedPeriod)}
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onBack} className="btn-secondary flex-1 py-2">
              Back
            </button>
            <button
              onClick={onContinue}
              disabled={useCustomPeriod && (!customPeriod || parseInt(customPeriod, 10) < 5)}
              className="btn-primary flex-1 py-2"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Step Component
function SummaryStep({
  configuredTokens,
  selectedPeriod,
  selectedTimestamp,
  onSubmit,
  onBack,
  isPending,
}: {
  configuredTokens: TokenConfig[];
  selectedPeriod: number;
  selectedTimestamp: number | null;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  const activationDate = selectedTimestamp
    ? new Date(selectedTimestamp * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'As soon as possible';

  const formatPeriod = (seconds: number): string => {
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    if (seconds < 3600) return `${seconds / 60} minute${seconds / 60 !== 1 ? 's' : ''}`;
    if (seconds < 86400) return `${seconds / 3600} hour${seconds / 3600 !== 1 ? 's' : ''}`;
    if (seconds < 604800) return `${seconds / 86400} day${seconds / 86400 !== 1 ? 's' : ''}`;
    if (seconds < 2592000) return `${seconds / 604800} week${seconds / 604800 !== 1 ? 's' : ''}`;
    return `${seconds / 2592000} month${seconds / 2592000 !== 1 ? 's' : ''}`;
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-4 font-display">Review Configuration</h2>
      <p className="text-gray-400 mb-6">Please review your settings before submitting:</p>

      <div className="space-y-4 mb-6">
        <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-3">Tokens</h3>
          {configuredTokens.map((tokenConfig, index) => {
            const tokenInfo = getTokenInfo(tokenConfig.token);
            return (
              <div key={index} className="mb-2">
                <p className="text-gray-300">
                  {tokenInfo.symbol}: {tokenConfig.amount} {tokenInfo.symbol}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-2">Repayment Period</h3>
          <p className="text-gray-300">{formatPeriod(selectedPeriod)}</p>
        </div>

        <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-2">Activation Time</h3>
          <p className="text-gray-300">{activationDate}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="btn-secondary flex-1 py-2">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="btn-primary flex-1 py-2"
        >
          {isPending ? 'Submitting...' : 'Submit Configuration'}
        </button>
      </div>
    </div>
  );
}
