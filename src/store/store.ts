import { useSyncExternalStore } from 'react';

export type RoomLevel = 1 | 2 | 3;
export type ShopTab = 'click' | 'auto' | 'upgrades' | 'nft';
export type UpgradeKind = 'click' | 'auto' | 'boost' | 'nft';

export type UpgradeDefinition = {
  id: string;
  tab: ShopTab;
  kind: UpgradeKind;
  name: string;
  icon: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  clickBonus?: number;
  autoBonus?: number;
  requiredOwned?: number;
};

export type GameState = {
  coins: number;
  taps: number;
  roomLevel: RoomLevel;
  lastTapAmount: number;
  owned: Record<string, number>;
};

type Listener = () => void;

const STORAGE_KEY = 'homies.game.state.v5.hodl';
const LEGACY_STORAGE_KEYS = ['homies.game.state.v3.clean', 'homies.game.state.v2'];

export const SHOP_ITEMS: UpgradeDefinition[] = [
  { id: 'click-bot', tab: 'click', kind: 'click', name: 'Tap Bot', icon: '🤖', description: '+1 /tap', baseCost: 75, costMultiplier: 1.38, clickBonus: 1 },
  { id: 'auto-liker', tab: 'click', kind: 'click', name: 'Signal Liker', icon: '💙', description: '+5 /tap', baseCost: 390, costMultiplier: 1.42, clickBonus: 5 },
  { id: 'recast-engine', tab: 'click', kind: 'click', name: 'Recast Engine', icon: '🔁', description: '+25 /tap', baseCost: 2150, costMultiplier: 1.46, clickBonus: 25 },
  { id: 'based-node', tab: 'click', kind: 'click', name: 'Based Node', icon: '🔵', description: '+100 /tap', baseCost: 15700, costMultiplier: 1.5, clickBonus: 100 },

  { id: 'click-farm', tab: 'auto', kind: 'auto', name: 'Tap Relay', icon: '📱', description: '+1 /sec', baseCost: 196, costMultiplier: 1.36, autoBonus: 1 },
  { id: 'ai-clicker', tab: 'auto', kind: 'auto', name: 'AI Operator', icon: '🧠', description: '+5 /sec', baseCost: 2320, costMultiplier: 1.42, autoBonus: 5 },
  { id: 'crypto-miner', tab: 'auto', kind: 'auto', name: 'Crypto Miner', icon: '⛏️', description: '+25 /sec', baseCost: 7170, costMultiplier: 1.46, autoBonus: 25 },
  { id: 'meme-factory', tab: 'auto', kind: 'auto', name: 'Meme Factory', icon: '🐸', description: '+100 /sec', baseCost: 13700, costMultiplier: 1.5, autoBonus: 100 },
  { id: 'defi-protocol', tab: 'auto', kind: 'auto', name: 'DeFi Protocol', icon: '🏦', description: '+500 /sec', baseCost: 26200, costMultiplier: 1.55, autoBonus: 500 },
  { id: 'farcaster-hub', tab: 'auto', kind: 'auto', name: 'Farcaster Hub', icon: '🔷', description: '+2.5K /sec', baseCost: 82200, costMultiplier: 1.62, autoBonus: 2500 },

  { id: 'auto-liker-quantum', tab: 'upgrades', kind: 'boost', name: 'Signal Liker Quantum', icon: '💙', description: 'Signal Liker output ×2 (need 50)', baseCost: 10_000_000, costMultiplier: 1, requiredOwned: 50 },
  { id: 'recast-engine-ultra', tab: 'upgrades', kind: 'boost', name: 'Recast Engine Ultra', icon: '🔁', description: 'Recast Engine output ×2 (need 25)', baseCost: 7_500_000, costMultiplier: 1, requiredOwned: 25 },
  { id: 'based-node-ultra', tab: 'upgrades', kind: 'boost', name: 'Based Node Ultra', icon: '🔵', description: 'Based Node output ×2 (need 25)', baseCost: 125_000_000, costMultiplier: 1, requiredOwned: 25 },
  { id: 'ai-clicker-quantum', tab: 'upgrades', kind: 'boost', name: 'AI Operator Quantum', icon: '🧠', description: 'AI Operator output ×2 (need 50)', baseCost: 50_000_000, costMultiplier: 1, requiredOwned: 50 },
  { id: 'crypto-miner-ultra', tab: 'upgrades', kind: 'boost', name: 'Crypto Miner Ultra', icon: '⛏️', description: 'Crypto Miner output ×2 (need 25)', baseCost: 25_000_000, costMultiplier: 1, requiredOwned: 25 },

  { id: 'vault-pass', tab: 'nft', kind: 'nft', name: 'Vault Pass', icon: '💎', description: 'Collector flex +10K /tap', baseCost: 1_000_000, costMultiplier: 2.25, clickBonus: 10_000 },
];

