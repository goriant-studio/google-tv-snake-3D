/**
 * controls.js — Input Handling
 * Supports Keyboard, TV Remote D-pad, and Gamepad API
 */
import { DIRECTION } from './snake.js';

export class Controls {
    constructor() {
        this.directionQueue = [];
        this.actionQueue = [];   // 'pause', 'confirm'
        this.gamepadIndex = null;
        this.prevGamepadButtons = {};

        this._setupKeyboard();
        this._setupGamepad();
    }

    _setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            // Prevent browser defaults for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }

            switch (e.code) {
                // Arrow keys (keyboard + TV remote D-pad)
                case 'ArrowUp':
                case 'KeyW':
                    this.directionQueue.push(DIRECTION.UP);
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.directionQueue.push(DIRECTION.DOWN);
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.directionQueue.push(DIRECTION.LEFT);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.directionQueue.push(DIRECTION.RIGHT);
                    break;

                // Actions
                case 'Space':
                    this.actionQueue.push('pause');
                    break;
                case 'Enter':
                    this.actionQueue.push('confirm');
                    break;
                case 'Escape':
                    this.actionQueue.push('pause');
                    break;
            }

            // Keep queues short
            if (this.directionQueue.length > 3) this.directionQueue.shift();
            if (this.actionQueue.length > 3) this.actionQueue.shift();
        });
    }

    _setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener('gamepaddisconnected', () => {
            console.log('🎮 Gamepad disconnected');
            this.gamepadIndex = null;
        });
    }

    /** Poll gamepad state — call each frame */
    pollGamepad() {
        if (this.gamepadIndex === null) return;

        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepadIndex];
        if (!gp) return;

        // D-pad buttons (standard mapping)
        const buttons = {
            up: gp.buttons[12]?.pressed,
            down: gp.buttons[13]?.pressed,
            left: gp.buttons[14]?.pressed,
            right: gp.buttons[15]?.pressed,
            a: gp.buttons[0]?.pressed,      // A / Cross
            start: gp.buttons[9]?.pressed,   // Start
        };

        // Axes (for analog sticks acting as D-pad)
        const axisThreshold = 0.5;
        if (gp.axes[1] < -axisThreshold) buttons.up = true;
        if (gp.axes[1] > axisThreshold) buttons.down = true;
        if (gp.axes[0] < -axisThreshold) buttons.left = true;
        if (gp.axes[0] > axisThreshold) buttons.right = true;

        // Edge detection — only trigger on press, not hold
        const prev = this.prevGamepadButtons;

        if (buttons.up && !prev.up) this.directionQueue.push(DIRECTION.UP);
        if (buttons.down && !prev.down) this.directionQueue.push(DIRECTION.DOWN);
        if (buttons.left && !prev.left) this.directionQueue.push(DIRECTION.LEFT);
        if (buttons.right && !prev.right) this.directionQueue.push(DIRECTION.RIGHT);
        if (buttons.a && !prev.a) this.actionQueue.push('confirm');
        if (buttons.start && !prev.start) this.actionQueue.push('pause');

        this.prevGamepadButtons = { ...buttons };
    }

    /** Get next direction from queue */
    getNextDirection() {
        return this.directionQueue.shift() || null;
    }

    /** Get next action from queue */
    getNextAction() {
        return this.actionQueue.shift() || null;
    }

    /** Check if any input is pending (for "press any key") */
    hasAnyInput() {
        return this.directionQueue.length > 0 || this.actionQueue.length > 0;
    }

    /** Clear all queues */
    clearAll() {
        this.directionQueue = [];
        this.actionQueue = [];
    }

    // ========================================
    // Cast Receiver Integration
    // ========================================

    /** Inject a direction from Cast sender message */
    injectDirection(dir) {
        this.directionQueue.push(dir);
        if (this.directionQueue.length > 3) this.directionQueue.shift();
    }

    /** Inject an action from Cast sender message */
    injectAction(action) {
        this.actionQueue.push(action);
        if (this.actionQueue.length > 3) this.actionQueue.shift();
    }
}
