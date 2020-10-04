/* eslint-env browser */

function setVisibility({ elements, visibility }) {
	// set visbility for elements
	for (let i = 0; i < elements.length; i++) {
		if (visibility) {
			elements[i].style.display = 'block'; // visible
			elements[i].visible = visibility;
		} else {
			elements[i].style.display = 'none'; // hidden
			elements[i].visible = visibility;
		}
	}
}

function compareBy(property) {
	return (a, b) => {
		if (a[property] > b[property]) {
			return -1;
		}

		if (a[property] < b[property]) {
			return 1;
		}
		return 0;
	};
}

class GameUI {
	constructor() {
		this.getElements();
		this.addEventListenersForButtons();
		setVisibility({ elements: [this.endGameDiv, this.highscoreDiv], visibility: false });
		// Update the current slider value (each time you drag the slider handle)
		// PIXEL SIZE

		this.initGameSettingsMenu();

		// ADD EVENT LISTENERS FOR BUTTONS
	}

	initGameSettingsMenu() {
		// Auto size switch changing detection
		this.inputAutoPixelSize.onchange = () => {
			this.inputPixelSize.disabled = this.inputAutoPixelSize.checked; // if checked dont let change size input

			if (this.inputAutoPixelSize.checked) {
				this.inputPixelSize.value = 600 / Math.pow(this.inputWidth.value * this.inputHeight.value, 0.5);
				this.outputP.innerHTML = this.inputPixelSize.value;
				this.inputPixelSize.disabled = true;
			}
		};

		// DIFFICULTY
		this.inputDifficulty.oninput = () =>{
			this.outputD.innerHTML = this.inputDifficulty.value;
		};

		// Pixel Size change
		this.inputPixelSize.oninput = () => {
			//  console.log(this.inputAutoPixelSize.checked);
			this.outputP.innerHTML = this.inputPixelSize.value;
		};

		function calculateSize({ width, height }) {
			return 600 / Math.pow(width * height, 0.5);
		}

		this.inputWidth.oninput = () => {
			this.outputW.innerHTML = this.inputWidth.value;

			//    console.log(this.inputAutoPixelSize.checked);
			if (this.inputAutoPixelSize.checked) {
				this.inputPixelSize.value = calculateSize({
					width: this.inputWidth.value,
					height: this.inputHeight.value,
				});
				this.outputP.innerHTML = this.inputPixelSize.value;
			}
		};

		this.inputHeight.oninput = () => {
			this.outputH.innerHTML = this.inputHeight.value;

			if (this.inputAutoPixelSize.checked) {
				//      console.log(600/Math.pow(outputW.innerHTML*outputH.innerHTML,0.5));
				this.inputPixelSize.value = calculateSize({
					width: this.inputWidth.value,
					height: this.inputHeight.value,
				});
				this.outputP.innerHTML = this.inputPixelSize.value;
			}
		};
	}

	addEventListenersForButtons() {
		this.showWindow('mainMenuScreen');

		this.continueBtn.addEventListener('click', () => {
			this.showWindow('showBoard');
		});

		this.sizePickerDiv.addEventListener('change', () => {
			this.updateTable();
		});

		this.highScoreBtn.addEventListener('click', () => {
			this.showWindow('highScore');
		});

		for (let i = 0; i < this.mainMenuButtons.length; i++) {
			this.mainMenuButtons[i].addEventListener('click', () => {
				this.showWindow('mainMenuScreen');
			});
		}

		for (let i = 0; i < this.newGameBtns.length; i++) {
			this.newGameBtns[i].addEventListener('click', () => {
				this.showWindow('newGameCreatingMenu');
			});
		}

		// Click on start button
		for (let i = 0; i < this.startGameBtns.length; i++) {
			this.startGameBtns[i].addEventListener('click', this.newGameInit.bind(this));
		}

		document.addEventListener('keypress', this.interfaceKeyDown.bind(this));
	}

