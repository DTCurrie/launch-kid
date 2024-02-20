export type Keys = 'left' | 'right' | 'down' | 'up' | 'action';
export type PressedKeys = Record<Keys, boolean>;

export const playerInputs = (keys: PressedKeys) => {
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
				keys.action = true;
				break;
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
			case ' ':
				keys.action = false;
				break;
			default:
				break;
		}
	};

	return { onKeyDown, onKeyUp };
};
