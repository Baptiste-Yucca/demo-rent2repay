'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect({
    mutation: {
      onError: (error) => {
        console.error('Connection error:', error.message);
      },
    },
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
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
}
