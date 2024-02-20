<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { RigidBody, CollisionGroups, Collider } from '@threlte/rapier';
	import { CapsuleGeometry, Mesh, MeshStandardMaterial, Vector2, Vector3 } from 'three';
	import { noop } from 'lodash-es';
	import {
		createStateMachine,
		createInitializingState,
		playerInputs,
		createPoweringUpState,
		createLaunchingState,
		createGroundsSensoredChangedState,
		createFloatingState,
		PLAYER_COLLISION_GROUPS,
		PLAYER_HEIGHT,
		PLAYER_RADIUS,
		GROUND_COLLISION_GROUPS,
		PLAYER_LENGTH,
		type PlayerStateId,
		type PlayerStateContext
	} from '$lib';

	export let position: Parameters<Vector3['set']> | undefined = undefined;
	export let cameraFollow: (mesh?: Mesh) => void = noop;

	const { state, context, run, transition } = createStateMachine<PlayerStateId, PlayerStateContext>(
		createInitializingState(),
		{
			initialized: false,
			groundsSensored: 0,
			power: 0,

			keys: { up: false, down: false, left: false, right: false, action: false },

			forward: new Vector3(),
			velocity: new Vector3(),
			rotation: new Vector3(),
			movement: new Vector2()
		}
	);

	const { onKeyDown, onKeyUp } = playerInputs($context.keys);

	const { start } = useTask(() => {
		if ($state.id === 'grounded') {
			if ($context.keys.action) {
				transition(createPoweringUpState());
			}
		}

		if ($state.id === 'powering-up') {
			if (!$context.keys.action) {
				transition(createLaunchingState());
			}

			if ($context.power >= 100) {
				transition(createLaunchingState());
			}
		}

		run();
		cameraFollow($context.mesh);
	});

	const onSensorChange = (mod: 1 | -1) =>
		transition(createGroundsSensoredChangedState($context.groundsSensored + mod));

	$: loaded = Boolean($context.mesh && $context.rigidBody);
	$: if (loaded && !$context.initialized) {
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
		<CollisionGroups groups={PLAYER_COLLISION_GROUPS}>
			<Collider shape={'capsule'} args={[PLAYER_HEIGHT / 2 - PLAYER_RADIUS, PLAYER_RADIUS]} />
		</CollisionGroups>

		<CollisionGroups groups={GROUND_COLLISION_GROUPS}>
			<T.Group position={[0, -PLAYER_HEIGHT / 2 + PLAYER_RADIUS, 0]}>
				<Collider
					sensor
					shape={'ball'}
					args={[PLAYER_RADIUS * PLAYER_LENGTH]}
					on:sensorenter={() => onSensorChange(1)}
					on:sensorexit={() => onSensorChange(-1)}
				/>
			</T.Group>
		</CollisionGroups>

		<T.Group position.y={-PLAYER_HEIGHT / 2}>
			<T.Mesh
				bind:ref={$context.mesh}
				position.y={0.9}
				receiveShadow
				castShadow
				geometry={new CapsuleGeometry(PLAYER_RADIUS, PLAYER_LENGTH)}
				material={new MeshStandardMaterial({ color: '#0059BA' })}
			/>
		</T.Group>
	</RigidBody>
</T.Group>
