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

// ============================================
// Sound Engine (Web Audio API)
// ============================================
const SoundEngine = {
	ctx: null,
	init() {
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		}
	},
	play(type, freq, duration, volume) {
		if (!this.ctx) this.init();
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
		gain.gain.setValueAtTime(volume || 0.1, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
		osc.connect(gain);
		gain.connect(this.ctx.destination);
		osc.start(this.ctx.currentTime);
		osc.stop(this.ctx.currentTime + duration);
	},
	eat() {
		this.play('sine', 520, 0.1, 0.12);
		setTimeout(() => this.play('sine', 780, 0.1, 0.1), 50);
		setTimeout(() => this.play('sine', 1040, 0.15, 0.08), 100);
	},
	die() {
		this.play('sawtooth', 200, 0.3, 0.12);
		setTimeout(() => this.play('sawtooth', 150, 0.3, 0.1), 100);
		setTimeout(() => this.play('sawtooth', 80, 0.5, 0.08), 200);
	},
	start() {
		this.play('sine', 330, 0.1, 0.08);
		setTimeout(() => this.play('sine', 440, 0.1, 0.08), 80);
		setTimeout(() => this.play('sine', 660, 0.15, 0.1), 160);
	}
};

// ============================================
// Particle System
// ============================================
class Particle {
	constructor(x, y, color) {
		this.x = x;
		this.y = y;
		const angle = Math.random() * Math.PI * 2;
		const speed = 1 + Math.random() * 4;
		this.vx = Math.cos(angle) * speed;
		this.vy = Math.sin(angle) * speed;
		this.life = 1.0;
		this.decay = 0.02 + Math.random() * 0.03;
		this.size = 2 + Math.random() * 4;
		this.color = color;
	}
	update() {
		this.x += this.vx;
		this.y += this.vy;
		this.vx *= 0.96;
		this.vy *= 0.96;
		this.life -= this.decay;
		this.size *= 0.97;
	}
	draw(cxt) {
		cxt.save();
		cxt.globalAlpha = this.life;
		cxt.fillStyle = this.color;
		cxt.shadowColor = this.color;
		cxt.shadowBlur = 8;
		cxt.beginPath();
		cxt.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		cxt.fill();
		cxt.restore();
	}
}

// ============================================
// Score Popup
// ============================================
class ScorePopup {
	constructor(x, y, text) {
		this.x = x;
		this.y = y;
		this.text = text;
		this.life = 1.0;
		this.vy = -1.5;
	}
	update() {
		this.y += this.vy;
		this.vy *= 0.98;
		this.life -= 0.025;
	}
	draw(cxt) {
		cxt.save();
		cxt.globalAlpha = this.life;
		cxt.font = 'bold 16px Orbitron, monospace';
		cxt.fillStyle = '#00ffcc';
		cxt.shadowColor = '#00ffcc';
		cxt.shadowBlur = 10;
		cxt.textAlign = 'center';
		cxt.fillText(this.text, this.x, this.y);
		cxt.restore();
	}
}

// ============================================
// Game
// ============================================
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
	this.canvas.width = this.sizeX * this.unit + this.border;
	this.canvas.height = this.sizeY * this.unit + this.border;

	this.px = getRandomInt(this.sizeX);
	this.py = getRandomInt(this.sizeY);
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

	// Visual effects state
	this.particles = [];
	this.scorePopups = [];
	this.foodPulse = 0;
	this.frameCount = 0;

	// Initialize sound
	SoundEngine.init();
	SoundEngine.start();

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
		this.speedChangeRequest = false;
		this.continueGame();
	}
	this.frameCount++;
	this.foodPulse += 0.08;
	this.clearBoard();
	this.moveSnake();
	this.updateParticles();
	this.updateScorePopups();
	this.drawBoard(this.border);
	this.drawParticles();
	this.drawScorePopups();
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

Game.prototype.shakeScreen = function() {
	this.canvas.classList.add('shake');
	setTimeout(() => this.canvas.classList.remove('shake'), 150);
};

Game.prototype.spawnEatParticles = function(x, y) {
	const baseOffset = { x: this.border / 2, y: this.border / 2 };
	const centerX = baseOffset.x + x * this.unit + this.unit / 2;
	const centerY = baseOffset.y + y * this.unit + this.unit / 2;
	const colors = ['#00ff88', '#00ffcc', '#00ccff', '#88ff00', '#ffffff'];
	for (let i = 0; i < 18; i++) {
		this.particles.push(new Particle(centerX, centerY, colors[Math.floor(Math.random() * colors.length)]));
	}
};

