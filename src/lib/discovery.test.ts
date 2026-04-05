import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPoolsFromCasts,
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
  const item = toDiscoveryCast(
    {
      hash: "0xabc",
      text: "controlled chaos with taste",
      author: {
        username: "unclehodl",
        display_name: "unc",
        score: 0.91,
      },
      channel: { id: "builders" },
      reactions: { likes_count: 42, recasts_count: 11 },
      replies: { count: 6 },
    },
    "random",
  );

  assert.equal(item.type, "cast");
  assert.equal(item.id, "cast:0xabc");
  assert.equal(item.handle, "@unclehodl");
  assert.equal(item.channel, "/builders");
  assert.equal(item.href, "https://warpcast.com/unclehodl/0xabc");
  assert.match(item.reason, /High-signal/i);
});

test("toDiscoveryUser dedupes an author into a people card", () => {
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
  assert.equal(item.href, "https://warpcast.com/aya");
  assert.match(item.engagement, /4.2k followers/i);
});

test("toDiscoveryChannel builds a channel card from aggregated live casts", () => {
  const item = toDiscoveryChannel({
    id: "builds",
    castCount: 3,
    uniqueAuthors: 3,
    likes: 27,
    recasts: 5,
    replies: 11,
    sampleText: "Three good builders are posting here.",
    topAuthors: ["@unclehodl", "@aya"],
  });

  assert.equal(item.type, "channel");
  assert.equal(item.id, "channel:builds");
  assert.equal(item.href, "https://warpcast.com/~/channel/builds");
  assert.match(item.reason, /active/i);
  assert.match(item.engagement, /3 casts/i);
});

test("buildPoolsFromCasts adds channels to random and niche pools", () => {
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
  ];

  const pools = buildPoolsFromCasts(casts);

  assert.ok(pools.random.some((item) => item.type === "channel"));
  assert.ok(pools.niche.some((item) => item.type === "channel"));
  assert.ok(pools.people.every((item) => item.type === "user"));
});
