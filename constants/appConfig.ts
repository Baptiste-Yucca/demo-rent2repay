// Application Configuration
export const APP_CONFIG = {
  title: 'Rent2Repay Demo',
  subtitle: "Don't hesitate to report bug at @BaptisteYucca on Telegram",
  network: {
    name: 'Gnosis Chain',
    chainId: 100,
  },
  contract: {
    address: process.env.NEXT_PUBLIC_R2R_PROXY,
  },
  creator: {
    name: 'Battistu',
    telegram: '@BaptisteYucca',
    telegramUrl: 'https://t.me/BaptisteYucca',
    youtube: 'YesYuccan',
    youtubeUrl: 'https://www.youtube.com/@YesYuccan',
  },
  links: {
    repository: 'https://github.com/Baptiste-Yucca/demo-rent2repay',
    forum: 'https://forum.realtoken.community/d/93-rent2repay-config',
  },
} as const;

