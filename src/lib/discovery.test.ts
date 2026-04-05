import test from "node:test";
import assert from "node:assert/strict";
import {
  formatEngagement,
  pickDiscoveryItem,
  toDiscoveryCast,
  toDiscoveryUser,
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
  const item = toDiscoveryCast({
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
  }, "random");

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
