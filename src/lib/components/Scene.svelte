<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrbitControls, interactivity } from '@threlte/extras';
	import { AutoColliders, CollisionGroups, Debug } from '@threlte/rapier';
	import { Mesh, Vector3 } from 'three';
	import Ground from './Ground.svelte';
	import Player from './Player.svelte';
	import { spring } from 'svelte/motion';

	interactivity();

	const { size } = useThrelte();

	const playerPosition = new Vector3();
	const playerForward = new Vector3();

	const smoothPlayerPosX = spring(0);
	const smoothPlayerPosY = spring(0);
	const smoothPlayerPosZ = spring(0);

	const cameraPosition = new Vector3();
	const cameraOffset = new Vector3(-100, 1, -100);

	const smoothCameraPosX = spring(0);
	const smoothCameraPosZ = spring(0);

	$: zoom = $size.width / 100;

	const cameraFollow = (mesh?: Mesh) => {
		if (!mesh) return;
		mesh.getWorldPosition(playerPosition);
		mesh.getWorldDirection(playerForward);

		smoothPlayerPosX.set(playerPosition.x, {});
		smoothPlayerPosY.set(playerPosition.y, {});
		smoothPlayerPosZ.set(playerPosition.z, {});

		cameraPosition.addVectors(playerPosition, playerForward.multiply(cameraOffset));

		smoothCameraPosX.set(cameraPosition.x, {});
		smoothCameraPosZ.set(cameraPosition.z, {});
	};
</script>

<!-- Helpers -->
<Debug depthTest={false} depthWrite={false} />
<T.GridHelper args={[50]} position.y={0.01} />

<T.Group position.y={0.9}>
	<T.PerspectiveCamera {zoom} makeDefault position={[$smoothCameraPosX, 30, $smoothCameraPosZ]}>
		<OrbitControls
			enableDamping
			enableRotate={false}
			enablePan={false}
			minDistance={zoom * 5}
			maxDistance={zoom * 50}
			maxPolarAngle={Math.PI / 2}
			target.x={$smoothPlayerPosX}
			target.y={$smoothPlayerPosY}
			target.z={$smoothPlayerPosZ}
		/>
	</T.PerspectiveCamera>
</T.Group>

<!-- Light -->
<T.DirectionalLight intensity={0.8} position.x={5} position.y={10} />
<T.AmbientLight intensity={0.2} />
<!-- <ContactShadows scale={10} blur={2} far={2.5} opacity={0.5} /> -->

<!--
	The ground needs to be on both group 15 which is the group
	to detect the groundedness of the player as well as on group
	0 which is the group that the player is actually physically
	interacting with.
 -->
<CollisionGroups groups={[0, 15]}>
	<Ground />
</CollisionGroups>

<!--
	All physically interactive stuff should be on group 0
-->
<CollisionGroups groups={[0]}>
	<Player position={[0, 2, -3]} {cameraFollow} />

	<AutoColliders>
		<!-- Scenery objects go here -->
	</AutoColliders>
</CollisionGroups>
