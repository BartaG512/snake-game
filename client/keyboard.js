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
			case this.controlKeys[1]:
				this.directionCommand.removeOnce('LEFT');
				break;
			case this.controlKeys[0]:
				this.directionCommand.removeOnce('UP');
				break;
			case this.controlKeys[3]:
				this.directionCommand.removeOnce('RIGHT');
				break;
			case this.controlKeys[2]:
				this.directionCommand.removeOnce('DOWN');
				break;
			default:
				break;
		}
		this.onKeyChange(this.directionCommand);

		// Check if snake can move this direction
	}

	onKeyDown(event) {
		switch (event.keyCode) {
			case this.controlKeys[0]:
				this.directionCommand.insertOnce('UP');
				break;
			case this.controlKeys[1]:
				this.directionCommand.insertOnce('LEFT');
				break;
			case this.controlKeys[2]:
				this.directionCommand.insertOnce('DOWN');
				break;
			case this.controlKeys[3]:
				this.directionCommand.insertOnce('RIGHT');
				break;
			default:
				break;
		}
		this.onKeyChange(this.directionCommand);
	}
}

