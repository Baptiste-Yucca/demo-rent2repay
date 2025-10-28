import { TOKENS, REPAYMENT_TOKENS, REG_TOKEN } from '@/constants';
import { formatUnits } from 'viem';

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

// Max uint256 value
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

/**
 * Format token amount, showing "MAX" for uint256 max values
 * @param amount - The amount in wei/smallest unit
 * @param decimals - Token decimals
 * @returns Formatted amount string or "MAX"
 */
export const formatTokenAmount = (amount: bigint, decimals: number): string => {
  if (amount === MAX_UINT256) {
    return 'MAX';
  }
  return formatUnits(amount, decimals);
};

/**
 * Get token information from an address
 * @param tokenAddress - The token address to look up
 * @returns TokenInfo object with symbol and decimals
 */
export const getTokenInfo = (tokenAddress: string): TokenInfo => {
  const normalizedTokenAddress = tokenAddress.toLowerCase();
  
  // Check if it's the REG token (ERR)
  if (REG_TOKEN.toLowerCase() === normalizedTokenAddress) {
    return {
      address: tokenAddress,
      symbol: 'ERR',
      decimals: 18,
    };
  }
  
  // Check in REPAYMENT_TOKENS first
  const repaymentToken = REPAYMENT_TOKENS.find(token => 
    token.address.toLowerCase() === normalizedTokenAddress
  );
  
  if (repaymentToken) {
    return {
      address: tokenAddress,
      symbol: repaymentToken.symbol,
      decimals: repaymentToken.decimals,
    };
  }

  // Check in TOKENS object
  const tokenEntry = Object.entries(TOKENS).find(([_, address]) => 
    address.toLowerCase() === normalizedTokenAddress
  );

  if (tokenEntry) {
    const [symbol] = tokenEntry;
    // Default decimals based on token type
    const decimals = symbol.includes('USDC') ? 6 : 18;
    return {
      address: tokenAddress,
      symbol,
      decimals,
    };
  }

  // Fallback for unknown tokens
  return {
    address: tokenAddress,
    symbol: 'UNKNOWN',
    decimals: 18,
  };
};
