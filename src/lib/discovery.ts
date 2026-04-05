import { revalidateTag, unstable_cache } from "next/cache";
import {
  DEFAULT_BLACKLISTED_CHANNELS,
  DEFAULT_BLACKLISTED_USERNAMES,
  normalizeHandle,
  type DiscoverySettings,
} from "@/lib/discovery-config";

export type DiscoveryMode = "random";
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
  hash: string;
  authorUsername: string;
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
  fid: number | null;
  username: string;
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
  slug: string;
};

export type DiscoveryItem = DiscoveryCastItem | DiscoveryUserItem | DiscoveryChannelItem;

export type DiscoveryResponse = {
  item: DiscoveryItem;
  mode: DiscoveryMode;
  generatedAt: string;
  poolSize: number;
  source: "cache" | "fallback";
};

export type DiscoveryPools = {
  random: DiscoveryItem[];
};

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
const BLACKLISTED_DISPLAY_NAMES = ["farcaster", "dan romero", "varun", "dwr"];
const DEFAULT_SETTINGS: DiscoverySettings = {
  blacklistedUsernames: DEFAULT_BLACKLISTED_USERNAMES,
  blacklistedChannels: DEFAULT_BLACKLISTED_CHANNELS,
  ignoredKeys: [],
};

const FALLBACK_RANDOM: DiscoveryItem[] = [
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
    hash: "0x7f1ffbac93cca0df7c4dc087a28cf6599183b918",
    authorUsername: "unclehodl",
  },
  {
    id: "user:99",
    type: "user",
    author: "Aya",
    handle: "@aya",
    bio: "Quietly shipping high-context design systems and strange premium mini apps.",
    reason: "Consistent builder with strong trust score",
    href: "https://warpcast.com/aya",
    engagement: "4.2k followers · active on Farcaster",
    neynarScore: 0.88,
    fid: 99,
    username: "aya",
  },
  {
    id: "channel:builders",
    type: "channel",
    author: "Builders",
    handle: "/builders",
    bio: "12 sampled casts from 8 active authors during the latest refresh.",
    reason: "Active niche channel with real operator density",
    href: "https://warpcast.com/~/channel/builders",
    engagement: "12 casts sampled · 8 active authors",
    neynarScore: 0.86,
    slug: "builders",
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

function getUsername(cast: DiscoveryCast): string | null {
  return cast.author?.username?.trim() || null;
}

function getDisplayName(user: DiscoveryUser | null | undefined): string {
  return user?.display_name?.trim() || user?.username?.trim() || "farcaster";
}

function getChannelId(cast: DiscoveryCast): string | null {
  return cast.channel?.id?.trim() || null;
}

function getText(cast: DiscoveryCast): string {
  return cast.text?.trim() || "Fresh cast from Farcaster.";
}

function getEngagement(cast: DiscoveryCast): EngagementCounts {
  return {
    likes: cast.reactions?.likes_count ?? 0,
    recasts: cast.reactions?.recasts_count ?? 0,
    replies: cast.replies?.count ?? 0,
  };
}

function ageFreshnessScore(cast: DiscoveryCast): number {
  if (!cast.timestamp) return 0.55;
  const parsed = Date.parse(cast.timestamp);
  if (Number.isNaN(parsed)) return 0.55;
  const ageHours = Math.max(0, (Date.now() - parsed) / 3_600_000);
  return Math.max(0, 1 - ageHours / 48);
}

function getAuthorScore(cast: DiscoveryCast): number {
  return clampScore(cast.author?.score ?? 0.65);
}

function isSpammyText(text: string): boolean {
  const lowered = text.toLowerCase();
  return /(airdrop|wl spot|mint now|dm me|guaranteed|passive income)/i.test(lowered) || (lowered.includes("http") && lowered.length < 40);
}

function mergeSettings(settings?: Partial<DiscoverySettings>): DiscoverySettings {
  return {
    blacklistedUsernames: [...new Set([...(DEFAULT_SETTINGS.blacklistedUsernames ?? []), ...(settings?.blacklistedUsernames ?? [])].map(normalizeHandle).filter(Boolean))],
    blacklistedChannels: [...new Set([...(DEFAULT_SETTINGS.blacklistedChannels ?? []), ...(settings?.blacklistedChannels ?? [])].map(normalizeHandle).filter(Boolean))],
    ignoredKeys: [...new Set((settings?.ignoredKeys ?? []).map((entry) => entry.trim()).filter(Boolean))],
  };
}

function isBlacklistedUser(user: DiscoveryUser | null | undefined, settings: DiscoverySettings): boolean {
  const username = normalizeHandle(user?.username);
  const displayName = (user?.display_name ?? "").trim().toLowerCase();
  if (settings.blacklistedUsernames.includes(username)) return true;
  return BLACKLISTED_DISPLAY_NAMES.some((entry) => displayName.includes(entry));
}

function isBlacklistedCast(cast: DiscoveryCast, settings: DiscoverySettings): boolean {
  if (isBlacklistedUser(cast.author, settings)) return true;
  const channelId = normalizeHandle(getChannelId(cast));
  return Boolean(channelId && settings.blacklistedChannels.includes(channelId));
}

function isViableCast(cast: DiscoveryCast, settings: DiscoverySettings): boolean {
  const username = getUsername(cast);
  const text = getText(cast);
  if (!cast.hash || !username) return false;
  if (isBlacklistedCast(cast, settings)) return false;
  if (text.length < 24) return false;
  if (isSpammyText(text)) return false;
  const { likes, recasts, replies } = getEngagement(cast);
  return likes + recasts + replies >= 3;
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

function describeCast(cast: DiscoveryCast): string {
  const { likes, replies } = getEngagement(cast);
  const hasChannel = Boolean(getChannelId(cast));
  const score = getAuthorScore(cast);
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

function channelScore(aggregate: DiscoveryChannelAggregate): number {
  const engagement = Math.min(1, Math.log10(aggregate.likes + aggregate.recasts * 2 + aggregate.replies * 2 + 1) / 2.1);
  const participation = Math.min(1, aggregate.uniqueAuthors / 8);
  const velocity = Math.min(1, aggregate.castCount / 8);
  return 0.46 + engagement * 0.26 + participation * 0.16 + velocity * 0.12;
}

export function toDiscoveryCast(cast: DiscoveryCast): DiscoveryCastItem {
  const username = getUsername(cast) ?? "farcaster";
  const hash = cast.hash ?? crypto.randomUUID();
  const channelId = getChannelId(cast);
  const engagement = getEngagement(cast);

  return {
    id: `cast:${hash}`,
    type: "cast",
    author: getDisplayName(cast.author),
    handle: `@${username}`,
    channel: channelId ? `/${channelId}` : "live feed",
    text: getText(cast),
    reason: describeCast(cast),
    href: `https://warpcast.com/${username}/${hash}`,
    engagement: formatEngagement(engagement),
    neynarScore: getAuthorScore(cast),
    hash,
    authorUsername: username,
  };
}

export function toDiscoveryUser(user: DiscoveryUser): DiscoveryUserItem {
  const username = normalizeHandle(user.username) || `fid-${user.fid ?? crypto.randomUUID()}`;
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
    fid: user.fid ?? null,
    username,
  };
}

export function toDiscoveryChannel(aggregate: DiscoveryChannelAggregate): DiscoveryChannelItem {
  const slug = aggregate.id;
  const displayName = slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    id: `channel:${slug}`,
    type: "channel",
    author: displayName || slug,
    handle: `/${slug}`,
    bio: `${aggregate.castCount} sampled casts from ${aggregate.uniqueAuthors} active authors during the latest refresh.`,
    reason:
      aggregate.uniqueAuthors >= 4
        ? "Active niche channel with multiple real operators posting"
        : "Active channel with healthy concentrated conversation",
    href: `https://warpcast.com/~/channel/${slug}`,
    engagement: `${aggregate.castCount} casts sampled · ${aggregate.uniqueAuthors} active authors`,
    neynarScore: channelScore(aggregate),
    slug,
  };
}

function capRankedCasts(casts: DiscoveryCast[], settings: DiscoverySettings): DiscoveryCast[] {
  const authorCounts = new Map<string, number>();
  const channelCounts = new Map<string, number>();

  return [...casts]
    .filter((cast) => isViableCast(cast, settings))
    .sort((left, right) => scoreCast(right) - scoreCast(left))
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

function buildChannelAggregates(casts: DiscoveryCast[], settings: DiscoverySettings): DiscoveryChannelAggregate[] {
  const channels = new Map<string, DiscoveryChannelAggregate & { authors: Set<string> }>();

  for (const cast of casts) {
    const channelId = normalizeHandle(getChannelId(cast));
    const username = getUsername(cast);
    if (!channelId || !username || settings.blacklistedChannels.includes(channelId)) continue;
    if (isBlacklistedCast(cast, settings)) continue;

    const engagement = getEngagement(cast);
    const current = channels.get(channelId) ?? {
      id: channelId,
      castCount: 0,
      uniqueAuthors: 0,
      likes: 0,
      recasts: 0,
      replies: 0,
      authors: new Set<string>(),
    };

    current.castCount += 1;
    current.likes += engagement.likes;
    current.recasts += engagement.recasts;
    current.replies += engagement.replies;
    current.authors.add(username);
    channels.set(channelId, current);
  }

  return [...channels.values()]
    .map(({ authors, ...aggregate }) => ({ ...aggregate, uniqueAuthors: authors.size }))
    .filter((aggregate) => aggregate.castCount >= 2)
    .sort((left, right) => channelScore(right) - channelScore(left));
}

function uniqueUsersFromCasts(casts: DiscoveryCast[], settings: DiscoverySettings): DiscoveryUserItem[] {
  const byId = new Map<string, DiscoveryUserItem>();

  for (const cast of [...casts].sort((left, right) => scoreCast(right) - scoreCast(left))) {
    const user = cast.author;
    if (!user?.username || isBlacklistedUser(user, settings)) continue;
    const key = String(user.fid ?? normalizeHandle(user.username));
    if (byId.has(key)) continue;
    byId.set(key, toDiscoveryUser(user));
    if (byId.size >= 8) break;
  }

  return [...byId.values()];
}

export function buildPoolsFromCasts(casts: DiscoveryCast[], settings?: Partial<DiscoverySettings>): DiscoveryPools {
  const merged = mergeSettings(settings);
  const rankedCasts = capRankedCasts(casts, merged).slice(0, 12).map((cast) => toDiscoveryCast(cast));
  const users = uniqueUsersFromCasts(casts, merged).slice(0, 6);
  const channels = buildChannelAggregates(casts, merged)
    .map((aggregate) => toDiscoveryChannel(aggregate))
    .slice(0, 4);

  return {
    random: [...rankedCasts, ...users, ...channels],
  };
}

function getIgnoreKey(item: DiscoveryItem): string {
  if (item.type === "cast") return `cast:${item.hash}`;
  if (item.type === "user") return `user:${item.username}`;
  return `channel:${item.slug}`;
}

export function filterPool(items: DiscoveryItem[], settings?: Partial<DiscoverySettings>): DiscoveryItem[] {
  const merged = mergeSettings(settings);
  return items.filter((item) => {
    const ignoreKey = getIgnoreKey(item);
    if (merged.ignoredKeys.includes(ignoreKey)) return false;

    if (item.type === "cast") {
      if (merged.blacklistedUsernames.includes(normalizeHandle(item.authorUsername))) return false;
      return !merged.blacklistedChannels.includes(normalizeHandle(item.channel));
    }

    if (item.type === "user") {
      return !merged.blacklistedUsernames.includes(normalizeHandle(item.username));
    }

    return !merged.blacklistedChannels.includes(normalizeHandle(item.slug));
  });
}

async function neynarFetch<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) throw new Error("Missing NEYNAR_API_KEY");

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

  if (!response.ok) throw new Error(`Neynar request failed: ${response.status}`);
  return (await response.json()) as T;
}

