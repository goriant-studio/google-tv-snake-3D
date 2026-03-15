/**
 * main.js — Game Initialization & Main Loop
 * Orchestrates all game systems for Snake 3D
 */
import * as THREE from 'three';
import { Grid } from './grid.js';
import { Snake } from './snake.js';
import { Food } from './food.js';
import { Controls } from './controls.js';
import { Effects } from './effects.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { CastReceiver } from './cast-receiver.js';

// ============================================
// Game States
// ============================================
const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
};

// ============================================
// Game Configuration
// ============================================
const CONFIG = {
    GRID_SIZE: 20,
    BASE_MOVE_INTERVAL: 0.18,   // seconds between moves
    MIN_MOVE_INTERVAL: 0.06,    // fastest speed
    SPEED_INCREASE: 0.005,      // speed up per food eaten
    LEVEL_UP_SCORE: 5,          // score per level
    CAMERA_HEIGHT: 18,
    CAMERA_ANGLE: 55,           // degrees from vertical
};

// ============================================
// Game Class
// ============================================
class Game {
    constructor() {
        this.state = STATE.MENU;
        this.score = 0;
        this.level = 1;
        this.moveTimer = 0;
        this.moveInterval = CONFIG.BASE_MOVE_INTERVAL;

        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Game systems
        this.grid = null;
        this.snake = null;
        this.food = null;
        this.controls = null;
        this.effects = null;
        this.ui = null;
        this.audio = null;
        this.castReceiver = null;

        this._init();
    }

    _init() {
        this._setupThreeJS();
        this._setupLighting();
        this._setupSystems();
        this._setupResize();
        this._startLoop();
    }

