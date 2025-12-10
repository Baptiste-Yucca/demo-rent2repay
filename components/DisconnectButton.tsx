'use client';

import React from 'react';
import { useDisconnect } from 'wagmi';

export default function DisconnectButton() {
  const { disconnect } = useDisconnect();

  return (
    <button
      onClick={() => disconnect()}
      className="btn-danger w-full py-2 text-sm"
    >
      Disconnect
    </button>
  );
}

