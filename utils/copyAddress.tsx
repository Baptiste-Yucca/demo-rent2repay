import { useState } from 'react';
import { normalizeAddress } from './addressUtils';

export const useCopyAddress = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddress = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(normalizeAddress(address));
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return { copiedAddress, copyAddress };
};

export const AddressDisplay = ({ 
  address, 
  label, 
  color = "text-blue-400",
  showFullAddress = false 
}: { 
  address: string | undefined, 
  label: string, 
  color?: string,
  showFullAddress?: boolean 
}) => {
  const { copiedAddress, copyAddress } = useCopyAddress();
  
  if (!address) return <span className="text-gray-400">Loading...</span>;
  
  const isCopied = copiedAddress === label;
  const displayAddress = showFullAddress ? normalizeAddress(address) : `${normalizeAddress(address).slice(0, 6)}...${normalizeAddress(address).slice(-4)}`;
  
  return (
    <div className="flex items-center">
      <span className={`font-mono text-xs ${color}`}>
        {displayAddress}
      </span>
      <button
        onClick={() => copyAddress(address, label)}
        className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
        title="Copy address"
      >
        {isCopied ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};