    _setupThreeJS() {
        const container = document.getElementById('game-container');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

        // Camera — isometric-like perspective
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this._positionCamera();

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);
    }

    _positionCamera() {
        const gridHalf = CONFIG.GRID_SIZE / 2;
        const angleRad = THREE.MathUtils.degToRad(CONFIG.CAMERA_ANGLE);
        const dist = CONFIG.CAMERA_HEIGHT;

        this.camera.position.set(
            0,
            dist * Math.cos(angleRad),
            dist * Math.sin(angleRad)
        );
        this.camera.lookAt(0, 0, 0);
    }

    _setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x1a1a3a, 0.8);
        this.scene.add(ambient);

        // Main directional light
        const dirLight = new THREE.DirectionalLight(0x6666ff, 0.6);
        dirLight.position.set(5, 15, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -15;
        dirLight.shadow.camera.right = 15;
        dirLight.shadow.camera.top = 15;
        dirLight.shadow.camera.bottom = -15;
        this.scene.add(dirLight);

        // Fill light from opposite side
        const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.3);
        fillLight.position.set(-10, 8, -5);
        this.scene.add(fillLight);

        // Bottom fill — subtle
        const bottomLight = new THREE.HemisphereLight(0x0a0a2a, 0x00f0ff, 0.3);
        this.scene.add(bottomLight);
    }

    _setupSystems() {
        this.grid = new Grid(this.scene, CONFIG.GRID_SIZE);
        this.snake = new Snake(this.scene, this.grid);
        this.food = new Food(this.scene, this.grid);
        this.controls = new Controls();
        this.effects = new Effects(this.scene, this.camera, this.renderer);
        this.ui = new UI();
        this.audio = new Audio();

        // Cast Receiver — graceful fallback if not in Cast context
        this.castReceiver = new CastReceiver(this.controls);
        this.castReceiver.onStateChange = () => this._getGameState();

        // Show start screen
        this.ui.showStart();
    }

    _setupResize() {
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            this.effects.resize(w, h);
        });
    }

    // ========================================
    // Game Loop
    // ========================================
    _startLoop() {
        const loop = () => {
            requestAnimationFrame(loop);
            const dt = this.clock.getDelta();

            // Poll gamepad each frame
            this.controls.pollGamepad();

            switch (this.state) {
                case STATE.MENU:
                    this._updateMenu(dt);
                    break;
                case STATE.PLAYING:
                    this._updatePlaying(dt);
                    break;
                case STATE.PAUSED:
                    this._updatePaused(dt);
                    break;
                case STATE.GAME_OVER:
                    this._updateGameOver(dt);
                    break;
            }

            // Always update visual effects
            this.food.update(dt);
            this.effects.update(dt);
            this.effects.render();
        };

        loop();
    }

    // ========================================
    // State Updates
    // ========================================
    _updateMenu(dt) {
        // Wait for any input to start
        if (this.controls.hasAnyInput()) {
            this.controls.clearAll();
            this._startGame();
        }
    }

    _updatePlaying(dt) {
        // Check for pause
        const action = this.controls.getNextAction();
        if (action === 'pause') {
            this.state = STATE.PAUSED;
            this.ui.showPause();
            this._broadcastState();
            return;
        }

        // Process direction input
        const newDir = this.controls.getNextDirection();
        if (newDir) {
            this.snake.setDirection(newDir);
        }

        // Move timer
        this.moveTimer += dt;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer -= this.moveInterval;
            this._moveSnake();
        }

        // Smooth animation
        this.snake.updateAnimation(dt, this.moveInterval);
    }

    _updatePaused(dt) {
        const action = this.controls.getNextAction();
        if (action === 'pause' || action === 'confirm') {
            this.state = STATE.PLAYING;
            this.ui.showPlaying();
            this.controls.clearAll();
            this._broadcastState();
        }
    }

    _updateGameOver(dt) {
        const action = this.controls.getNextAction();
        if (action === 'confirm') {
            this.controls.clearAll();
            this._startGame();
        }
    }

    // ========================================
    // Game Actions
    // ========================================
    _startGame() {
        this.audio.init();
        this.audio.playStart();

        this.score = 0;
        this.level = 1;
        this.moveTimer = 0;
        this.moveInterval = CONFIG.BASE_MOVE_INTERVAL;

        this.snake.reset();
        this.food.spawn(this.snake.getOccupiedPositions());

        this.ui.updateScore(0);
        this.ui.updateLevel(1);
        this.ui.showPlaying();

        this.state = STATE.PLAYING;
        this.controls.clearAll();

        // Broadcast state to Cast senders
        this._broadcastState();
    }

    _moveSnake() {
        const result = this.snake.move();

        if (result.collision) {
            this._gameOver();
            return;
        }

        // Check food pickup
        if (this.food.checkPickup(result.headX, result.headZ)) {
            this._eatFood();
        }
    }

    _eatFood() {
        this.snake.grow();
        this.score++;

        // Particle burst at food position
        const foodPos = this.grid.gridToWorld(this.food.gridX, this.food.gridZ);
        this.effects.createBurst(foodPos, 0xff00aa, 25);

        // Audio
        this.audio.playEat();

        // Level up check
        const newLevel = Math.floor(this.score / CONFIG.LEVEL_UP_SCORE) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.ui.updateLevel(this.level);
            this.audio.playLevelUp();
        }

        // Speed up
        this.moveInterval = Math.max(
            CONFIG.MIN_MOVE_INTERVAL,
            CONFIG.BASE_MOVE_INTERVAL - this.score * CONFIG.SPEED_INCREASE
        );

        // Update UI
        this.ui.updateScore(this.score);

        // Broadcast state to Cast senders
        this._broadcastState();

        // Spawn new food
        this.food.spawn(this.snake.getOccupiedPositions());
    }

    _gameOver() {
        this.state = STATE.GAME_OVER;
        this.audio.playDeath();

        // Death particles at head position
        const head = this.snake.getHeadPosition();
        const headPos = this.grid.gridToWorld(head.gridX, head.gridZ);
        this.effects.createBurst(headPos, 0xff3333, 40);

        this.ui.showGameOver(this.score);

        // Broadcast state to Cast senders
        this._broadcastState();
    }

    // ========================================
    // Cast Integration
    // ========================================
    _getGameState() {
        return {
            state: this.state,
            score: this.score,
            level: this.level,
            highScore: this.ui.highScore,
        };
    }

    _broadcastState() {
        if (this.castReceiver) {
            this.castReceiver.broadcastState(this._getGameState());
        }
    }
}

// ============================================
// Start the game!
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