	getElements() {
		this.outputD = document.getElementById('valueD');

		this.outputW = document.getElementById('valueW');

		this.outputH = document.getElementById('valueH');

		this.finalScore = document.getElementById('final-score');
		this.inputPlayersName = document.getElementById('inputPlayersName');
		this.outputP = document.getElementById('valueU');
		this.inputAutoPixelSize = document.getElementById('inputAutoPixelSize');
		this.inputHeight = document.getElementById('inputHeight');
		console.log('this.inputHeight', this.inputHeight);
		this.inputPixelSize = document.getElementById('inputPixelSize');
		this.inputWidth = document.getElementById('inputWidth');
		this.inputDifficulty = document.getElementById('inputDifficulty');

		// MAINMENU

		this.newGameMenu = document.getElementById('newgame-menu');
		this.menuMain = document.getElementById('menu');
		this.highScoreBtn = document.getElementById('highScore-btn');
		this.continueBtn = document.getElementById('continue-btn');

		// GAME
		this.scoreDiv = document.getElementById('score');
		this.debugDiv = document.getElementById('debug');
		this.canvas = document.querySelector('canvas');
		this.cxt = this.canvas.getContext('2d');

		//  HIGHSCORE
		this.highscore = [];
		this.highscoreDiv = document.getElementById('highscore-cont');
		this.highscoreTable = document.getElementById('highscore-table');
		this.sizeListDiv = document.getElementById('size-list');
		this.sizePickerDiv = document.getElementById('size-picker');

		// END GAME POP UP
		this.endGameDiv = document.getElementById('endgamemenu');

		// Get BUTTONS
		this.newGameBtns = [
			document.getElementById('newGame-btn'),
			document.getElementById('endCreateNewGame-btn'),
		];

		this.startGameBtns = [
			document.getElementById('startgame-btn'),
			document.getElementById('endRestart-btn'),
		];

		this.mainMenuButtons = [
			document.getElementById('back-btn'),
			document.getElementById('endMainMenu-btn'),
			document.getElementById('highscoreback-btn'),
		];

		this.debugWindow = [this.debugDiv, this.scoreDiv];
	}

	validateInputs(inputsToCheck) {
		let valid = true;
		for (let i = 0; i < inputsToCheck.length; i++) {
			valid &= inputsToCheck[i].checkValidity();
		}
		return valid;
	}

	showWindow(nextState) {
		this.currentState = nextState;
		switch (this.currentState) {
			case 'mainMenuScreen':
				if (this.game !== undefined) {
					this.game.pauseGame();
				}
				setVisibility({ elements: [this.menuMain], visibility: true });
				setVisibility({ elements: [this.canvas, this.newGameMenu, this.endGameDiv, this.debugDiv, this.highscoreDiv], visibility: false });

				if (this.game !== undefined && !this.gameOver) {
					setVisibility({ elements: [this.scoreDiv, this.continueBtn], visibility: true });
				} else {
					setVisibility({ elements: [this.continueBtn], visibility: false });
				}
				break;
			case 'newGameCreatingMenu':
				setVisibility({ elements: [this.menuMain, this.canvas, this.endGameDiv], visibility: false });
				setVisibility({ elements: [this.newGameMenu], visibility: true });

				if (this.game !== undefined) {
					setVisibility({ elements: [this.scoreDiv], visibility: true });
				}
				this.loadGameData();
				break;
			case 'showBoard':
				if (typeof this.game !== 'undefined') {
					this.game.continueGame();
				}
				setVisibility({ elements: [this.menuMain, this.newGameMenu, this.endGameDiv], visibility: false });
				setVisibility({ elements: [this.canvas, this.debugDiv], visibility: true });
				break;
			case 'gameOver':
				setVisibility({ elements: [this.endGameDiv], visibility: true });
				this.game.pauseGame();
				this.gameOver = true;
				const { name, score } = this.lastGameResult;
				this.finalScore.innerHTML = `${name}'s score: ${score}'`;
				break;
			case 'highScore':
			// SET tab visibilities show only highscorediv
				setVisibility({
					elements: [this.menuMain, this.canvas, this.endGameDiv, this.debugDiv],
					visibility: false,
				});
				setVisibility({
					elements: [this.highscoreDiv],
					visibility: true,
				});
				// Geting and building HIGHSCORE
				this.highscore = this.getFromLocalStorage('highscoreTable');

				if (typeof this.highscore !== 'undefined') {
					this.buildHighScore();
					this.updateTable();
				}
				break;
			default:
				break;
		}
	// console.log(this.currentState);
	}

	buildHighScore() {
		const { highscore } = this;
		// GET list of map size of records
		this.resultListCategories = [];

		while (this.sizePickerDiv.firstChild) {
			this.sizePickerDiv.removeChild(this.sizePickerDiv.firstChild);
		}

		for (let i = 0; i < highscore.length; i++) {
			const recordHighscore = highscore[i].mapSize;

			// console.log("highscore[i].mapSize", highscore[i].mapSize);
			if (!this.resultListCategories.includes(recordHighscore)) {
				this.resultListCategories.push(recordHighscore);
				const opt = document.createElement('option');
				opt.value = recordHighscore;
				opt.innerText = recordHighscore;
				this.sizePickerDiv.appendChild(opt);
				// console.log("sizePickerDiv", opt.value);
			}
		}
	}

