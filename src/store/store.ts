import { useSyncExternalStore } from 'react';

export type GameState = {
  coins: number;
  taps: number;
  roomLevel: 1 | 2 | 3;
  lastTapAmount: number;
};

type Listener = () => void;

const STORAGE_KEY = 'homies.game.state.v3.clean';
const LEGACY_STORAGE_KEY = 'homies.game.state.v2';
const DEFAULT_STATE: GameState = {
  coins: 0,
  taps: 0,
  roomLevel: 1,
  lastTapAmount: 1,
};

let state: GameState = loadState();
const listeners = new Set<Listener>();

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function clampRoomLevel(value: unknown): 1 | 2 | 3 {
  const parsed = toInt(value, DEFAULT_STATE.roomLevel);
  if (parsed >= 3) return 3;
  if (parsed === 2) return 2;
  return 1;
}

function sanitize(input: Partial<GameState> | null | undefined): GameState {
  return {
    coins: Math.max(0, toInt(input?.coins, DEFAULT_STATE.coins)),
    taps: Math.max(0, toInt(input?.taps, DEFAULT_STATE.taps)),
    roomLevel: clampRoomLevel(input?.roomLevel),
    lastTapAmount: Math.max(1, toInt(input?.lastTapAmount, DEFAULT_STATE.lastTapAmount)),
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
  return sanitize(readStoredState(STORAGE_KEY) ?? readStoredState(LEGACY_STORAGE_KEY));
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

export function tapHomie(): GameState {
  const amount = 1;
  state = sanitize({
    ...state,
    coins: state.coins + amount,
    taps: state.taps + 1,
    lastTapAmount: amount,
  });
  emit();
  return state;
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
  if (nextRoomLevel <= 2) return 125;
  if (nextRoomLevel === 3) return 350;
  return Number.POSITIVE_INFINITY;
}

export function resetGame(): void {
  state = { ...DEFAULT_STATE };
  emit();
}

export function setRoomLevelForVerification(roomLevel: 1 | 2 | 3): void {
  state = sanitize({ ...state, roomLevel });
  emit();
}
