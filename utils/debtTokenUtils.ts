import { TOKENS } from '@/constants';

/**
 * Get the associated debt token address for a given token address
 * @param tokenAddress - The token address to check
 * @returns The debt token address, or null if not found
 */
export const getDebtTokenAddress = (tokenAddress: string): string | null => {
  const normalizedTokenAddress = tokenAddress.toLowerCase();
  
  // USDC and ARMM_USDC use DEBT_USDC
  if (normalizedTokenAddress === TOKENS.USDC.toLowerCase() || 
      normalizedTokenAddress === TOKENS.ARMMUSDC.toLowerCase()) {
    return TOKENS.DEBTUSDC;
  }
  
  // WXDAI and ARMM_WXDAI use DEBT_WXDAI
  if (normalizedTokenAddress === TOKENS.WXDAI.toLowerCase() || 
      normalizedTokenAddress === TOKENS.ARMMWXDAI.toLowerCase()) {
    return TOKENS.DEBTWXDAI;
  }
  
  return null;
};