	updateTable() {
		const { highscore } = this;
		const currentMapSize = this.sizePickerDiv.value;
		// Filter result table with the selected mapsize
		const filtered = highscore.filter((result) => {
			return result.mapSize === currentMapSize;
		});

		// build table with filtered records
		const myTable = this.highscoreTable;
		const myTableBody = myTable.tBodies[0];
		const newTableBody = document.createElement('tbody');
		const highscoreProperyNames = Object.getOwnPropertyNames(filtered[0]);
		// console.log(highscoreProperyNames);
		for (let i = 0; i < filtered.length; i++) {
			const row = newTableBody.insertRow([i]);
			const cell = row.insertCell(0);
			cell.innerHTML = [i + 1];
			for (let j = 0; j < highscoreProperyNames.length; j++) {
				const cell = row.insertCell(j + 1);
				cell.innerHTML = filtered[i][highscoreProperyNames[j]];
			}
		}
		myTable.replaceChild(newTableBody, myTableBody);
	}

	newGameInit() {
		const newGameInputs = document.getElementsByTagName('input');
		console.log('newGameInputs', newGameInputs);
		for (let i = 0; i < newGameInputs.length; i++) {
			this[newGameInputs[i].id] = newGameInputs[i];
		}

		// IF the new game start datas are valid a new game obj will be created
		if (this.validateInputs(newGameInputs)) {
			this.saveGameData();
			this.gameOver = false;
			// START GAME
			this.game = new Game({
				gameStartData: this.gameStartData,
				canvas: this.canvas,
				snakeLength: 2,
				controlKeys: [87, 65, 83, 68], // WASD
				debugWindow: this.debugWindow,
				onGameEndAction: this.saveGameResults.bind(this),
			});
			// console.log("this.game",this.game);
			this.showWindow('showBoard');
		}
	}

	saveGameResults(result) {
		this.lastGameResult = result;
		// let { highscore } = this;
		const highscore = this.getFromLocalStorage('highscoreTable') || [];
		console.log('beforepush', highscore);
		highscore.push(result);
		highscore.sort(compareBy('score'));
		console.log('highscore', highscore);
		localStorage.setItem('highscoreTable', JSON.stringify(highscore));
		this.showWindow('gameOver');
	}

	getFromLocalStorage(item) {
		let loadedData = {};
		loadedData = localStorage.getItem(item);
		loadedData = JSON.parse(loadedData);

		// eslint-disable-next-line
		if (localStorage.hasOwnProperty(item)) {
			//  console.log("typeof(loadedData)", typeof(loadedData));
			return loadedData;
		}
		return [];
	}

	saveGameData() {
		this.gameStartData = {
			name: this.inputPlayersName.value,
			mapWidth: parseInt(this.inputWidth.value),
			mapHeight: parseInt(this.inputHeight.value),
			mapUnit: parseInt(this.inputPixelSize.value),
			autoPixelSize: this.inputAutoPixelSize.checked,
			difficulty: parseInt(this.inputDifficulty.value),
		};
		localStorage.setItem('gameStartData', JSON.stringify(this.gameStartData));
		//  console.log("GameSetupSavedToTheLocalStorage", this.gameStartData);
	}

	loadGameData() {
		const gameStartOptions = localStorage.getItem('gameStartData');
		console.log('gameStartOptions', gameStartOptions);

		if (gameStartOptions) {
			//    console.log("localStorage.getItem('gameStartData')", localStorage.getItem('gameStartData'));
			this.gameStartData = JSON.parse(gameStartOptions);
			//
			this.outputH.innerHTML = this.inputWidth.value; // Display the default slider value
			this.outputW.innerHTML = this.inputHeight.value; // Display the default slider value
			this.outputD.innerHTML = this.inputDifficulty.value; // Display the default slider value
			this.outputP.innerHTML = this.inputPixelSize.value; // Display the default slider value

			this.inputPlayersName.value = this.gameStartData.name;
			this.inputWidth.value = this.gameStartData.mapWidth;
			this.inputHeight.value = this.gameStartData.mapHeight;
			this.inputPixelSize.value = this.gameStartData.mapUnit;
			this.inputAutoPixelSize.checked = this.gameStartData.autoPixelSize;
			this.inputDifficulty.value = this.gameStartData.difficulty;
		}
	}

	interfaceKeyDown(event) {
		switch (event.keyCode) {
			case 32: // pause on space
				switch (this.currentState) {
					case 'mainMenuScreen':
						if (typeof this.game !== 'undefined' && !this.gameOver) {
							this.showWindow('showBoard');
						}
						break;
					case 'showBoard':
						if (typeof this.game !== 'undefined') {
							this.showWindow('mainMenuScreen');
						}
						break;
					default:
						break;
				}
				break;
			default:
				break;
		}
	}
}

const gameUI = new GameUI();
console.log('gameUI', gameUI);
