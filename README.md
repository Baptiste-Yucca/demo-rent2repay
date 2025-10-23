# Rent2Repay Demo

A Web3 interface for testing the Rent2Repay smart contract on Gnosis Chain.

## Features

- **Wallet Connection**: Connect with MetaMask, WalletConnect, and other EVM-compatible wallets
- **Dashboard**: View connected wallet address and USDC/WXDAI balances
- **Token Holder**: Configure Rent2Repay with multiple tokens and amounts
- **Bot**: Execute single or batch Rent2Repay transactions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Blockchain**: Gnosis Chain (ID: 100)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_RPC_URL=https://rpc.gnosischain.com
NEXT_PUBLIC_R2R_PROXY=0xYourContractAddress
NEXT_PUBLIC_CHAIN_ID=100
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Token Holder Tab
- Configure Rent2Repay parameters
- Add multiple tokens with amounts
- Set period and timestamp
- Execute `configureRent2Repay()` function

### Bot Tab
- Execute single user Rent2Repay
- Execute batch Rent2Repay for multiple users
- Choose repayment token (USDC or WXDAI)

## Smart Contract Functions

The interface interacts with these main functions from the Rent2Repay contract:

- `configureRent2Repay(tokens[], amounts[], period, timestamp)`
- `rent2repay(user, token)`
- `batchRent2Repay(users[], token)`

## Token Addresses (Gnosis Chain)

- **USDC**: `0xddafbb505ad214d7b80b1f830fccc89b60fb7a83`
- **WXDAI**: `0x0ca4f5554dd9da6217d62d8df2816c82bba4157b`

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
