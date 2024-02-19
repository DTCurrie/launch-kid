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

	const smoothPlayerPosX = spring(0);
	const smoothPlayerPosZ = spring(0);
	const playerPosition = new Vector3();

	let positionHasBeenSet = false;

	$: zoom = $size.width / 8;

	const cameraFollow = (mesh?: Mesh) => {
		if (!mesh) return;
		mesh.getWorldPosition(playerPosition);

		smoothPlayerPosX.set(playerPosition.x, {
			hard: !positionHasBeenSet
		});

		smoothPlayerPosZ.set(playerPosition.z, {
			hard: !positionHasBeenSet
		});

		if (!positionHasBeenSet) {
			positionHasBeenSet = true;
		}
	};
</script>

<!-- Helpers -->
<Debug depthTest={false} depthWrite={false} />
<T.GridHelper args={[50]} position.y={0.01} />

<T.Group position.y={0.9} let:ref={target}>
	<T.OrthographicCamera
		{zoom}
		makeDefault
		position={[50, 50, 30]}
		on:create={({ ref }) => {
			ref.lookAt(target.getWorldPosition(new Vector3()));
		}}
	>
		<OrbitControls
			enableDamping
			enableZoom={false}
			enablePan={false}
			maxPolarAngle={Math.PI / 2}
			target.x={$smoothPlayerPosX}
			target.y={target.position.y}
			target.z={$smoothPlayerPosZ}
		/>
	</T.OrthographicCamera>
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
