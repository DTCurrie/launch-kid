import type { CollisionGroupsBitMask } from '@threlte/rapier';

export const PLAYER_HEIGHT = 1.7 as const;
export const PLAYER_RADIUS = 0.3 as const;
export const PLAYER_LENGTH = 1.2 as const;

export const PLAYER_COLLISION_GROUPS: CollisionGroupsBitMask = [0] as const;
export const GROUND_COLLISION_GROUPS: CollisionGroupsBitMask = [15] as const;
