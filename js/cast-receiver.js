/**
 * cast-receiver.js — Google Cast Web Receiver Integration
 * Handles Cast SDK initialization, sender connections, and custom messaging
 */
import { DIRECTION } from './snake.js';

const CAST_NAMESPACE = 'urn:x-cast:snake3d';

export class CastReceiver {
    constructor(controls) {
        this.controls = controls;
        this.context = null;
        this.isAvailable = false;
        this.senderCount = 0;
        this.onStateChange = null; // callback to get game state for senders

        this._init();
    }

    _init() {
        // Check if Cast SDK is available
        if (typeof cast === 'undefined' || !cast.framework) {
            console.log('📺 Cast SDK not available — running in standalone mode');
            return;
        }

        try {
            this.context = cast.framework.CastReceiverContext.getInstance();

            // Set up custom message listener
            this.context.addCustomMessageListener(CAST_NAMESPACE, (event) => {
                this._handleMessage(event);
            });

            // Set up sender connection events
            this.context.addEventListener(
                cast.framework.system.EventType.SENDER_CONNECTED,
                (event) => this._onSenderConnected(event)
            );

            this.context.addEventListener(
                cast.framework.system.EventType.SENDER_DISCONNECTED,
                (event) => this._onSenderDisconnected(event)
            );

            // Configure receiver options
            const options = new cast.framework.CastReceiverOptions();
            options.disableIdleTimeout = true; // Keep receiver alive (it's a game!)
            options.maxInactivity = 3600;      // 1 hour max inactivity

            // Start the receiver
            this.context.start(options);
            this.isAvailable = true;
            console.log('📺 Cast Receiver started successfully');
        } catch (e) {
            console.warn('📺 Cast Receiver init failed:', e);
            this.isAvailable = false;
        }
    }

    /** Handle incoming messages from sender */
    _handleMessage(event) {
        const data = event.data;
        const senderId = event.senderId;

        console.log('📱 Message from sender:', data);

        switch (data.type) {
            case 'DIRECTION':
                this._handleDirection(data.value);
                break;
            case 'ACTION':
                this._handleAction(data.value);
                break;
            case 'GET_STATE':
                this._sendStateToSender(senderId);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    _handleDirection(value) {
        const dirMap = {
            'UP': DIRECTION.UP,
            'DOWN': DIRECTION.DOWN,
            'LEFT': DIRECTION.LEFT,
            'RIGHT': DIRECTION.RIGHT,
        };

        const dir = dirMap[value];
        if (dir) {
            this.controls.injectDirection(dir);
        }
    }

    _handleAction(value) {
        switch (value) {
            case 'START':
            case 'RESTART':
                this.controls.injectAction('confirm');
                break;
            case 'PAUSE':
                this.controls.injectAction('pause');
                break;
        }
    }

    /** Send game state to a specific sender */
    _sendStateToSender(senderId) {
        if (!this.onStateChange) return;

        const state = this.onStateChange();
        this._sendMessage(senderId, {
            type: 'STATE_UPDATE',
            ...state,
        });
    }

    _onSenderConnected(event) {
        this.senderCount++;
        console.log(`📱 Sender connected (${this.senderCount} total)`);

        // Send current state to new sender
        this._sendStateToSender(event.senderId);
    }

    _onSenderDisconnected(event) {
        this.senderCount = Math.max(0, this.senderCount - 1);
        console.log(`📱 Sender disconnected (${this.senderCount} remaining)`);
    }

    /** Send a message to a specific sender */
    _sendMessage(senderId, data) {
        if (!this.context || !this.isAvailable) return;

        try {
            this.context.sendCustomMessage(CAST_NAMESPACE, senderId, data);
        } catch (e) {
            console.warn('Failed to send message to sender:', e);
        }
    }

    /** Broadcast a message to ALL connected senders */
    broadcast(data) {
        if (!this.context || !this.isAvailable || this.senderCount === 0) return;

        try {
            const senders = this.context.getSenders();
            senders.forEach(sender => {
                this.context.sendCustomMessage(CAST_NAMESPACE, sender.id, data);
            });
        } catch (e) {
            console.warn('Failed to broadcast message:', e);
        }
    }

    /** Broadcast game state update */
    broadcastState(gameState) {
        this.broadcast({
            type: 'STATE_UPDATE',
            ...gameState,
        });
    }

    /** Check if running as Cast receiver */
    get isCastMode() {
        return this.isAvailable;
    }

    /** Get number of connected senders */
    get connectedSenders() {
        return this.senderCount;
    }
}
