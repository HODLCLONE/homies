import { revalidateTag, unstable_cache } from "next/cache";

export type DiscoveryMode = "random" | "niche" | "people";
export type DiscoveryItemType = "cast" | "user" | "channel";

export type DiscoveryCastItem = {
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
};

export type DiscoveryUserItem = {
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

export type DiscoveryChannelItem = {
  id: string;
  type: "channel";
  author: string;
  handle: string;
  bio: string;
  reason: string;
  href: string;
  engagement: string;
  neynarScore: number;
};

export type DiscoveryItem = DiscoveryCastItem | DiscoveryUserItem | DiscoveryChannelItem;

export type DiscoveryResponse = {
  item: DiscoveryItem;
  mode: DiscoveryMode;
  generatedAt: string;
  poolSize: number;
  source: "cache" | "fallback";
};

export type DiscoveryPools = Record<DiscoveryMode, DiscoveryItem[]>;

export type DiscoverySnapshot = {
  pools: DiscoveryPools;
  generatedAt: string;
};

export type DiscoveryUser = {
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

export type DiscoveryCast = {
  hash?: string | null;
  text?: string | null;
  author?: DiscoveryUser | null;
  channel?: {
    id?: string | null;
    name?: string | null;
  } | null;
  reactions?: {
    likes_count?: number | null;
    recasts_count?: number | null;
  } | null;
  replies?: {
    count?: number | null;
  } | null;
  timestamp?: string | null;
};

type DiscoveryChannelAggregate = {
  id: string;
  castCount: number;
  uniqueAuthors: number;
  likes: number;
  recasts: number;
  replies: number;
  sampleText: string;
  topAuthors: string[];
};

type EngagementCounts = {
  likes: number;
  recasts: number;
  replies: number;
};

const DISCOVERY_CACHE_TAG = "stmbl-discovery-pools";
const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";
const PAGE_LIMIT = 10;
const PAGE_COUNT = 3;
const CACHE_TTL_SECONDS = 60 * 15;
const MAX_CASTS_PER_AUTHOR = 2;
const MAX_CASTS_PER_CHANNEL = 4;

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

const FALLBACK_CHANNELS: DiscoveryItem[] = [
  {
    id: "channel:builders",
    type: "channel",
    author: "Builders",
    handle: "/builders",
    bio: "Builder-heavy channel with live app shipping, feedback loops, and less sludge.",
    reason: "Active niche channel with real operator density",
    href: "https://warpcast.com/~/channel/builders",
    engagement: "12 casts sampled · 8 builders active",
    neynarScore: 0.86,
  },
  {
    id: "channel:farcaster",
    type: "channel",
    author: "Farcaster",
    handle: "/farcaster",
    bio: "Core ecosystem channel with product chatter, infra notes, and live conversation.",
    reason: "Core channel with ongoing quality activity",
    href: "https://warpcast.com/~/channel/farcaster",
    engagement: "18 casts sampled · 12 operators active",
    neynarScore: 0.8,
  },
];

function trimDecimal(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${trimDecimal(value / 1_000_000)}m`;
  if (value >= 1_000) return `${trimDecimal(value / 1_000)}k`;
  return String(value);
}

export function formatEngagement({ likes, recasts, replies }: EngagementCounts): string {
  return `${likes} likes · ${recasts} recasts · ${replies} replies`;
}

export function pickDiscoveryItem<T extends { id: string }>(items: T[], seenIds: string[]): T {
  const unseen = items.filter((item) => !seenIds.includes(item.id));
  const pool = unseen.length > 0 ? unseen : items;
  return pool[Math.floor(Math.random() * pool.length)] ?? items[0];
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

function getCastTimestamp(cast: DiscoveryCast): number {
  if (!cast.timestamp) return 0;
  const parsed = Date.parse(cast.timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function ageFreshnessScore(cast: DiscoveryCast): number {
  const timestamp = getCastTimestamp(cast);
  if (!timestamp) return 0.55;
  const ageHours = Math.max(0, (Date.now() - timestamp) / 3_600_000);
  return Math.max(0, 1 - ageHours / 48);
}

function getAuthorScore(cast: DiscoveryCast): number {
  return clampScore(cast.author?.score ?? 0.65);
}

function getEngagement(cast: DiscoveryCast): EngagementCounts {
  return {
    likes: cast.reactions?.likes_count ?? 0,
    recasts: cast.reactions?.recasts_count ?? 0,
    replies: cast.replies?.count ?? 0,
  };
}

function getText(cast: DiscoveryCast): string {
  return cast.text?.trim() || "Fresh cast from Farcaster.";
}

function getUsername(cast: DiscoveryCast): string | null {
  return cast.author?.username?.trim() || null;
}

function getChannelId(cast: DiscoveryCast): string | null {
  return cast.channel?.id?.trim() || null;
}

function isSpammyText(text: string): boolean {
  const lowered = text.toLowerCase();
  return /(airdrop|wl spot|mint now|dm me|guaranteed|passive income)/i.test(lowered) || (lowered.includes("http") && lowered.length < 40);
}

function scoreCast(cast: DiscoveryCast): number {
  const authorScore = getAuthorScore(cast);
  const { likes, recasts, replies } = getEngagement(cast);
  const engagementScore = Math.min(1, Math.log10(likes + recasts * 2 + replies * 1.75 + 1) / 2);
  const freshness = ageFreshnessScore(cast);
  const lengthScore = Math.min(1, getText(cast).length / 220);
  const channelBoost = getChannelId(cast) ? 0.06 : 0;
  return authorScore * 0.48 + engagementScore * 0.26 + freshness * 0.14 + lengthScore * 0.12 + channelBoost;
}

function nicheScore(cast: DiscoveryCast): number {
  const authorScore = getAuthorScore(cast);
  const { likes, recasts, replies } = getEngagement(cast);
  const text = getText(cast);
  const replyDensity = Math.min(1, replies / Math.max(1, likes));
  const antiViral = 1 - Math.min(1, likes / 180);
  const conversation = Math.min(1, (replies + recasts) / 18);
  const channelBoost = getChannelId(cast) ? 0.14 : 0;
  const textDepth = Math.min(1, text.length / 280);
  const lowLinkPenalty = text.includes("http") ? 0.08 : 0;
  return authorScore * 0.38 + replyDensity * 0.2 + antiViral * 0.14 + conversation * 0.12 + textDepth * 0.08 + channelBoost - lowLinkPenalty;
}

function channelScore(aggregate: DiscoveryChannelAggregate): number {
  const engagement = Math.min(1, Math.log10(aggregate.likes + aggregate.recasts * 2 + aggregate.replies * 2 + 1) / 2.1);
  const participation = Math.min(1, aggregate.uniqueAuthors / 8);
  const velocity = Math.min(1, aggregate.castCount / 8);
  return 0.46 + engagement * 0.26 + participation * 0.16 + velocity * 0.12;
}

function describeCast(mode: DiscoveryMode, cast: DiscoveryCast): string {
  const { likes, replies } = getEngagement(cast);
  const hasChannel = Boolean(getChannelId(cast));
  const score = getAuthorScore(cast);

  if (mode === "niche") {
    if (replies >= likes && hasChannel) return "Channel-native cast with stronger replies than likes";
    if (replies >= 6) return "Conversation-dense cast pulled from the long tail";
    return "Niche cast filtered for trust, depth, and lower-tourist engagement";
  }

  if (score >= 0.9) return "High-signal cast from a trusted Farcaster account";
  if (replies > likes) return "Conversation-heavy cast with stronger replies than likes";
  if (hasChannel) return "Channel-native cast filtered for trust and engagement quality";
  return "Live Farcaster cast filtered for trust and engagement quality";
}

function describeUser(score: number, followers: number): string {
  if (score >= 0.92) return "High-trust Farcaster user worth following";
  if (followers >= 5_000) return "Established Farcaster account with real reach";
  return "Active Farcaster user surfaced from clean live casts";
}

export function toDiscoveryCast(cast: DiscoveryCast, mode: DiscoveryMode): DiscoveryCastItem {
  const username = getUsername(cast) ?? "farcaster";
  const displayName = cast.author?.display_name?.trim() || username;
  const hash = cast.hash ?? crypto.randomUUID();
  const channelId = getChannelId(cast);
  const engagement = getEngagement(cast);

  return {
    id: `cast:${hash}`,
    type: "cast",
    author: displayName,
    handle: `@${username}`,
    channel: channelId ? `/${channelId}` : "live feed",
    text: getText(cast),
    reason: describeCast(mode, cast),
    href: `https://warpcast.com/${username}/${hash}`,
    engagement: formatEngagement(engagement),
    neynarScore: getAuthorScore(cast),
  };
}

export function toDiscoveryUser(user: DiscoveryUser): DiscoveryUserItem {
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

export function toDiscoveryChannel(aggregate: DiscoveryChannelAggregate): DiscoveryChannelItem {
  const slug = aggregate.id;
  const displayName = slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const score = channelScore(aggregate);
  const dominantReason = aggregate.uniqueAuthors >= 4 ? "Active niche channel with multiple real operators posting" : "Active channel with healthy concentrated conversation";

  return {
    id: `channel:${slug}`,
    type: "channel",
    author: displayName || slug,
    handle: `/${slug}`,
    bio: aggregate.sampleText,
    reason: dominantReason,
    href: `https://warpcast.com/~/channel/${slug}`,
    engagement: `${aggregate.castCount} casts sampled · ${aggregate.uniqueAuthors} active authors`,
    neynarScore: score,
  };
}

function isViableCast(cast: DiscoveryCast): boolean {
  const username = getUsername(cast);
  const text = getText(cast);
  if (!cast.hash || !username) return false;
  if (text.length < 24) return false;
  if (isSpammyText(text)) return false;
  const { likes, recasts, replies } = getEngagement(cast);
  return likes + recasts + replies >= 3;
}

function capRankedCasts(casts: DiscoveryCast[], scorer: (cast: DiscoveryCast) => number): DiscoveryCast[] {
  const authorCounts = new Map<string, number>();
  const channelCounts = new Map<string, number>();

  return [...casts]
    .filter(isViableCast)
    .sort((left, right) => scorer(right) - scorer(left))
    .filter((cast) => {
      const username = getUsername(cast) ?? "unknown";
      const channelId = getChannelId(cast) ?? "__no_channel__";
      const authorCount = authorCounts.get(username) ?? 0;
      const channelCount = channelCounts.get(channelId) ?? 0;
      if (authorCount >= MAX_CASTS_PER_AUTHOR) return false;
      if (channelId !== "__no_channel__" && channelCount >= MAX_CASTS_PER_CHANNEL) return false;
      authorCounts.set(username, authorCount + 1);
      channelCounts.set(channelId, channelCount + 1);
      return true;
    });
}

function buildChannelAggregates(casts: DiscoveryCast[]): DiscoveryChannelAggregate[] {
  const channels = new Map<string, DiscoveryChannelAggregate & { authors: Set<string> }>();

  for (const cast of casts) {
    const channelId = getChannelId(cast);
    const username = getUsername(cast);
    if (!channelId || !username) continue;
    const engagement = getEngagement(cast);
    const existing = channels.get(channelId) ?? {
      id: channelId,
      castCount: 0,
      uniqueAuthors: 0,
      likes: 0,
      recasts: 0,
      replies: 0,
      sampleText: getText(cast),
      topAuthors: [],
      authors: new Set<string>(),
    };

    existing.castCount += 1;
    existing.likes += engagement.likes;
    existing.recasts += engagement.recasts;
    existing.replies += engagement.replies;
    existing.authors.add(`@${username}`);
    existing.topAuthors = [...existing.authors].slice(0, 3);
    if (getText(cast).length > existing.sampleText.length) {
      existing.sampleText = getText(cast);
    }

    channels.set(channelId, existing);
  }

  return [...channels.values()]
    .map(({ authors, ...aggregate }) => ({
      ...aggregate,
      uniqueAuthors: authors.size,
    }))
    .filter((aggregate) => aggregate.castCount >= 2)
    .sort((left, right) => channelScore(right) - channelScore(left));
}

function uniqueUsersFromCasts(casts: DiscoveryCast[]): DiscoveryUserItem[] {
  const byFid = new Map<string, DiscoveryUserItem>();

  for (const cast of [...casts].sort((left, right) => scoreCast(right) - scoreCast(left))) {
    const user = cast.author;
    if (!user?.username) continue;
    const id = String(user.fid ?? user.username);
    if (byFid.has(id)) continue;
    byFid.set(id, toDiscoveryUser(user));
    if (byFid.size >= 24) break;
  }

  return [...byFid.values()];
}

export function buildPoolsFromCasts(casts: DiscoveryCast[]): DiscoveryPools {
  const rankedRandomCasts = capRankedCasts(casts, scoreCast).slice(0, 12).map((cast) => toDiscoveryCast(cast, "random"));
  const rankedNicheCasts = capRankedCasts(
    casts.filter((cast) => Boolean(getChannelId(cast)) && (cast.replies?.count ?? 0) >= 2),
    nicheScore,
  )
    .slice(0, 10)
    .map((cast) => toDiscoveryCast(cast, "niche"));

  const users = uniqueUsersFromCasts(casts).slice(0, 12);
  const channels = buildChannelAggregates(casts).map((aggregate) => toDiscoveryChannel(aggregate));
  const nicheChannels = channels.filter((channel) => channel.neynarScore >= 0.72).slice(0, 6);

  return {
    random: [...rankedRandomCasts, ...users.slice(0, 6), ...channels.slice(0, 4)],
    niche: [...rankedNicheCasts, ...nicheChannels, ...users.filter((user) => user.neynarScore >= 0.78).slice(0, 3)],
    people: users,
  };
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

async function fetchTrendingCasts(mode: DiscoveryMode): Promise<DiscoveryCast[]> {
  const timeWindow = mode === "niche" ? "6h" : "24h";
  const casts: DiscoveryCast[] = [];
  let cursor: string | undefined;

  for (let index = 0; index < PAGE_COUNT; index += 1) {
    const response = await neynarFetch<{ casts?: DiscoveryCast[]; next?: { cursor?: string } }>("/feed/trending", {
      limit: PAGE_LIMIT,
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

async function buildLiveSnapshot(): Promise<DiscoverySnapshot> {
  const [randomCasts, nicheCasts] = await Promise.all([fetchTrendingCasts("random"), fetchTrendingCasts("niche")]);
  const combined = [...randomCasts, ...nicheCasts];
  const pools = buildPoolsFromCasts(combined);

  if (!pools.random.length || !pools.people.length) {
    throw new Error("Discovery pools came back empty");
  }

  return {
    pools,
    generatedAt: new Date().toISOString(),
  };
}

const getCachedSnapshot = unstable_cache(buildLiveSnapshot, [DISCOVERY_CACHE_TAG], {
  revalidate: CACHE_TTL_SECONDS,
  tags: [DISCOVERY_CACHE_TAG],
});

function fallbackSnapshot(): DiscoverySnapshot {
  return {
    generatedAt: new Date().toISOString(),
    pools: {
      random: [...FALLBACK_CASTS, ...FALLBACK_USERS, ...FALLBACK_CHANNELS],
      niche: [FALLBACK_CASTS[2], ...FALLBACK_CHANNELS, ...FALLBACK_USERS.slice(1)],
      people: FALLBACK_USERS,
    },
  };
}

export async function rebuildDiscoveryPools(): Promise<DiscoverySnapshot> {
  revalidateTag(DISCOVERY_CACHE_TAG, "max");
  return getCachedSnapshot();
}

export async function getDiscovery(mode: DiscoveryMode, seenIds: string[]): Promise<DiscoveryResponse> {
  try {
    const snapshot = await getCachedSnapshot();
    const pool = snapshot.pools[mode];

    if (!pool?.length) {
      throw new Error(`Discovery pool empty for mode ${mode}`);
    }

    return {
      item: pickDiscoveryItem(pool, seenIds),
      mode,
      generatedAt: snapshot.generatedAt,
      poolSize: pool.length,
      source: "cache",
    };
  } catch (error) {
    console.error("STMBL discovery fallback", error);
    const snapshot = fallbackSnapshot();
    const pool = snapshot.pools[mode] ?? snapshot.pools.random;
    return {
      item: pickDiscoveryItem(pool, seenIds),
      mode,
      generatedAt: snapshot.generatedAt,
      poolSize: pool.length,
      source: "fallback",
    };
  }
}
