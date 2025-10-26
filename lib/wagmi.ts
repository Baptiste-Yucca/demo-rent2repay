import { createConfig, http } from 'wagmi';
import { gnosis } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [gnosis],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [gnosis.id]: http(),
  },
});
