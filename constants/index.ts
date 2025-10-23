// Gnosis Chain Configuration
export const GNOSIS_CHAIN_ID = 100;

// Token addresses on Gnosis Chain
export const TOKENS = {
  USDC: '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83',
  WXDAI: '0x0ca4f5554dd9da6217d62d8df2816c82bba4157b',
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
  { symbol: 'USDC', address: TOKENS.USDC },
  { symbol: 'WXDAI', address: TOKENS.WXDAI },
] as const;

// Contract ABI will be imported from the JSON file
export { default as RENT2REPAY_ABI } from '../ABI/rent2reapy.json';