const DEFAULT_STATE: GameState = {
  coins: 0,
  taps: 0,
  roomLevel: 1,
  lastTapAmount: 1,
  owned: {},
};

let state: GameState = loadState();
const listeners = new Set<Listener>();
let passiveTimer: number | undefined;

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function clampRoomLevel(value: unknown): RoomLevel {
  const parsed = toInt(value, DEFAULT_STATE.roomLevel);
  if (parsed >= 3) return 3;
  if (parsed === 2) return 2;
  return 1;
}

function sanitizeOwned(input: unknown): Record<string, number> {
  if (!input || typeof input !== 'object') return {};
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .filter(([key]) => SHOP_ITEMS.some((item) => item.id === key))
      .map(([key, value]) => [key, Math.max(0, toInt(value, 0))]),
  );
}

function sanitize(input: Partial<GameState> | null | undefined): GameState {
  return {
    coins: Math.max(0, toInt(input?.coins, DEFAULT_STATE.coins)),
    taps: Math.max(0, toInt(input?.taps, DEFAULT_STATE.taps)),
    roomLevel: clampRoomLevel(input?.roomLevel),
    lastTapAmount: Math.max(1, toInt(input?.lastTapAmount, DEFAULT_STATE.lastTapAmount)),
    owned: sanitizeOwned(input?.owned),
  };
}

function readStoredState(key: string): Partial<GameState> | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<GameState>) : null;
  } catch {
    return null;
  }
}

function loadState(): GameState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  const current = readStoredState(STORAGE_KEY);
  const legacy = LEGACY_STORAGE_KEYS.map(readStoredState).find(Boolean);
  return sanitize(current ?? legacy);
}

function persist() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

export function getGameState(): GameState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGameStore<T>(selector: (state: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(DEFAULT_STATE),
  );
}

export function getOwned(id: string): number {
  return state.owned[id] ?? 0;
}

export function getItemCost(item: UpgradeDefinition): number {
  const owned = getOwned(item.id);
  if (item.kind === 'boost') return item.baseCost;
  return Math.ceil(item.baseCost * item.costMultiplier ** owned);
}

export function getClickPower(snapshot = state): number {
  return SHOP_ITEMS.reduce((total, item) => total + (item.clickBonus ?? 0) * (snapshot.owned[item.id] ?? 0), 1);
}

export function getPerSecond(snapshot = state): number {
  return SHOP_ITEMS.reduce((total, item) => total + (item.autoBonus ?? 0) * (snapshot.owned[item.id] ?? 0), 0);
}

export function tapHomie(): GameState {
  const amount = getClickPower();
  state = sanitize({
    ...state,
    coins: state.coins + amount,
    taps: state.taps + 1,
    lastTapAmount: amount,
  });
  emit();
  return state;
}

export function buyItem(itemId: string): boolean {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId);
  if (!item) return false;
  const cost = getItemCost(item);
  if (state.coins < cost) return false;
  if (item.requiredOwned && item.kind === 'boost') {
    const baseId = item.id.replace('-quantum', '').replace('-ultra', '');
    if ((state.owned[baseId] ?? 0) < item.requiredOwned) return false;
  }
  state = sanitize({
    ...state,
    coins: state.coins - cost,
    owned: { ...state.owned, [item.id]: (state.owned[item.id] ?? 0) + 1 },
  });
  emit();
  return true;
}

export function upgradeRoom(): boolean {
  if (state.roomLevel >= 3) return false;
  const cost = getRoomUpgradeCost(state.roomLevel + 1);
  if (state.coins < cost) return false;
  state = sanitize({
    ...state,
    coins: state.coins - cost,
    roomLevel: state.roomLevel === 1 ? 2 : 3,
  });
  emit();
  return true;
}

export function getRoomUpgradeCost(nextRoomLevel = state.roomLevel + 1): number {
  if (nextRoomLevel <= 2) return 125_000;
  if (nextRoomLevel === 3) return 1_000_000;
  return Number.POSITIVE_INFINITY;
}

export function resetGame(): void {
  state = { ...DEFAULT_STATE };
  emit();
}

export function startPassiveIncome(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  if (passiveTimer) window.clearInterval(passiveTimer);
  passiveTimer = window.setInterval(() => {
    const perSecond = getPerSecond();
    if (perSecond <= 0) return;
    state = sanitize({ ...state, coins: state.coins + perSecond });
    emit();
  }, 1000);
  return () => {
    if (passiveTimer) window.clearInterval(passiveTimer);
    passiveTimer = undefined;
  };
}

export function setRoomLevelForVerification(roomLevel: RoomLevel): void {
  state = sanitize({ ...state, roomLevel });
  emit();
}
