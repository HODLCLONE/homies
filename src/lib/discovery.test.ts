import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPoolsFromCasts,
  filterPool,
  formatEngagement,
  pickDiscoveryItem,
  toDiscoveryCast,
  toDiscoveryChannel,
  toDiscoveryUser,
  type DiscoveryCast,
  type DiscoveryItem,
} from "./discovery";

test("pickDiscoveryItem prefers unseen ids before recycling the pool", () => {
  const items: DiscoveryItem[] = [
    {
      id: "cast-1",
      type: "cast",
      author: "alpha",
      handle: "@alpha",
      channel: "/dev",
      text: "one",
      reason: "reason",
      href: "https://warpcast.com/alpha/0x1",
      engagement: "1 likes · 0 recasts · 0 replies",
      neynarScore: 0.8,
      hash: "0x1",
      authorUsername: "alpha",
    },
    {
      id: "cast-2",
      type: "cast",
      author: "beta",
      handle: "@beta",
      channel: "/dev",
      text: "two",
      reason: "reason",
      href: "https://warpcast.com/beta/0x2",
      engagement: "2 likes · 0 recasts · 0 replies",
      neynarScore: 0.7,
      hash: "0x2",
      authorUsername: "beta",
    },
  ];

  const firstUnseen = pickDiscoveryItem(items, ["cast-1"]);
  assert.equal(firstUnseen.id, "cast-2");

  const recycled = pickDiscoveryItem(items, ["cast-1", "cast-2"]);
  assert.ok(["cast-1", "cast-2"].includes(recycled.id));
});

test("formatEngagement renders a readable engagement line", () => {
  assert.equal(formatEngagement({ likes: 12, recasts: 3, replies: 9 }), "12 likes · 3 recasts · 9 replies");
});

test("toDiscoveryCast normalizes a Neynar cast payload into a STMBL card", () => {
  const item = toDiscoveryCast({
    hash: "0xabc",
    text: "controlled chaos with taste",
    author: {
      fid: 42,
      username: "unclehodl",
      display_name: "unc",
      score: 0.91,
    },
    channel: { id: "builders" },
    reactions: { likes_count: 42, recasts_count: 11 },
    replies: { count: 6 },
  });

  assert.equal(item.type, "cast");
  assert.equal(item.id, "cast:0xabc");
  assert.equal(item.handle, "@unclehodl");
  assert.equal(item.channel, "/builders");
  assert.equal(item.hash, "0xabc");
  assert.equal(item.authorUsername, "unclehodl");
});

test("toDiscoveryUser includes fid for in-app profile opening", () => {
  const item = toDiscoveryUser({
    fid: 99,
    username: "aya",
    display_name: "Aya",
    score: 0.88,
    follower_count: 4200,
    profile: {
      bio: {
        text: "Quietly shipping weird premium mini apps.",
      },
    },
  });

  assert.equal(item.type, "user");
  assert.equal(item.id, "user:99");
  assert.equal(item.fid, 99);
  assert.equal(item.username, "aya");
});

test("toDiscoveryChannel builds channel info without surfacing a post body", () => {
  const item = toDiscoveryChannel({
    id: "builds",
    castCount: 3,
    uniqueAuthors: 3,
    likes: 27,
    recasts: 5,
    replies: 11,
  });

  assert.equal(item.type, "channel");
  assert.equal(item.id, "channel:builds");
  assert.equal(item.slug, "builds");
  assert.match(item.bio, /sampled casts/i);
  assert.doesNotMatch(item.bio, /Three good builders are posting here/i);
});

test("buildPoolsFromCasts returns mixed random pool and blacklists blocked accounts/channels", () => {
  const casts: DiscoveryCast[] = [
    {
      hash: "0x1",
      text: "Great niche build thread with real replies",
      author: { fid: 1, username: "unc", display_name: "unc", score: 0.95, follower_count: 4200 },
      channel: { id: "builders" },
      reactions: { likes_count: 18, recasts_count: 3 },
      replies: { count: 12 },
    },
    {
      hash: "0x2",
      text: "Another strong channel-native cast",
      author: { fid: 2, username: "aya", display_name: "Aya", score: 0.87, follower_count: 3200 },
      channel: { id: "builders" },
      reactions: { likes_count: 14, recasts_count: 2 },
      replies: { count: 9 },
    },
    {
      hash: "0x3",
      text: "Quietly useful operators post here",
      author: { fid: 3, username: "luma", display_name: "Luma", score: 0.82, follower_count: 1600 },
      channel: { id: "curation" },
      reactions: { likes_count: 10, recasts_count: 1 },
      replies: { count: 7 },
    },
    {
      hash: "0x4",
      text: "Official Farcaster update that should be blocked",
      author: { fid: 4, username: "farcaster", display_name: "Farcaster", score: 0.99, follower_count: 100000 },
      channel: { id: "farcaster" },
      reactions: { likes_count: 50, recasts_count: 10 },
      replies: { count: 25 },
    },
  ];

  const pools = buildPoolsFromCasts(casts);

  assert.ok(pools.random.some((item) => item.type === "cast"));
  assert.ok(pools.random.some((item) => item.type === "user"));
  assert.ok(pools.random.some((item) => item.type === "channel"));
  assert.ok(!pools.random.some((item) => item.handle === "@farcaster" || item.handle === "/farcaster"));
});

test("filterPool respects configurable blacklists and ignored entries", () => {
  const items: DiscoveryItem[] = [
    {
      id: "user:99",
      type: "user",
      author: "Aya",
      handle: "@aya",
      bio: "bio",
      reason: "reason",
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
      reason: "reason",
      href: "https://warpcast.com/~/channel/builders",
      engagement: "12 casts sampled · 8 active authors",
      neynarScore: 0.86,
      slug: "builders",
    },
    {
      id: "cast:0x1",
      type: "cast",
      author: "unc",
      handle: "@unclehodl",
      channel: "/beezie",
      text: "controlled chaos with taste",
      reason: "reason",
      href: "https://warpcast.com/unclehodl/0x1",
      engagement: "42 likes · 11 recasts · 6 replies",
      neynarScore: 0.91,
      hash: "0x1",
      authorUsername: "unclehodl",
    },
  ];

  const filtered = filterPool(items, {
    blacklistedUsernames: ["aya"],
    blacklistedChannels: ["builders"],
    ignoredKeys: ["cast:0x1"],
  });

  assert.equal(filtered.length, 0);
});
