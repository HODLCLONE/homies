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

export type DiscoveryResponse = {
  item: DiscoveryItem;
  mode: DiscoveryMode;
  generatedAt: string;
  poolSize: number;
  source: "live" | "fallback";
};

type NeynarUser = {
  fid?: number;
  username?: string | null;
  display_name?: string | null;
  score?: number | null;
  follower_count?: number | null;
  profile?: {
    bio?: {
      text?: string | null;
    } | null;
  } | null;
};

type NeynarCast = {
  hash?: string | null;
  text?: string | null;
  author?: NeynarUser | null;
  channel?: {
    id?: string | null;
  } | null;
  reactions?: {
    likes_count?: number | null;
    recasts_count?: number | null;
  } | null;
  replies?: {
    count?: number | null;
  } | null;
};

type EngagementCounts = {
  likes: number;
  recasts: number;
  replies: number;
};

const FALLBACK_CASTS: DiscoveryItem[] = [
  {
    id: "cast:fallback-1",
    type: "cast",
    author: "unc",
    handle: "@unclehodl",
    channel: "/beezie",
    text: "The best discovery surfaces are not search or trend pages. They feel like controlled chaos with taste.",
    reason: "High-signal cast from a trusted Farcaster account",
    href: "https://warpcast.com/unclehodl/0x7f1ffbac93cca0df7c4dc087a28cf6599183b918",
    engagement: "42 likes · 11 recasts · 6 replies",
    neynarScore: 0.91,
  },
  {
    id: "cast:fallback-2",
    type: "cast",
    author: "mori",
    handle: "@mori",
    channel: "/builders",
    text: "The next mini apps that matter will feel less like tools and more like loops you can’t stop tapping.",
    reason: "Strong builder cast with clean engagement quality",
    href: "https://warpcast.com/mori/0x2",
    engagement: "29 likes · 7 recasts · 8 replies",
    neynarScore: 0.84,
  },
  {
    id: "cast:fallback-3",
    type: "cast",
    author: "rio",
    handle: "@rio",
    channel: "/farcaster",
    text: "Underrated is better than trending if the filter understands trust, recency, and weirdness.",
    reason: "Niche cast with strong reply density",
    href: "https://warpcast.com/rio/0x3",
    engagement: "18 likes · 3 recasts · 9 replies",
    neynarScore: 0.8,
  },
];

const FALLBACK_USERS: DiscoveryItem[] = [
  {
    id: "user:1",
    type: "user",
    author: "aya",
    handle: "@aya",
    bio: "Quietly shipping high-context design systems and strange premium mini apps.",
    reason: "Consistent builder with strong trust score",
    href: "https://warpcast.com/aya",
    engagement: "4.2k followers · active on Farcaster",
    neynarScore: 0.88,
  },
  {
    id: "user:2",
    type: "user",
    author: "luma",
    handle: "@luma",
    bio: "Collects niche channels, weird software, and social surfaces that still have soul.",
    reason: "Strong long-tail account surfaced from live casts",
    href: "https://warpcast.com/luma",
    engagement: "1.1k followers · active on Farcaster",
    neynarScore: 0.82,
  },
  {
    id: "user:3",
    type: "user",
    author: "tess",
    handle: "@tess",
    bio: "Posts less, lands more. Infra, signal curation, and low-noise product notes.",
    reason: "High-trust user with quality posting history",
    href: "https://warpcast.com/tess",
    engagement: "2.8k followers · active on Farcaster",
    neynarScore: 0.87,
  },
];

const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${trimDecimal(value / 1_000_000)}m`;
  if (value >= 1_000) return `${trimDecimal(value / 1_000)}k`;
  return String(value);
}

function trimDecimal(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatEngagement({ likes, recasts, replies }: EngagementCounts): string {
  return `${likes} likes · ${recasts} recasts · ${replies} replies`;
}

export function pickDiscoveryItem<T extends { id: string }>(items: T[], seenIds: string[]): T {
  const unseen = items.filter((item) => !seenIds.includes(item.id));
  const pool = unseen.length > 0 ? unseen : items;
  return pool[Math.floor(Math.random() * pool.length)] ?? items[0];
}

export function toDiscoveryCast(cast: NeynarCast, mode: DiscoveryMode): DiscoveryItem {
  const username = cast.author?.username ?? "farcaster";
  const displayName = cast.author?.display_name?.trim() || username;
  const hash = cast.hash ?? crypto.randomUUID();
  const likes = cast.reactions?.likes_count ?? 0;
  const recasts = cast.reactions?.recasts_count ?? 0;
  const replies = cast.replies?.count ?? 0;
  const neynarScore = clampScore(cast.author?.score ?? 0.65);
  const text = cast.text?.trim() || "Fresh cast from Farcaster.";
  const channelId = cast.channel?.id?.trim();
  const channel = channelId ? `/${channelId}` : "live feed";

  return {
    id: `cast:${hash}`,
    type: "cast",
    author: displayName,
    handle: `@${username}`,
    channel,
    text,
    reason: describeCast(mode, neynarScore, likes, replies, Boolean(channelId)),
    href: `https://warpcast.com/${username}/${hash}`,
    engagement: formatEngagement({ likes, recasts, replies }),
    neynarScore,
  };
}

