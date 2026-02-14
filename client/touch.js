/* eslint-env browser */

// eslint-disable-next-line
class TouchController {
	constructor({ onDirectionChange, canvas }) {
		this.onDirectionChange = onDirectionChange;
		this.canvas = canvas;
		this.currentDirection = null;
		this.swipeThreshold = 20;

		this.initSwipe();
		this.initDpad();
	}

	initSwipe() {
		let startX = 0;
		let startY = 0;

		const onTouchStart = (e) => {
			// Only handle swipes on the canvas area
			if (e.target === this.canvas) {
				e.preventDefault();
				const touch = e.touches[0];
				startX = touch.clientX;
				startY = touch.clientY;
			}
		};

		const onTouchMove = (e) => {
			if (e.target === this.canvas) {
				e.preventDefault();
			}
		};

		const onTouchEnd = (e) => {
			if (e.target !== this.canvas) return;
			e.preventDefault();

			const touch = e.changedTouches[0];
			const dx = touch.clientX - startX;
			const dy = touch.clientY - startY;
			const absDx = Math.abs(dx);
			const absDy = Math.abs(dy);

			if (Math.max(absDx, absDy) < this.swipeThreshold) return;

			if (absDx > absDy) {
				this.sendDirection(dx > 0 ? 'RIGHT' : 'LEFT');
			} else {
				this.sendDirection(dy > 0 ? 'DOWN' : 'UP');
			}
		};

		document.addEventListener('touchstart', onTouchStart, { passive: false });
		document.addEventListener('touchmove', onTouchMove, { passive: false });
		document.addEventListener('touchend', onTouchEnd, { passive: false });
	}

	initDpad() {
		const buttons = document.querySelectorAll('.dpad-btn');
		buttons.forEach((btn) => {
			const dir = btn.dataset.dir;

			btn.addEventListener('touchstart', (e) => {
				e.preventDefault();
				btn.classList.add('active');
				this.sendDirection(dir);
			}, { passive: false });

			btn.addEventListener('touchend', (e) => {
				e.preventDefault();
				btn.classList.remove('active');
			}, { passive: false });

			// Also handle mouse for testing on desktop
			btn.addEventListener('mousedown', (e) => {
				e.preventDefault();
				btn.classList.add('active');
				this.sendDirection(dir);
			});

			btn.addEventListener('mouseup', (e) => {
				e.preventDefault();
				btn.classList.remove('active');
			});
		});
	}

	sendDirection(dir) {
		this.currentDirection = dir;
		this.onDirectionChange([dir]);
	}

	destroy() {
		// Cleanup if needed
	}
}
