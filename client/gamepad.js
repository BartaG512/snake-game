/* eslint-env browser */

class GamepadCTRL {
	constructor({ onAxisChange }) {
		this.onAxisChange = onAxisChange;
		this.directionCommand = [];
		this.lastAxes = [0, 0];

		window.addEventListener('gamepadconnected', this.connect.bind(this));
		window.addEventListener('gamepaddisconnected', this.disconnect.bind(this));

		this.gamePadCache = {
			controller: {},
			buttons: [],
			buttonsCache: [],
			buttonsStatus: [],
			axesStatus: [],
		};
	}

	saveController() {
		let controller;

		if (navigator.getGamepads) {
			controller = navigator.getGamepads();
		} else if (navigator.webkitGetGamepads) {
			controller = navigator.webkitGetGamepads();
		} else {
			controller = [];
		}
		this.gamePadCache.controller = controller;
	}

	connect(event) {
		this.saveController();
		console.log('Gamepad connected at index %d: %s. %d buttons, %d axes.',
			event.gamepad.index, event.gamepad.id,
			event.gamepad.buttons.length, event.gamepad.axes.length);

		this.gamePadCache.controller = event.gamepad;
		console.log('Gamepad connected.', this.gamePadCache.controller);
	}

	disconnect(event) {
		delete this.gamePadCache.controller;
		console.log('Gamepad disconnected.');
	}

	update() {
		this.saveController();
		const c = this.gamePadCache.controller[0] || {};

		const axes = [];

		if (c.axes) {
			for (let a = 0, x = c.axes.length; a < x; a++) {
				axes.push(c.axes[a].toFixed(0));
			}
		}
		this.gamePadCache.axesStatus = axes;
		const [x, y] = this.gamePadCache.axesStatus;

		switch (this.gamePadCache.axesStatus[0]) {
			case '-1':
				this.directionCommand.insertOnce('LEFT');
				break;
			case '1':
				this.directionCommand.insertOnce('RIGHT');
				break;
			default:
				this.directionCommand.removeOnce('LEFT');
				this.directionCommand.removeOnce('RIGHT');
				break;
		}
		console.log(this.directionCommand);
		let change;

		if (typeof this.directionCommand !== 'undefined') {
			change = this.lastAxes[0] !== this.gamePadCache.axesStatus[0] || this.lastAxes[1] !== this.gamePadCache.axesStatus[1];
		}
		// console.log('change', change);

		if (change) {
			this.onAxisChange(this.directionCommand);
		}
		const [lastAxis0, lastAxis1] = this.gamePadCache.axesStatus;
		this.lastAxes[0] = lastAxis0;
		this.lastAxes[1] = lastAxis1;
		requestAnimationFrame(() => {
			this.update();
		});
	}
}

