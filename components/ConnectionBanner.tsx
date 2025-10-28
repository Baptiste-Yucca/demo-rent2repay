'use client';

import React from 'react';
import { useAccount } from 'wagmi';

export default function ConnectionBanner() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return null;
  }

  return (
    <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-yellow-300 font-medium">Please connect to use this app</span>
        </div>
      </div>
    </div>
  );
}
