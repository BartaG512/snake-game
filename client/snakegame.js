/* eslint-env browser */

// eslint-disable-next-line
Array.prototype.removeElement = function(element) {
	const index = this.indexOf(element);

	if (index > -1) {
		this.splice(index, 1);
	}
};
Array.prototype.insertOnce = function(insert) {
	if (!this.includes(insert)) {
		this.push(insert);
	}
};

Array.prototype.removeOnce = function(insert) {
	if (this.includes(insert)) {
		this.removeElement(insert);
	}
};

function createDebugValueElement(debugValue) {
	return '<div class="debugvalue">' + debugValue + '</div>';
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

const black = 'rgba(0,0,0,1)';
const red = 'rgba(170,0,0,1)';
const green = 'rgba(10,150,10,0.7)';
const emptyField = 'rgba(10,30,10,0.5)';

function Game({ gameStartData, canvas, snakeLength, controlKeys, debugWindow, onGameEndAction }) {
	// CALLBACK FUNC IF GAME ENDED
	this.onGameEndAction = onGameEndAction;
	this.ctrlFdbElement = document.getElementsByClassName('ctrl');
	// Save to the local storage
	this.debugDiv = debugWindow[0];
	this.scoreDiv = debugWindow[1];
	this.controlKeys = controlKeys;
	this.snkLength = snakeLength;

	this.playerName = gameStartData.name;
	this.sizeX = gameStartData.mapWidth;
	this.sizeY = gameStartData.mapHeight;
	this.unit = gameStartData.mapUnit;
	this.startFps = gameStartData.difficulty;// frame per second
	this.fps = gameStartData.difficulty;// frame per second
	this.speedChangeRequest = false;

	this.canvas = canvas;
	this.cxt = this.canvas.getContext('2d');
	this.border = this.unit * 2;
	this.canvas.width = this.sizeX * this.unit + this.border; // a pálya méretének beállítása
	this.canvas.height = this.sizeY * this.unit + this.border;

	this.px = getRandomInt(this.sizeX); // snake on the middle
	this.py = getRandomInt(this.sizeY); // this on the middle
	this.vx = 0;
	this.vy = 0;
	this.nextVx = 1;
	this.nextVy = 0;
	this.trail = [];
	this.score = 0;
	// map 0 empty 1 snake trail 2 snake head 9 food
	this.map = new Array(this.sizeX).fill()
		.map(()=>{
			return new Array(this.sizeY).fill(0);
		}); // empty map
	this.mapX = this.sizeX + 'x' + this.sizeY;
	this.generateFood();

	// Snake next direction queues
	this.ctrlQueue = [];
	this.ctrlQueValid = [];

	// ADD gamepad monitoring
	this.gamepadCtrl = new GamepadCTRL({
		onAxisChange: (directionCommand) => {
			this.onKeyChange(directionCommand);
		},
	});

	// ADD keyboard monitoring
	this.keyBoardCtrl = new KeyboardController({
		controlKeys: this.controlKeys,
		onKeyChange: (directionCommand) => {
			this.onKeyChange(directionCommand);
		},
	});
}

Game.prototype.onKeyChange = function(directionCommand) {
	this.ctrlQueue = directionCommand;
	this.validateDir(this.ctrlQueue);
};

Game.prototype.pauseGame = function() {
	if (this.SessionId) {
		clearInterval(this.SessionId);
	} // pause game
	this.isRunning = false;
};

Game.prototype.endGame = function() {
	if (this.SessionId) {
		clearInterval(this.SessionId);
	} // pause game
};

Game.prototype.continueGame = function() {
	this.SessionId = setInterval(this.updateGame.bind(this), 1000 / this.fps); // start game
};

Game.prototype.updateGame = function() {
	if (this.speedChangeRequest) {
		this.pauseGame();
		//  this.fps = this.fps + this.score*0.05;
		this.speedChangeRequest = false;
		this.continueGame();
	}
	this.clearBoard();
	this.moveSnake();
	this.drawBoard(this.border);
	this.isRunning = true;
};

Game.prototype.clearBoard = function() {
	this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

Game.prototype.getDirVector = function(dir) {
	switch (dir) {
		case 'UP':
			return { x: 0, y: -1 };
		case 'LEFT':
			return { x: -1, y: 0 };
		case 'DOWN':
			return { x: 0, y: 1 };
		case 'RIGHT':
			return { x: 1, y: 0 };
		default:
			return { x: null, y: null };
	}
};

Game.prototype.getCurrentDirinString = function() {
	if (this.vx === 0 && this.vy === -1) {
		this.currentDir = 'UP';
	}

	if (this.vx === -1 && this.vy === 0) {
		this.currentDir = 'LEFT';
	}

	if (this.vx === 0 && this.vy === 1) {
		this.currentDir = 'DOWN';
	}

	if (this.vx === 1 && this.vy === 0) {
		this.currentDir = 'RIGHT';
	}
};

Game.prototype.validateDir = function(directionCommand) {
	// check if the snake can go this direction and makes a
	this.ctrlQueValid = [];
	for (let i = 0; i < directionCommand.length; i++) {
		this.ctrlQueValid[i] = directionCommand[i];
	}
	for (let i = 0; i < directionCommand.length; i++) {
		const vector = this.getDirVector(directionCommand[i]);

		if (this.vx === -1 * vector.x && this.vy === 0 || this.vy === -1 * vector.y && this.vx === 0) {
			this.ctrlQueValid.removeElement(directionCommand[i]);
		}
	}

	if (this.ctrlQueValid.length > 0) {
		this.nextVx = this.getDirVector(this.ctrlQueValid[this.ctrlQueValid.length - 1]).x;
		this.nextVy = this.getDirVector(this.ctrlQueValid[this.ctrlQueValid.length - 1]).y;
	}
};

Game.prototype.moveSnake = function() {
	// read next position and increment position by speed
	// console.log('nextVx', this.nextVx, 'nextVy', this.nextVy);
	this.vx = this.nextVx;
	this.vy = this.nextVy;
	this.getCurrentDirinString();

	// move snake
	this.px += this.vx;
	this.py += this.vy;

	// goes out on map edge come in opposite side
	if (this.px < 0) {
		this.px = this.sizeX - 1;
	}

	if (this.px > this.sizeX - 1) {
		this.px = 0;
	}

	if (this.py < 0) {
		this.py = this.sizeY - 1;
	}

	if (this.py > this.sizeY - 1) {
		this.py = 0;
	}

	// console.log("current vector",(this.getDirVector(this.currentDir)).x);
	while (this.snkLength <= this.trail.length) {
		//  console.log("this.trail", this.trail);
		this.map[this.trail[0].x][this.trail[0].y] = 0; // 0 for empty
		this.trail.shift();
	}

	for (let i = 0; i < this.trail.length; i++) {
		const snakeElement = this.trail[i];
		this.map[this.px][this.py] = 2; // 2 for Snake head
		this.map[snakeElement.x][snakeElement.y] = 1; // 1 for snake trail

		if (this.px === this.trail[i].x && this.py === this.trail[i].y) {
			// If snake meets itself length reduced to 1 and score reduced to 0
			this.onGameEndAction({
				name: this.playerName,
				score: this.score,
				mapSize: this.sizeX + 'x' + this.sizeY,
			});
		}
	}

	this.trail.push({ x: this.px, y: this.py });

	// if snake eat the food
	if (this.px === this.fx && this.py === this.fy) {
		this.snkLength++;// growing snake
		//  this.score += Math.floor(100 * this.fps / (5*(this.sizeX * this.sizeY))); //  plus 1 point
		this.score += Math.floor(this.fps); //  plus 1 point
		this.generateFood(); // generate new apple pos
		this.fps *= 1.04;//  plus 1 point
		this.speedChangeRequest = true;
	}

	this.debugDiv.innerHTML =
    '<div class="text-center">Debug</div>' +
    '<br>Position X: ' + createDebugValueElement(this.px) +
    '<br>Position Y: ' + createDebugValueElement(this.py) +
    '<br>Direction X: ' + createDebugValueElement(this.vx) +
    '<br>Direction Y: ' + createDebugValueElement(this.vy) +
    '<br>Food X: ' + createDebugValueElement(this.fx) +
    '<br>Food Y: ' + createDebugValueElement(this.fy) +
    '<br>FPS: ' + createDebugValueElement(this.fps) +
    '<br>Dir cmd: ' + createDebugValueElement(this.ctrlQueue) +
    '<br>Dir cmd valid: ' + createDebugValueElement(this.ctrlQueValid) +
    '<br> Current direction: ' + createDebugValueElement(this.currentDir) +
    '<br> Trail length ' + createDebugValueElement(this.trail.length) +
    '<br> snkLength ' + createDebugValueElement(this.snkLength);
};

Game.prototype.drawBoard = function(offset) {
	const { cxt } = this;
	cxt.fillStyle = black;
	cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
	const scoreText = `${this.playerName}'s score: ${this.score}`;
	const difficulty = 'Level: ' + Math.floor(this.fps);
	const fontSize = offset / 4;
	// this.scoreDiv.innerText = this.playerName + "'s score: " + this.score;
	const baseOffset = {};
	baseOffset.x = offset / 2;
	baseOffset.y = offset / 2;
	for (let x = 0; x < this.sizeX; x++) {
		for (let y = 0; y < this.sizeY; y++) {
			if (this.map[x][y] === 9) { // 9 draw food
				this.drawPixel(baseOffset, x, y, red, this.unit);
			}

			if (this.map[x][y] === 1) { // snake trail
				this.drawPixel(baseOffset, x, y, green, this.unit, this.unit * 0.01);
			}

			if (this.map[x][y] === 2) { // snake head
				this.drawPixel(baseOffset, x, y, green, this.unit);
			}

			// chess board pattern for empty fields
			if (this.map[x][y] === 0) {
				if ((x + y) % 2 === 0) {
					this.drawPixel(baseOffset, x, y, emptyField, this.unit);
				}

				if ((x + y) % 2 === 1) { // chess table pattern
					this.drawPixel(baseOffset, x, y, emptyField, this.unit);
				}
			}
		}
	}

	cxt.font = fontSize + 'px Operator Mono SSm A';
	cxt.fillStyle = 'white';
	cxt.fillText(scoreText, this.canvas.width / 10 * 2, fontSize / 4 * 5);
	cxt.fillText(difficulty, this.canvas.width / 10 * 7, fontSize / 4 * 5);
};

Game.prototype.outPutText = function() {

};

Game.prototype.generateFood = function({ generatingAttempt = 0 } = {}) {
	this.maxGenerateAttempt = 2 * this.sizeX * this.sizeY;
	const attempt = generatingAttempt + 1;
	this.fx = getRandomInt(this.sizeX);
	this.fy = getRandomInt(this.sizeY);
	let foodOnSnake = false;
	// If food is on snake generate again
	for (let i = 0; i < this.trail.length; i++) {
		if (this.fx === this.trail[i].x && this.fy === this.trail[i].y) {
			foodOnSnake = true;
			break;
		}
	}

	if (foodOnSnake) {
		console.log('generatingAttempt', generatingAttempt);

		if (generatingAttempt > this.maxGenerateAttempt) {
			throw new Error('Cannot generate food. Reached max attempt:' + generatingAttempt);
		}
		this.generateFood({ generatingAttempt: attempt });
	}

	this.map[this.fx][this.fy] = 9; // put food on the map
};

Game.prototype.drawCircle = function(posy, posY, color, size, offset) {
	if (typeof offset === 'undefined' || !offset) {
		var offset = 0;
	}
	this.cxt.fillStyle = color;
	this.cxt.beginPath();
	this.cxt.arc(posy * size + size / 2 + offset, posY * size + size / 2 + offset, size / 2 - 2 * offset, 0, Math.PI * 2, true);
	this.cxt.closePath();
	this.cxt.fill();
};

Game.prototype.drawPixel = function(offsetBase, posy, posY, color, size, offsetRect) {
	if (typeof offsetRect === 'undefined' || !offsetRect) {
		var offsetRect = 0;
	}
	const startx = offsetBase.x;
	const starty = offsetBase.y;
	const x = posy * size + offsetRect + startx;
	const y = posY * size + offsetRect + starty;
	this.cxt.fillStyle = color;
	this.cxt.fillRect(x, y, size - 2 * offsetRect, size - 2 * offsetRect);
};
