<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import {
		type CollisionGroupsBitMask,
		RigidBody,
		CollisionGroups,
		Collider
	} from '@threlte/rapier';
	import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
	import { CapsuleGeometry, Mesh, MeshStandardMaterial, Vector2, Vector3 } from 'three';
	import { noop } from 'lodash-es';

	type Keys = 'left' | 'right' | 'down' | 'up';

	export let position: Parameters<Vector3['set']> | undefined = undefined;
	export let mesh: Mesh;
	export let onGrounded: () => void = noop;
	export let onTakeoff: () => void = noop;

	const height: number = 1.7;
	const radius: number = 0.3;
	const speed = 2;
	const rotateSpeed = 2;
	const playerCollisionGroups: CollisionGroupsBitMask = [0];
	const groundCollisionGroups: CollisionGroupsBitMask = [15];

	const keys: Record<Keys, boolean> = {
		up: false,
		down: false,
		left: false,
		right: false
	};

	const forward = new Vector3();
	const velocity = new Vector3();
	const rotation = new Vector3();
	const movement = new Vector2();

	let rigidBody: RapierRigidBody;

	let grounded = false;
	let groundsSensored = 0;

	const { start } = useTask(() => {
		mesh.getWorldDirection(forward);
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
			velocity.divideScalar(velocityLength).multiplyScalar(speed);
		}

		if (rotationLength > 0) {
			rotation.divideScalar(rotationLength).multiplyScalar(rotateSpeed);
		}

		if (hasInput) {
			rigidBody.resetForces(true);
			rigidBody.resetTorques(true);
		}

		const linVel = rigidBody.linvel();
		forward.multiplyScalar(velocity.x);
		forward.y = linVel.y;
		rigidBody.setAngvel(rotation, true);
		rigidBody.setLinvel(forward, true);
	});

	const onKeyDown = (e: KeyboardEvent) => {
		switch (e.key.toLowerCase()) {
			case 's':
			case 'arrowdown':
				keys.down = true;
				break;
			case 'w':
			case 'arrowup':
				keys.up = true;
				break;
			case 'a':
			case 'arrowleft':
				keys.left = true;
				break;
			case 'd':
			case 'arrowright':
				keys.right = true;
				break;
			case ' ':
				if (!rigidBody || !grounded) break;
			// start launch
			default:
				break;
		}
	};

	const onKeyUp = (e: KeyboardEvent) => {
		switch (e.key.toLowerCase()) {
			case 's':
			case 'arrowdown':
				keys.down = false;
				break;
			case 'w':
			case 'arrowup':
				keys.up = false;
				break;
			case 'a':
			case 'arrowleft':
				keys.left = false;
				break;
			case 'd':
			case 'arrowright':
				keys.right = false;
				break;
			default:
				break;
		}
	};

	$: {
		if (groundsSensored === 0) grounded = false;
		else grounded = true;
	}

	$: grounded ? onGrounded() : onTakeoff();

	$: if (rigidBody) start();
</script>

<svelte:window on:keydown|preventDefault={onKeyDown} on:keyup|preventDefault={onKeyUp} />

<T.Group {position}>
	<RigidBody
		dominance={127}
		enabledRotations={[false, false, false]}
		bind:rigidBody
		type={'dynamic'}
	>
		<CollisionGroups groups={playerCollisionGroups}>
			<Collider shape={'capsule'} args={[height / 2 - radius, radius]} />
		</CollisionGroups>

		<CollisionGroups groups={groundCollisionGroups}>
			<T.Group position={[0, -height / 2 + radius, 0]}>
				<Collider
					sensor
					on:sensorenter={() => (groundsSensored += 1)}
					on:sensorexit={() => (groundsSensored -= 1)}
					shape={'ball'}
					args={[radius * 1.2]}
				/>
			</T.Group>
		</CollisionGroups>

		<T.Group position.y={-height / 2}>
			<T.Mesh
				bind:ref={mesh}
				position.y={0.9}
				receiveShadow
				castShadow
				geometry={new CapsuleGeometry(0.3, 1.2)}
				material={new MeshStandardMaterial({ color: '#0059BA' })}
			/>
		</T.Group>
	</RigidBody>
</T.Group>
