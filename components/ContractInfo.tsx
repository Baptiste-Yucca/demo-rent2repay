'use client';

import React from 'react';
import { normalizeAddress } from '@/utils/addressUtils';
import { AddressDisplay } from '@/utils/copyAddress';
import { APP_CONFIG } from '@/constants/appConfig';

interface ContractInfoProps {
  contractAddress?: string;
  showAddress?: boolean;
}

export default function ContractInfo({ 
  contractAddress = APP_CONFIG.contract.address,
  showAddress = false
}: ContractInfoProps) {
  const evmAddress = normalizeAddress(contractAddress);

  return (
    <p className="text-sm text-gray-400">
      <strong className="text-gray-300">R2R proxy:</strong>{' '}
      {evmAddress && showAddress ? (
        <span className="inline-flex items-center">
          <AddressDisplay 
            address={evmAddress} 
            label="contract-address" 
            color="text-gray-400"
            showFullAddress={false}
          />
        </span>
      ) : (
        <span className="font-mono text-gray-400">
          {contractAddress || 'Not configured'}
        </span>
      )}
    </p>
  );
}

