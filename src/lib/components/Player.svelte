<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import {
		type CollisionGroupsBitMask,
		RigidBody,
		CollisionGroups,
		Collider
	} from '@threlte/rapier';
	import { CapsuleGeometry, Mesh, MeshStandardMaterial, Vector2, Vector3 } from 'three';
	import { noop } from 'lodash-es';

	import {
		createFloatingState,
		createInitializingState,
		PLAYER_STATES,
		createPoweringUpState,
		createLaunchingState,
		type PlayerStateId,
		type PlayerStateContext,
		createGroundsSensoredChangedState
	} from './player-state';
	import { createStateMachine } from './state-machine';

	export let position: Parameters<Vector3['set']> | undefined = undefined;
	export let cameraFollow: (mesh?: Mesh) => void = noop;
	export let onGrounded: () => void = noop;
	export let onTakeoff: () => void = noop;

	const height: number = 1.7;
	const radius: number = 0.3;
	const playerCollisionGroups: CollisionGroupsBitMask = [0];
	const groundCollisionGroups: CollisionGroupsBitMask = [15];

	const { state, context, run, transition } = createStateMachine<PlayerStateId, PlayerStateContext>(
		createInitializingState(),
		{
			initialized: false,
			groundsSensored: 0,
			power: 0,

			keys: { up: false, down: false, left: false, right: false },

			forward: new Vector3(),
			velocity: new Vector3(),
			rotation: new Vector3(),
			movement: new Vector2(),

			onGrounded,
			onTakeoff
		}
	);

	const { start } = useTask(() => {
		run();
		cameraFollow($context.mesh);
	});

	const onKeyDown = (e: KeyboardEvent) => {
		switch (e.key.toLowerCase()) {
			case 's':
			case 'arrowdown':
				$context.keys.down = true;
				break;
			case 'w':
			case 'arrowup':
				$context.keys.up = true;
				break;
			case 'a':
			case 'arrowleft':
				$context.keys.left = true;
				break;
			case 'd':
			case 'arrowright':
				$context.keys.right = true;
				break;
			case ' ':
				if (!$context.rigidBody) break;
				if ($state.id === PLAYER_STATES.floating) break;
				if ($state.id === PLAYER_STATES.grounded) {
					transition(createPoweringUpState());
					break;
				}
			default:
				break;
		}
	};

	const onKeyUp = (e: KeyboardEvent) => {
		switch (e.key.toLowerCase()) {
			case 's':
			case 'arrowdown':
				$context.keys.down = false;
				break;
			case 'w':
			case 'arrowup':
				$context.keys.up = false;
				break;
			case 'a':
			case 'arrowleft':
				$context.keys.left = false;
				break;
			case 'd':
			case 'arrowright':
				$context.keys.right = false;
				break;
			case ' ':
				if ($state.id === PLAYER_STATES.poweringUp) {
					transition(createLaunchingState());
				}
			default:
				break;
		}
	};

	const onSensorChange = (mod: 1 | -1) =>
		transition(createGroundsSensoredChangedState($context.groundsSensored + mod));

	$: if ($context.mesh && $context.rigidBody && !$context.initialized) {
		start();
		transition(createFloatingState());
	}

	$: console.debug('player state transitioned:', $state.id);
</script>

<svelte:window on:keydown|preventDefault={onKeyDown} on:keyup|preventDefault={onKeyUp} />

<T.Group {position}>
	<RigidBody
		bind:rigidBody={$context.rigidBody}
		dominance={127}
		enabledRotations={[false, false, false]}
		type={'dynamic'}
	>
		<CollisionGroups groups={playerCollisionGroups}>
			<Collider shape={'capsule'} args={[height / 2 - radius, radius]} />
		</CollisionGroups>

		<CollisionGroups groups={groundCollisionGroups}>
			<T.Group position={[0, -height / 2 + radius, 0]}>
				<Collider
					sensor
					shape={'ball'}
					args={[radius * 1.2]}
					on:sensorenter={() => onSensorChange(1)}
					on:sensorexit={() => onSensorChange(-1)}
				/>
			</T.Group>
		</CollisionGroups>

		<T.Group position.y={-height / 2}>
			<T.Mesh
				bind:ref={$context.mesh}
				position.y={0.9}
				receiveShadow
				castShadow
				geometry={new CapsuleGeometry(0.3, 1.2)}
				material={new MeshStandardMaterial({ color: '#0059BA' })}
			/>
		</T.Group>
	</RigidBody>
</T.Group>