export function toDiscoveryUser(user: NeynarUser): DiscoveryItem {
  const username = user.username ?? `fid-${user.fid ?? crypto.randomUUID()}`;
  const displayName = user.display_name?.trim() || username;
  const followers = user.follower_count ?? 0;
  const neynarScore = clampScore(user.score ?? 0.65);
  const bio = user.profile?.bio?.text?.trim() || "Active Farcaster user with a real posting footprint.";

  return {
    id: `user:${user.fid ?? username}`,
    type: "user",
    author: displayName,
    handle: `@${username}`,
    bio,
    reason: describeUser(neynarScore, followers),
    href: `https://warpcast.com/${username}`,
    engagement: `${formatCompactNumber(followers)} followers · active on Farcaster`,
    neynarScore,
  };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

function describeCast(mode: DiscoveryMode, score: number, likes: number, replies: number, hasChannel: boolean): string {
  if (mode === "niche") {
    if (replies >= likes) return "Niche cast with strong reply density";
    return hasChannel ? "Channel-native cast with healthy trust and weirdness" : "Long-tail cast filtered for signal over virality";
  }

  if (score >= 0.85) return "High-signal cast from a trusted Farcaster account";
  if (replies > likes) return "Conversation-heavy cast with stronger replies than likes";
  return "Live Farcaster cast filtered for trust and engagement quality";
}

function describeUser(score: number, followers: number): string {
  if (score >= 0.9) return "High-trust Farcaster user worth following";
  if (followers >= 5_000) return "Established Farcaster account with real reach";
  return "Active Farcaster user surfaced from clean live casts";
}

function scoreCast(cast: NeynarCast): number {
  const authorScore = clampScore(cast.author?.score ?? 0.65);
  const likes = cast.reactions?.likes_count ?? 0;
  const recasts = cast.reactions?.recasts_count ?? 0;
  const replies = cast.replies?.count ?? 0;
  const engagement = Math.min(1, Math.log10(likes + recasts * 2 + replies * 1.5 + 1) / 2);
  const lengthScore = Math.min(1, ((cast.text?.trim().length ?? 0) + 40) / 220);
  const channelBoost = cast.channel?.id ? 0.08 : 0;
  return authorScore * 0.6 + engagement * 0.28 + lengthScore * 0.12 + channelBoost;
}

function nicheScore(cast: NeynarCast): number {
  const authorScore = clampScore(cast.author?.score ?? 0.65);
  const likes = cast.reactions?.likes_count ?? 0;
  const replies = cast.replies?.count ?? 0;
  const replyDensity = replies / Math.max(1, likes);
  const antiViral = 1 - Math.min(1, likes / 250);
  const channelBoost = cast.channel?.id ? 0.15 : 0;
  return authorScore * 0.45 + Math.min(1, replyDensity) * 0.25 + antiViral * 0.15 + channelBoost;
}

function sortAndShapeCasts(casts: NeynarCast[], mode: DiscoveryMode): DiscoveryItem[] {
  const ranked = [...casts]
    .filter((cast) => cast.hash && cast.author?.username && cast.text?.trim())
    .sort((left, right) => (mode === "niche" ? nicheScore(right) - nicheScore(left) : scoreCast(right) - scoreCast(left)));

  const filtered =
    mode === "niche"
      ? ranked.filter((cast) => (cast.channel?.id || 0) && (cast.replies?.count ?? 0) >= 1).slice(0, 24)
      : ranked.slice(0, 24);

  return filtered.map((cast) => toDiscoveryCast(cast, mode));
}

function uniqueUsersFromCasts(casts: NeynarCast[]): DiscoveryItem[] {
  const byFid = new Map<string, DiscoveryItem>();

  for (const cast of casts.sort((left, right) => scoreCast(right) - scoreCast(left))) {
    const user = cast.author;
    if (!user?.username) continue;
    const id = String(user.fid ?? user.username);
    if (byFid.has(id)) continue;
    byFid.set(id, toDiscoveryUser(user));
    if (byFid.size >= 24) break;
  }

  return [...byFid.values()];
}

async function neynarFetch<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEYNAR_API_KEY");
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  const response = await fetch(`${NEYNAR_BASE_URL}${path}?${searchParams.toString()}`, {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Neynar request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchTrendingCasts(mode: DiscoveryMode): Promise<NeynarCast[]> {
  const timeWindow = mode === "niche" ? "6h" : "24h";
  const pageLimit = 10;
  const pageCount = mode === "people" ? 3 : 2;
  const casts: NeynarCast[] = [];
  let cursor: string | undefined;

  for (let index = 0; index < pageCount; index += 1) {
    const response = await neynarFetch<{ casts?: NeynarCast[]; next?: { cursor?: string } }>("/feed/trending", {
      limit: pageLimit,
      time_window: timeWindow,
      feed_type: "filter",
      ...(cursor ? { cursor } : {}),
    });

    casts.push(...(response.casts ?? []));
    cursor = response.next?.cursor;
    if (!cursor) break;
  }

  return casts;
}

function fallbackPool(mode: DiscoveryMode): DiscoveryItem[] {
  if (mode === "people") return FALLBACK_USERS;
  if (mode === "niche") return [FALLBACK_CASTS[2], FALLBACK_CASTS[1], ...FALLBACK_USERS.slice(1)];
  return [...FALLBACK_CASTS, ...FALLBACK_USERS];
}

export async function getDiscovery(mode: DiscoveryMode, seenIds: string[]): Promise<DiscoveryResponse> {
  try {
    const casts = await fetchTrendingCasts(mode);
    const pool = mode === "people" ? uniqueUsersFromCasts(casts) : sortAndShapeCasts(casts, mode);

    if (pool.length === 0) {
      throw new Error("Empty live discovery pool");
    }

    return {
      item: pickDiscoveryItem(pool, seenIds),
      mode,
      generatedAt: new Date().toISOString(),
      poolSize: pool.length,
      source: "live",
    };
  } catch (error) {
    console.error("STMBL live discovery fallback", error);
    const pool = fallbackPool(mode);
    return {
      item: pickDiscoveryItem(pool, seenIds),
      mode,
      generatedAt: new Date().toISOString(),
      poolSize: pool.length,
      source: "fallback",
    };
  }
}
