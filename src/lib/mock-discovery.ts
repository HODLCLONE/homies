export type DiscoveryMode = "random" | "niche" | "people";
export type DiscoveryItemType = "cast" | "user";

export type DiscoveryItem =
  | {
      id: string;
      type: "cast";
      author: string;
      handle: string;
      channel: string;
      text: string;
      reason: string;
      href: string;
      engagement: string;
      neynarScore: number;
    }
  | {
      id: string;
      type: "user";
      author: string;
      handle: string;
      bio: string;
      reason: string;
      href: string;
      engagement: string;
      neynarScore: number;
    };

const CASTS: DiscoveryItem[] = [
  {
    id: "cast-1",
    type: "cast",
    author: "unc",
    handle: "@unclehodl",
    channel: "/beezie",
    text: "The best discovery surfaces are not search or trend pages. They feel like controlled chaos with taste.",
    reason: "High-signal cast from a strong operator account",
    href: "https://warpcast.com/~/channel/beezie",
    engagement: "42 likes · 11 recasts · 6 replies",
    neynarScore: 0.91,
  },
  {
    id: "cast-2",
    type: "cast",
    author: "mori",
    handle: "@mori",
    channel: "/builders",
    text: "The next mini apps that matter will feel less like tools and more like loops you can’t stop tapping.",
    reason: "Rising builder with clean engagement quality",
    href: "https://warpcast.com/~/channel/builders",
    engagement: "29 likes · 7 recasts · 8 replies",
    neynarScore: 0.84,
  },
  {
    id: "cast-3",
    type: "cast",
    author: "rio",
    handle: "@rio",
    channel: "/farcaster",
    text: "Underrated is better than trending if the filter understands trust, recency, and weirdness.",
    reason: "Niche find with strong reply-to-like ratio",
    href: "https://warpcast.com/~/channel/farcaster",
    engagement: "18 likes · 3 recasts · 9 replies",
    neynarScore: 0.8,
  },
];

const USERS: DiscoveryItem[] = [
  {
    id: "user-1",
    type: "user",
    author: "aya",
    handle: "@aya",
    bio: "Quietly shipping high-context design systems and strange premium mini apps.",
    reason: "Consistent high-score builder with healthy engagement",
    href: "https://warpcast.com/aya",
    engagement: "4.2k followers · active this week",
    neynarScore: 0.88,
  },
  {
    id: "user-2",
    type: "user",
    author: "luma",
    handle: "@luma",
    bio: "Collects niche channels, weird software, and social surfaces that still have soul.",
    reason: "Strong long-tail account surfaced from niche mode",
    href: "https://warpcast.com/luma",
    engagement: "1.1k followers · strong save rate",
    neynarScore: 0.82,
  },
  {
    id: "user-3",
    type: "user",
    author: "tess",
    handle: "@tess",
    bio: "Posts less, lands more. Infra, signal curation, and low-noise product notes.",
    reason: "People mode candidate with high trust / low spam profile",
    href: "https://warpcast.com/tess",
    engagement: "2.8k followers · excellent cast quality",
    neynarScore: 0.87,
  },
];

export function getMockDiscovery(mode: DiscoveryMode = "random"): DiscoveryItem {
  const pool = mode === "people" ? USERS : mode === "niche" ? [...CASTS.slice(1), ...USERS.slice(1)] : [...CASTS, ...USERS];
  return pool[Math.floor(Math.random() * pool.length)] ?? CASTS[0];
}
