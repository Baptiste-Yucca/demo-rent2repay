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

type ConfigStep = 'check' | 'token-selection' | 'timestamp-selection' | 'approval' | 'summary' | 'complete';

export default function ConfigureR2R() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [hasConfig, setHasConfig] = useState<boolean | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [configStep, setConfigStep] = useState<ConfigStep>('check');
  const [configuredTokens, setConfiguredTokens] = useState<TokenConfig[]>([]);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
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
    
    // If max tokens reached, move to timestamp
    if (newTokens.length >= 4) {
      setConfigStep('timestamp-selection');
    }
    // Otherwise, modal will ask if user wants to add more
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
      args: [tokenAddresses, amounts, BigInt(0), BigInt(selectedTimestamp)],
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
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Configure R2R</h2>
        <p className="text-gray-400 text-sm mb-6">Your current Rent2Repay configuration</p>

        <div className="space-y-4 mb-6">
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
      <div className="card p-8">
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
        onContinueToTimestamp={() => setConfigStep('timestamp-selection')}
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
      <div className="card p-8">
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
  const [selectedToken, setSelectedToken] = useState(REPAYMENT_TOKENS[0].address);
  const [amount, setAmount] = useState('');

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
      onConfigure(selectedToken, amount);
      // Reset form for next token
      setSelectedToken(availableTokens.find(t => t.address !== selectedToken)?.address || availableTokens[0]?.address || REPAYMENT_TOKENS[0].address);
      setAmount('');
    }
  };

  const canAddMore = configuredTokens.length < 4 && availableTokens.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white font-display">
            Configure Token {currentIndex + 1} {configuredTokens.length < 4 ? `(Max 4)` : ''}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Which token do you want to configure?
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="input-field w-full"
            >
              {availableTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
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

          <div className="flex gap-4">
            <button type="submit" className="btn-primary flex-1 py-2" disabled={!canAddMore && configuredTokens.length > 0}>
              {canAddMore ? 'Configure' : 'Max Tokens Reached'}
            </button>
            {configuredTokens.length > 0 && (
              <button
                type="button"
                onClick={onContinueToTimestamp}
                className="btn-secondary flex-1 py-2"
              >
                Continue to Next Step
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
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white font-display">When should Rent2Repay activate?</h3>
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
              <span className="text-gray-200">ASAP (As Soon As Possible)</span>
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
              <span className="text-gray-200">Schedule for later</span>
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
  const needsApproval = !allowance || allowance < requiredAmount;

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
      <p className="text-gray-400 mb-6">You need to approve the following tokens before configuring Rent2Repay:</p>

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

// Summary Step Component
function SummaryStep({
  configuredTokens,
  selectedTimestamp,
  onSubmit,
  onBack,
  isPending,
}: {
  configuredTokens: TokenConfig[];
  selectedTimestamp: number | null;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  const activationDate = selectedTimestamp
    ? new Date(selectedTimestamp * 1000).toLocaleString('fr-FR')
    : 'ASAP';

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-4 font-display">Configuration Summary</h2>
      <p className="text-gray-400 mb-6">Review your Rent2Repay configuration before submitting:</p>

      <div className="space-y-4 mb-6">
        <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
          <h3 className="text-lg font-semibold text-white mb-3">Configured Tokens</h3>
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
