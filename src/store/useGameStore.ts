import { useSyncExternalStore } from 'react';

export type GameState = {
  coins: number;
  taps: number;
  clickPower: number;
  roomLevel: number;
  autoClicksPerMinute: number;
  lastTapAmount: number;
};

type Listener = () => void;

const STORAGE_KEY = 'homies.game.state.v2';
const DEFAULT_STATE: GameState = {
  coins: 0,
  taps: 0,
  clickPower: 1,
  roomLevel: 1,
  autoClicksPerMinute: 0,
  lastTapAmount: 1,
};

function clampInt(value: unknown, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function sanitize(input: Partial<GameState> | null | undefined): GameState {
  if (!input) return { ...DEFAULT_STATE };
  const clickPower = Math.max(1, clampInt(input.clickPower, DEFAULT_STATE.clickPower));
  const roomLevel = Math.max(1, clampInt(input.roomLevel, DEFAULT_STATE.roomLevel));
  const autoClicksPerMinute = Math.max(0, clampInt(input.autoClicksPerMinute, DEFAULT_STATE.autoClicksPerMinute));
  return {
    coins: clampInt(input.coins, DEFAULT_STATE.coins),
    taps: clampInt(input.taps, DEFAULT_STATE.taps),
    clickPower,
    roomLevel,
    autoClicksPerMinute,
    lastTapAmount: Math.max(1, clampInt(input.lastTapAmount, clickPower)),
  };
}

function loadState(): GameState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return sanitize(JSON.parse(raw) as Partial<GameState>);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

let state: GameState = loadState();
const listeners: Listener[] = [];
let autoClickAccumulator = 0;

function persist() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

function applyTap(amount: number) {
  state = sanitize({
    ...state,
    coins: state.coins + amount,
    taps: state.taps + 1,
    lastTapAmount: amount,
  });
}

function getUpgradeClickCost() {
  return Math.max(25, 25 + (state.clickPower - 1) * 10);
}

function getAutoClickCost() {
  return Math.max(60, 60 + state.autoClicksPerMinute * 40);
}

export function getRoomUpgradeCost(nextRoomLevel = state.roomLevel + 1) {
  if (nextRoomLevel > 3) return Number.POSITIVE_INFINITY;
  const levelIndex = Math.max(1, nextRoomLevel - 1);
  return Math.max(12500, Math.floor(12500 * Math.pow(levelIndex, 2.1)));
}

export function getGameState() {
  return state;
}

export function setGameState(patch: Partial<GameState> | ((current: GameState) => Partial<GameState>)) {
  const partial = typeof patch === 'function' ? patch(state) : patch;
  state = sanitize({ ...state, ...partial });
  emit();
  return state;
}

export function tapCharacter() {
  const amount = Math.max(1, state.clickPower);
  applyTap(amount);
  emit();
  return state;
}

export function upgradeClickPower() {
  const cost = getUpgradeClickCost();
  if (state.coins < cost) return false;

  state = sanitize({
    ...state,
    coins: state.coins - cost,
    clickPower: state.clickPower + 1,
    lastTapAmount: state.lastTapAmount,
  });
  emit();
  return true;
}

export function upgradeAutoClick() {
  const cost = getAutoClickCost();
  if (state.coins < cost) return false;

  state = sanitize({
    ...state,
    coins: state.coins - cost,
    autoClicksPerMinute: state.autoClicksPerMinute + 1,
    lastTapAmount: state.lastTapAmount,
  });
  emit();
  return true;
}

export function upgradeRoom() {
  if (state.roomLevel >= 3) return false;
  const cost = getRoomUpgradeCost();
  if (state.coins < cost) return false;

  state = sanitize({
    ...state,
    coins: state.coins - cost,
    roomLevel: Math.min(3, state.roomLevel + 1),
    lastTapAmount: state.lastTapAmount,
  });
  emit();
  return true;
}

export function resetGame() {
  state = { ...DEFAULT_STATE };
  autoClickAccumulator = 0;
  emit();
}

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

if (typeof window !== 'undefined') {
  const globalWindow = window as Window & { __homiesAutoClickTimer?: number };
  if (!globalWindow.__homiesAutoClickTimer) {
    globalWindow.__homiesAutoClickTimer = window.setInterval(() => {
      if (state.autoClicksPerMinute <= 0) return;

      autoClickAccumulator += state.autoClicksPerMinute / 60;
      let changed = false;
      while (autoClickAccumulator >= 1) {
        autoClickAccumulator -= 1;
        const amount = Math.max(1, state.clickPower);
        applyTap(amount);
        changed = true;
      }
      if (changed) emit();
    }, 1000);
  }
}

export function useGameStore<T>(selector: (state: GameState) => T) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(DEFAULT_STATE),
  );
}
