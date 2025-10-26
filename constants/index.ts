// Gnosis Chain Configuration
export const GNOSIS_CHAIN_ID = 100;

// Token addresses on Gnosis Chain
export const TOKENS = {
  USDC: '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83',
  WXDAI: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  ARMMUSDC: '0xed56f76e9cbc6a64b821e9c016eafbd3db5436d1',
  ARMMWXDAI: '0x0ca4f5554dd9da6217d62d8df2816c82bba4157b',
  DEBTUSDC: '0x69c731ae5f5356a779f44c355abb685d84e5e9e6',
  DEBTWXDAI: '0x9908801df7902675c3fedd6fea0294d18d5d5d34',
} as const;

// Period options in seconds
export const PERIOD_OPTIONS = [
  { label: '0 seconds', value: 0 },
  { label: '5 seconds', value: 5 },
  { label: '1 minute', value: 60 },
  { label: '1 hour', value: 3600 },
  { label: '1 day', value: 86400 },
  { label: '1 week', value: 604800 },
] as const;

// Available tokens for repayment
export const REPAYMENT_TOKENS = [
  { symbol: 'USDC', address: TOKENS.USDC, decimals: 6 },
  { symbol: 'WXDAI', address: TOKENS.WXDAI, decimals: 18 },
  { symbol: 'ARMM_USDC', address: TOKENS.ARMMUSDC, decimals: 6 },
  { symbol: 'ARMM_WXDAI', address: TOKENS.ARMMWXDAI, decimals: 18 },
] as const;

export const DEBT_TOKENS = [
  { symbol: 'DEBT_USDC', address: TOKENS.DEBTUSDC, decimals: 6 },
  { symbol: 'DEBT_WXDAI', address: TOKENS.DEBTWXDAI, decimals: 18 },
] as const;

// Contract ABI will be imported from the JSON file
export { default as RENT2REPAY_ABI } from '../ABI/rent2repay.json';
export { default as ERC20_ABI } from '../ABI/erc20.json';