async function fetchTrendingCasts(): Promise<DiscoveryCast[]> {
  const casts: DiscoveryCast[] = [];
  let cursor: string | undefined;

  for (let index = 0; index < PAGE_COUNT; index += 1) {
    const response = await neynarFetch<{ casts?: DiscoveryCast[]; next?: { cursor?: string } }>("/feed/trending", {
      limit: PAGE_LIMIT,
      time_window: "24h",
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
  const casts = await fetchTrendingCasts();
  const pools = buildPoolsFromCasts(casts);
  if (!pools.random.length) throw new Error("Discovery pool came back empty");
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
    pools: { random: FALLBACK_RANDOM },
  };
}

export async function rebuildDiscoveryPools(): Promise<DiscoverySnapshot> {
  revalidateTag(DISCOVERY_CACHE_TAG, "max");
  return getCachedSnapshot();
}

export async function getDiscovery(_mode: DiscoveryMode, seenIds: string[], settings?: Partial<DiscoverySettings>): Promise<DiscoveryResponse> {
  try {
    const snapshot = await getCachedSnapshot();
    const pool = filterPool(snapshot.pools.random, settings);
    if (!pool.length) throw new Error("Filtered discovery pool came back empty");
    return {
      item: pickDiscoveryItem(pool, seenIds),
      mode: "random",
      generatedAt: snapshot.generatedAt,
      poolSize: pool.length,
      source: "cache",
    };
  } catch (error) {
    console.error("STMBL discovery fallback", error);
    const snapshot = fallbackSnapshot();
    const pool = filterPool(snapshot.pools.random, settings);
    return {
      item: pickDiscoveryItem(pool.length ? pool : snapshot.pools.random, seenIds),
      mode: "random",
      generatedAt: snapshot.generatedAt,
      poolSize: pool.length ? pool.length : snapshot.pools.random.length,
      source: pool.length ? "fallback" : "fallback",
    };
  }
}
