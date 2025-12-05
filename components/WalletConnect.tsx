'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect({
    mutation: {
      onError: (error) => {
        console.error('Connection error:', error.message);
      },
    },
  });
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
          <div className="text-sm bg-dark-700 px-4 py-2 rounded-lg border border-dark-600">
          <span className="text-gray-400">Connected:</span>
          <span className="font-mono text-primary-500 ml-2">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <button
          onClick={copyAddress}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
          title="Copy address"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => disconnect()}
          className="btn-danger px-4 py-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">
          {error.message}
        </div>
      )}
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="btn-primary px-4 py-2"
        >
          {isPending ? 'Connecting...' : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
