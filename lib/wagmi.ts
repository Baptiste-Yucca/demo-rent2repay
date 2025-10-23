import { createConfig, http } from 'wagmi';
import { gnosis } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [gnosis],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: 'demo-project-id',
    }),
  ],
  transports: {
    [gnosis.id]: http(),
  },
});