Game.prototype.spawnDeathParticles = function() {
	for (let i = 0; i < this.trail.length; i++) {
		const baseOffset = { x: this.border / 2, y: this.border / 2 };
		const centerX = baseOffset.x + this.trail[i].x * this.unit + this.unit / 2;
		const centerY = baseOffset.y + this.trail[i].y * this.unit + this.unit / 2;
		const colors = ['#ff0055', '#ff3377', '#ff6600', '#ffcc00'];
		for (let j = 0; j < 4; j++) {
			this.particles.push(new Particle(centerX, centerY, colors[Math.floor(Math.random() * colors.length)]));
		}
	}
};

Game.prototype.updateParticles = function() {
	for (let i = this.particles.length - 1; i >= 0; i--) {
		this.particles[i].update();
		if (this.particles[i].life <= 0) {
			this.particles.splice(i, 1);
		}
	}
};

Game.prototype.drawParticles = function() {
	for (let i = 0; i < this.particles.length; i++) {
		this.particles[i].draw(this.cxt);
	}
};

Game.prototype.updateScorePopups = function() {
	for (let i = this.scorePopups.length - 1; i >= 0; i--) {
		this.scorePopups[i].update();
		if (this.scorePopups[i].life <= 0) {
			this.scorePopups.splice(i, 1);
		}
	}
};

Game.prototype.drawScorePopups = function() {
	for (let i = 0; i < this.scorePopups.length; i++) {
		this.scorePopups[i].draw(this.cxt);
	}
};

