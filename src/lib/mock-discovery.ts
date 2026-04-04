export type DiscoveryItem = {
  id: string;
  author: string;
  handle: string;
  channel: string;
  text: string;
  href: string;
  engagement: string;
};

const CASTS: DiscoveryItem[] = [
  {
    id: "cast-lorenzo-007-0x7260fbf6",
    author: "lorenzo-007",
    handle: "@lorenzo-007",
    channel: "/farcaster",
    text: "I wish Farcaster can just give me my remaining 6months of pro user money back It's kinda mid being a pro user when the wallets don't even work well, user rewards no more.",
    href: "https://farcaster.xyz/lorenzo-007/0x7260fbf6",
    engagement: "1 like · 0 recasts · 4 replies",
  },
  {
    id: "cast-sa-0x5ad8364f",
    author: "sa",
    handle: "@sa",
    channel: "/farcaster",
    text: "Going through my Channel follows to clean it up today was rough. Do not recommend if your FID is under like 500K.",
    href: "https://farcaster.xyz/sa/0x5ad8364f",
    engagement: "0 likes · 0 recasts · 6 replies",
  },
  {
    id: "cast-statuette-0xfb2c7ec2",
    author: "statuette",
    handle: "@statuette",
    channel: "/farcaster",
    text: "My Neynar score is 0.97 I’ve been watching my score lately because I noticed that it keeps fluctuating between 0.97 and 0.98. I may be wrong, didn’t read the docs but it seems like posting miniapp template shares might be lowering my score.",
    href: "https://farcaster.xyz/statuette/0xfb2c7ec2",
    engagement: "3 likes · 1 recast · 16 replies",
  },
  {
    id: "cast-bfg-0x79de9d7e",
    author: "bfg",
    handle: "@bfg",
    channel: "/farcaster",
    text: "We're live - Farcaster Agentic Bootcamp Day #5 Wow 🤩 who'd say it's already a full week of daily learning about building agents on top of Farcaster stack (but most topics are applicable anywhere)",
    href: "https://farcaster.xyz/bfg/0x79de9d7e",
    engagement: "0 likes · 1 recast · 9 replies",
  },
];

export function getDiscovery(): DiscoveryItem {
  return CASTS[Math.floor(Math.random() * CASTS.length)] ?? CASTS[0];
}
