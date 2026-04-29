import { useSyncExternalStore } from 'react';

export type GameState = {
  coins: number;
  taps: number;
  clickPower: number;
  roomLevel: number;
  lastTapAmount: number;
};

type Listener = () => void;

const STORAGE_KEY = 'homies.game.state.v1';
const DEFAULT_STATE: GameState = {
  coins: 0,
  taps: 0,
  clickPower: 1,
  roomLevel: 1,
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
  return {
    coins: clampInt(input.coins, DEFAULT_STATE.coins),
    taps: clampInt(input.taps, DEFAULT_STATE.taps),
    clickPower,
    roomLevel,
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

function persist() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
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
  state = sanitize({
    ...state,
    coins: state.coins + amount,
    taps: state.taps + 1,
    lastTapAmount: amount,
  });
  emit();
  return state;
}

export function upgradeClickPower() {
  const cost = Math.max(25, 25 + (state.clickPower - 1) * 10);
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

export function claimBoost() {
  const gain = Math.max(8, state.clickPower * 4);
  state = sanitize({
    ...state,
    coins: state.coins + gain,
    lastTapAmount: gain,
  });
  emit();
  return gain;
}

export function resetGame() {
  state = { ...DEFAULT_STATE };
  emit();
}

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

export function useGameStore<T>(selector: (state: GameState) => T) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(DEFAULT_STATE),
  );
}