Game.prototype.moveSnake = function() {
	// read next position and increment position by speed
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

	while (this.snkLength <= this.trail.length) {
		this.map[this.trail[0].x][this.trail[0].y] = 0; // 0 for empty
		this.trail.shift();
	}

	for (let i = 0; i < this.trail.length; i++) {
		const snakeElement = this.trail[i];
		this.map[this.px][this.py] = 2; // 2 for Snake head
		this.map[snakeElement.x][snakeElement.y] = 1; // 1 for snake trail

		if (this.px === this.trail[i].x && this.py === this.trail[i].y) {
			// Snake hit itself - game over
			this.spawnDeathParticles();
			SoundEngine.die();
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
		this.snkLength++;
		const points = Math.floor(this.fps);
		this.score += points;
		this.generateFood();
		this.fps *= 1.04;
		this.speedChangeRequest = true;

		// Effects
		SoundEngine.eat();
		this.shakeScreen();
		this.spawnEatParticles(this.px, this.py);
		const baseOffset = { x: this.border / 2, y: this.border / 2 };
		this.scorePopups.push(new ScorePopup(
			baseOffset.x + this.px * this.unit + this.unit / 2,
			baseOffset.y + this.py * this.unit,
			'+' + points
		));
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

	// Dark background with subtle gradient
	const bgGrad = cxt.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
	bgGrad.addColorStop(0, '#060610');
	bgGrad.addColorStop(1, '#0a0a18');
	cxt.fillStyle = bgGrad;
	cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);

	const scoreText = `${this.playerName}'s score: ${this.score}`;
	const difficulty = 'Level: ' + Math.floor(this.fps);
	const fontSize = offset / 4;
	const baseOffset = {};
	baseOffset.x = offset / 2;
	baseOffset.y = offset / 2;

	for (let x = 0; x < this.sizeX; x++) {
		for (let y = 0; y < this.sizeY; y++) {
			if (this.map[x][y] === 9) { // Food
				this.drawFood(baseOffset, x, y);
			}

			if (this.map[x][y] === 1) { // Snake body
				const segIndex = this.getTrailIndex(x, y);
				this.drawSnakeSegment(baseOffset, x, y, segIndex, false);
			}

			if (this.map[x][y] === 2) { // Snake head
				this.drawSnakeSegment(baseOffset, x, y, this.trail.length - 1, true);
			}

			// Subtle grid for empty fields
			if (this.map[x][y] === 0) {
				this.drawEmptyCell(baseOffset, x, y);
			}
		}
	}

	// Score text with glow
	cxt.save();
	cxt.font = 'bold ' + fontSize + 'px Orbitron, monospace';
	cxt.fillStyle = '#00ff88';
	cxt.shadowColor = '#00ff88';
	cxt.shadowBlur = 8;
	cxt.fillText(scoreText, this.canvas.width / 10 * 2, fontSize / 4 * 5);
	cxt.fillStyle = '#00ccff';
	cxt.shadowColor = '#00ccff';
	cxt.fillText(difficulty, this.canvas.width / 10 * 7, fontSize / 4 * 5);
	cxt.restore();
};

Game.prototype.getTrailIndex = function(x, y) {
	for (let i = 0; i < this.trail.length; i++) {
		if (this.trail[i].x === x && this.trail[i].y === y) return i;
	}
	return 0;
};

Game.prototype.drawSnakeSegment = function(baseOffset, x, y, segIndex, isHead) {
	const { cxt, unit } = this;
	const px = baseOffset.x + x * unit;
	const py = baseOffset.y + y * unit;
	const gap = unit * 0.08;

	// Calculate color based on position in trail (gradient from tail to head)
	const t = this.trail.length > 1 ? segIndex / (this.trail.length - 1) : 1;

	// HSL interpolation: tail is darker, head is brighter
	const hue = 140 + t * 20; // green range
	const sat = 70 + t * 30;
	const light = 25 + t * 35;

	cxt.save();

	if (isHead) {
		// Glowing head
		cxt.shadowColor = '#00ff88';
		cxt.shadowBlur = 12;
		cxt.fillStyle = `hsl(${hue}, ${sat}%, ${light + 10}%)`;
		this.roundRect(cxt, px + gap, py + gap, unit - gap * 2, unit - gap * 2, unit * 0.25);
		cxt.fill();

		// Eye dots
		const eyeSize = Math.max(unit * 0.12, 1.5);
		cxt.shadowBlur = 0;
		cxt.fillStyle = '#ffffff';
		if (this.vx === 1) { // right
			cxt.beginPath();
			cxt.arc(px + unit * 0.7, py + unit * 0.3, eyeSize, 0, Math.PI * 2);
			cxt.arc(px + unit * 0.7, py + unit * 0.7, eyeSize, 0, Math.PI * 2);
			cxt.fill();
		} else if (this.vx === -1) { // left
			cxt.beginPath();
			cxt.arc(px + unit * 0.3, py + unit * 0.3, eyeSize, 0, Math.PI * 2);
			cxt.arc(px + unit * 0.3, py + unit * 0.7, eyeSize, 0, Math.PI * 2);
			cxt.fill();
		} else if (this.vy === -1) { // up
			cxt.beginPath();
			cxt.arc(px + unit * 0.3, py + unit * 0.3, eyeSize, 0, Math.PI * 2);
			cxt.arc(px + unit * 0.7, py + unit * 0.3, eyeSize, 0, Math.PI * 2);
			cxt.fill();
		} else { // down
			cxt.beginPath();
			cxt.arc(px + unit * 0.3, py + unit * 0.7, eyeSize, 0, Math.PI * 2);
			cxt.arc(px + unit * 0.7, py + unit * 0.7, eyeSize, 0, Math.PI * 2);
			cxt.fill();
		}
	} else {
		// Body segment with gradient color
		cxt.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
		cxt.shadowColor = `hsl(${hue}, ${sat}%, ${light}%)`;
		cxt.shadowBlur = 4;
		this.roundRect(cxt, px + gap, py + gap, unit - gap * 2, unit - gap * 2, unit * 0.2);
		cxt.fill();
	}

	cxt.restore();
};

Game.prototype.drawFood = function(baseOffset, x, y) {
	const { cxt, unit } = this;
	const centerX = baseOffset.x + x * unit + unit / 2;
	const centerY = baseOffset.y + y * unit + unit / 2;

	// Pulsating glow
	const pulse = 0.8 + Math.sin(this.foodPulse) * 0.2;
	const radius = (unit / 2 - 2) * pulse;

	cxt.save();

	// Outer glow
	cxt.shadowColor = '#ff0055';
	cxt.shadowBlur = 15 + Math.sin(this.foodPulse) * 5;

	// Radial gradient for the food
	const grad = cxt.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
	grad.addColorStop(0, '#ff4488');
	grad.addColorStop(0.6, '#ff0055');
	grad.addColorStop(1, '#cc0044');

	cxt.fillStyle = grad;
	cxt.beginPath();
	cxt.arc(centerX, centerY, radius, 0, Math.PI * 2);
	cxt.fill();

	// Inner highlight
	cxt.shadowBlur = 0;
	cxt.fillStyle = 'rgba(255, 255, 255, 0.3)';
	cxt.beginPath();
	cxt.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
	cxt.fill();

	cxt.restore();
};

Game.prototype.drawEmptyCell = function(baseOffset, x, y) {
	const { cxt, unit } = this;
	const px = baseOffset.x + x * unit;
	const py = baseOffset.y + y * unit;

	// Subtle checkerboard
	if ((x + y) % 2 === 0) {
		cxt.fillStyle = 'rgba(0, 255, 136, 0.03)';
	} else {
		cxt.fillStyle = 'rgba(0, 255, 136, 0.015)';
	}
	cxt.fillRect(px, py, unit, unit);

	// Grid lines
	cxt.strokeStyle = 'rgba(0, 255, 136, 0.04)';
	cxt.lineWidth = 0.5;
	cxt.strokeRect(px, py, unit, unit);
};

Game.prototype.roundRect = function(cxt, x, y, w, h, r) {
	r = Math.min(r, w / 2, h / 2);
	cxt.beginPath();
	cxt.moveTo(x + r, y);
	cxt.arcTo(x + w, y, x + w, y + h, r);
	cxt.arcTo(x + w, y + h, x, y + h, r);
	cxt.arcTo(x, y + h, x, y, r);
	cxt.arcTo(x, y, x + w, y, r);
	cxt.closePath();
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
