/**
 * sender.js — Google Cast Sender (Phone Controller)
 * Sends D-pad input to the Cast receiver and displays game state
 */

const CAST_NAMESPACE = 'urn:x-cast:snake3d';

// ============================================
// Replace this with your actual Cast Application ID
// from the Google Cast Developer Console
// ============================================
const CAST_APP_ID = 'YOUR_APP_ID';  // TODO: Replace after registering on Cast Console

class SenderApp {
    constructor() {
        this.session = null;
        this.isConnected = false;

        // UI Elements
        this.statusEl = document.getElementById('cast-status');
        this.statusText = document.getElementById('status-text');
        this.scoreEl = document.getElementById('sender-score');
        this.levelEl = document.getElementById('sender-level');
        this.highEl = document.getElementById('sender-high');
        this.stateBanner = document.getElementById('game-state-banner');
        this.stateText = document.getElementById('game-state-text');

        this._setupCast();
        this._setupDPad();
        this._setupActionButtons();
    }

    // ========================================
    // Cast SDK Setup
    // ========================================
    _setupCast() {
        // Wait for Cast SDK to be available
        window['__onGCastApiAvailable'] = (isAvailable) => {
            if (isAvailable) {
                this._initCast();
            } else {
                console.warn('Cast API not available');
                this.statusText.textContent = 'Cast unavailable';
            }
        };
    }

    _initCast() {
        const context = cast.framework.CastContext.getInstance();

        context.setOptions({
            receiverApplicationId: CAST_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        // Listen for session state changes
        context.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            (event) => this._onSessionStateChanged(event)
        );

        console.log('📱 Cast Sender initialized');
    }

    _onSessionStateChanged(event) {
        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_STARTED:
            case cast.framework.SessionState.SESSION_RESUMED:
                this.session = cast.framework.CastContext.getInstance().getCurrentSession();
                this.isConnected = true;
                this._onConnected();
                break;
            case cast.framework.SessionState.SESSION_ENDED:
                this.session = null;
                this.isConnected = false;
                this._onDisconnected();
                break;
        }
    }

    _onConnected() {
        console.log('📺 Connected to Cast device!');
        this.statusEl.classList.add('connected');
        this.statusEl.classList.remove('disconnected');
        this.statusText.textContent = 'Connected';

        // Listen for messages from receiver
        this.session.addMessageListener(CAST_NAMESPACE, (namespace, message) => {
            this._handleReceiverMessage(JSON.parse(message));
        });

        // Request current state
        this._sendMessage({ type: 'GET_STATE' });
    }

    _onDisconnected() {
        console.log('📺 Disconnected from Cast device');
        this.statusEl.classList.remove('connected');
        this.statusEl.classList.add('disconnected');
        this.statusText.textContent = 'Not Connected';
    }

    // ========================================
    // Messaging
    // ========================================
    _sendMessage(data) {
        if (!this.session || !this.isConnected) {
            console.warn('Not connected to Cast device');
            return;
        }

        try {
            this.session.sendMessage(CAST_NAMESPACE, data);
        } catch (e) {
            console.warn('Failed to send message:', e);
        }
    }

    _handleReceiverMessage(data) {
        console.log('📺 Message from receiver:', data);

        if (data.type === 'STATE_UPDATE') {
            this._updateGameState(data);
        }
    }

    _updateGameState(state) {
        // Update score, level, high score
        if (state.score !== undefined) {
            this.scoreEl.textContent = state.score;
        }
        if (state.level !== undefined) {
            this.levelEl.textContent = state.level;
        }
        if (state.highScore !== undefined) {
            this.highEl.textContent = state.highScore;
        }

        // Update game state banner
        if (state.state) {
            this.stateBanner.classList.remove('hidden');
            const stateLabels = {
                'MENU': '🏠 MENU',
                'PLAYING': '🎮 PLAYING',
                'PAUSED': '⏸ PAUSED',
                'GAME_OVER': '💀 GAME OVER',
            };
            this.stateText.textContent = stateLabels[state.state] || state.state;
        }
    }

    // ========================================
    // D-Pad Controls
    // ========================================
    _setupDPad() {
        const dpadBtns = document.querySelectorAll('.dpad-btn');

        dpadBtns.forEach(btn => {
            const direction = btn.dataset.direction;

            // Use touch events for responsiveness
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this._onDirectionInput(direction);
                this._vibrate();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
            });

            btn.addEventListener('touchcancel', () => {
                btn.classList.remove('pressed');
            });

            // Fallback for mouse (desktop testing)
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this._onDirectionInput(direction);
            });

            btn.addEventListener('mouseup', () => {
                btn.classList.remove('pressed');
            });

            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('pressed');
            });
        });
    }

    _onDirectionInput(direction) {
        console.log('⬆️ Direction:', direction);
        this._sendMessage({
            type: 'DIRECTION',
            value: direction,
        });
    }

    // ========================================
    // Action Buttons
    // ========================================
    _setupActionButtons() {
        const startBtn = document.getElementById('btn-start');
        const pauseBtn = document.getElementById('btn-pause');

        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._sendMessage({ type: 'ACTION', value: 'START' });
            this._vibrate();
        }, { passive: false });

        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this._sendMessage({ type: 'ACTION', value: 'START' });
        });

        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._sendMessage({ type: 'ACTION', value: 'PAUSE' });
            this._vibrate();
        }, { passive: false });

        pauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this._sendMessage({ type: 'ACTION', value: 'PAUSE' });
        });
    }

    // ========================================
    // Haptic Feedback
    // ========================================
    _vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    }
}

// ============================================
// Start the sender app
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    new SenderApp();
});
