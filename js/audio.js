/**
 * audio.js — Sound Effects using Web Audio API
 * Generates synthesized sounds (no external files needed)
 */

export class Audio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterGain = null;
    }

    /** Initialize AudioContext on first user interaction */
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio not available:', e);
            this.enabled = false;
        }
    }

    _playTone(frequency, duration, type = 'sine', volumeMultiplier = 1) {
        if (!this.ctx || !this.enabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2 * volumeMultiplier, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    /** Play eat sound — ascending chirp */
    playEat() {
        if (!this.ctx || !this.enabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.2);

        // Second harmonic
        setTimeout(() => this._playTone(1200, 0.15, 'sine', 0.5), 50);
    }

    /** Play turn sound — subtle click */
    playTurn() {
        this._playTone(200, 0.05, 'square', 0.3);
    }

    /** Play collision/death sound — descending noise */
    playDeath() {
        if (!this.ctx || !this.enabled) return;

        // Low rumble
        this._playTone(150, 0.5, 'sawtooth', 1.5);

        // Descending tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.6);
    }

    /** Play start/confirm sound */
    playStart() {
        this._playTone(523, 0.1, 'sine', 0.8);
        setTimeout(() => this._playTone(659, 0.1, 'sine', 0.8), 100);
        setTimeout(() => this._playTone(784, 0.15, 'sine', 0.8), 200);
    }

    /** Play level up sound */
    playLevelUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.15, 'sine', 0.6), i * 80);
        });
    }
}
