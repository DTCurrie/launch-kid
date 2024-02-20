import type { Mesh, Vector2, Vector3 } from 'three';
import { createState, type StateOptions } from './state-machine';
import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
import type { PressedKeys } from './player-inputs';

const PLAYER_SPEED = 2;
const PLAYER_ROTATE_SPEED = 2;

export interface PlayerStateContext {
	mesh?: Mesh;
	rigidBody?: RapierRigidBody;

	initialized: boolean;
	groundsSensored: number;
	power: number;

	keys: PressedKeys;

	forward: Vector3;
	velocity: Vector3;
	rotation: Vector3;
	movement: Vector2;
}

export const PLAYER_STATES = {
	initializing: 'initializing',
	grounded: 'grounded',
	poweringUp: 'powering-up',
	launching: 'launching',
	floating: 'floating',
	groundsSensoredChanged: 'grounds-sensored-changed'
} as const;

export type PlayerStateId = (typeof PLAYER_STATES)[keyof typeof PLAYER_STATES];

const createPlayerState = (options: StateOptions<PlayerStateId, PlayerStateContext>) =>
	createState(options);

export const createInitializingState = () =>
	createPlayerState({ id: PLAYER_STATES.initializing, onExit: () => ({ initialized: true }) });

export const createGroundedState = () =>
	createPlayerState({
		id: PLAYER_STATES.grounded,
		run: (
			{ mesh, rigidBody, forward, velocity, rotation, keys, movement, groundsSensored },
			transition
		) => {
			if (groundsSensored === 0) {
				transition(createFloatingState());
				return {};
			}

			mesh?.getWorldDirection(forward);
			velocity.set(0, 0, 0);
			rotation.set(0, 0, 0);

			if (keys.up) velocity.x += 1;
			if (keys.down) velocity.x -= 1;
			if (keys.left) rotation.y += 1;
			if (keys.right) rotation.y -= 1;

			movement.set(velocity.x, rotation.y);

			const velocityLength = velocity.length();
			const rotationLength = rotation.length();
			const hasInput = movement.length() > 0;

			if (velocityLength > 0) {
				velocity.divideScalar(velocityLength).multiplyScalar(PLAYER_SPEED);
			}

			if (rotationLength > 0) {
				rotation.divideScalar(rotationLength).multiplyScalar(PLAYER_ROTATE_SPEED);
			}

			if (hasInput) {
				rigidBody?.resetForces(true);
				rigidBody?.resetTorques(true);
			}

			const linVel = rigidBody?.linvel() ?? { y: 0 };
			forward.multiplyScalar(velocity.x);
			forward.y = linVel.y;
			rigidBody?.setAngvel(rotation, true);
			rigidBody?.setLinvel(forward, true);

			return {
				rigidBody,
				velocity,
				rotation,
				movement,
				forward
			};
		}
	});

export const createPoweringUpState = () =>
	createPlayerState({
		id: PLAYER_STATES.poweringUp,
		onEnter: (_, { rigidBody, velocity, rotation }) => {
			velocity.set(0, 0, 0);
			rotation.set(0, 0, 0);

			rigidBody?.resetForces(true);
			rigidBody?.resetTorques(true);
			rigidBody?.setLinvel(velocity, true);
			rigidBody?.setAngvel(rotation, true);

			return { power: 0, velocity, rotation, rigidBody };
		},
		run: ({ power }, transition) => {
			if (power === 100) {
				transition(createLaunchingState());
				return { power };
			}

			let next = power;
			next += 0.5;

			return { power: next };
		}
	});

export const createLaunchingState = () =>
	createPlayerState({
		id: PLAYER_STATES.poweringUp,
		onEnter: (_, { mesh, rigidBody, forward, power }, transition) => {
			const mod = power / 10;

			mesh?.getWorldDirection(forward);
			forward.multiplyScalar(mod);
			forward.y = mod;

			rigidBody?.applyImpulse(forward, true);
			transition(createFloatingState());
			return { rigidBody, forward, power: 0 };
		}
	});

export const createFloatingState = () =>
	createPlayerState({
		id: PLAYER_STATES.floating,
		run: ({ groundsSensored }, transition) => {
			if (groundsSensored !== 0) {
				transition(createGroundedState());
			}
			return {};
		}
	});

export const createGroundsSensoredChangedState = (sensored: number) =>
	createPlayerState({
		id: PLAYER_STATES.groundsSensoredChanged,
		onEnter: (_last, _context, transition) => {
			if (sensored === 0) transition(createFloatingState());
			else transition(createGroundedState());
			return { groundsSensored: sensored };
		}
	});
