import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { gnosis } from 'viem/chains';
import { RENT2REPAY_ABI, TOKENS } from '@/constants';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export const publicClient = createPublicClient({
  chain: gnosis,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

export const getTokenBalance = async (tokenAddress: `0x${string}`, userAddress: `0x${string}`) => {
  try {
    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    return {
      balance: BigInt(balance),
      decimals: Number(decimals),
      formatted: formatUnits(BigInt(balance), Number(decimals)),
    };
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return null;
  }
};

export const getUSDCBalance = (userAddress: `0x${string}`) => 
  getTokenBalance(TOKENS.USDC, userAddress);

export const getWXDAIBalance = (userAddress: `0x${string}`) => 
  getTokenBalance(TOKENS.WXDAI, userAddress);
