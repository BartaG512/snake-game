/* eslint-env browser */

// eslint-disable-next-line
class KeyboardController {
	constructor({ controlKeys, onKeyChange }) {
		this.controlKeys = controlKeys;
		this.onKeyChange = onKeyChange;
		this.directionCommand = [];

		this.addEventListeners();
	}

	addEventListeners() {
		document.addEventListener('keydown', (e) => {
			this.onKeyDown(e);
		});
		document.addEventListener('keyup', (e) => {
			this.onKeyUp(e);
		});
	}

	onKeyUp(event) {
		switch (event.keyCode) {
			case this.controlKeys[1]: // A
			case 37: // Arrow Left
				this.directionCommand.removeOnce('LEFT');
				break;
			case this.controlKeys[0]: // W
			case 38: // Arrow Up
				this.directionCommand.removeOnce('UP');
				break;
			case this.controlKeys[3]: // D
			case 39: // Arrow Right
				this.directionCommand.removeOnce('RIGHT');
				break;
			case this.controlKeys[2]: // S
			case 40: // Arrow Down
				this.directionCommand.removeOnce('DOWN');
				break;
			default:
				break;
		}
		this.onKeyChange(this.directionCommand);
	}

	onKeyDown(event) {
		switch (event.keyCode) {
			case this.controlKeys[0]: // W
			case 38: // Arrow Up
				event.preventDefault();
				this.directionCommand.insertOnce('UP');
				break;
			case this.controlKeys[1]: // A
			case 37: // Arrow Left
				event.preventDefault();
				this.directionCommand.insertOnce('LEFT');
				break;
			case this.controlKeys[2]: // S
			case 40: // Arrow Down
				event.preventDefault();
				this.directionCommand.insertOnce('DOWN');
				break;
			case this.controlKeys[3]: // D
			case 39: // Arrow Right
				event.preventDefault();
				this.directionCommand.insertOnce('RIGHT');
				break;
			default:
				break;
		}
		this.onKeyChange(this.directionCommand);
	}
}
