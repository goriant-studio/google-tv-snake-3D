/**
 * ui.js — UI Management
 * Controls screen transitions, score displays, and HUD
 */

export class UI {
    constructor() {
        // Screen elements
        this.startScreen = document.getElementById('start-screen');
        this.hud = document.getElementById('hud');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');

        // Score elements
        this.scoreValue = document.getElementById('score-value');
        this.highScoreValue = document.getElementById('high-score-value');
        this.levelDisplay = document.getElementById('level-display');
        this.finalScore = document.getElementById('final-score');
        this.finalHighScore = document.getElementById('final-high-score');

        // Load high score from localStorage
        this.highScore = parseInt(localStorage.getItem('snake3d-highscore') || '0', 10);
        this.highScoreValue.textContent = this.highScore;

        this._allScreens = [this.startScreen, this.hud, this.pauseScreen, this.gameoverScreen];
    }

    /** Show only the specified screen(s) */
    _showScreens(...screens) {
        this._allScreens.forEach(s => s.classList.remove('active'));
        screens.forEach(s => s.classList.add('active'));
    }

    showStart() {
        this._showScreens(this.startScreen);
    }

    showPlaying() {
        this._showScreens(this.hud);
    }

    showPause() {
        this._showScreens(this.hud, this.pauseScreen);
    }

    showGameOver(score) {
        // Update high score
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('snake3d-highscore', this.highScore.toString());
        }

        this.finalScore.textContent = score;
        this.finalHighScore.textContent = this.highScore;
        this._showScreens(this.gameoverScreen);
    }

    /** Update current score with bump animation */
    updateScore(score) {
        this.scoreValue.textContent = score;
        this.highScoreValue.textContent = Math.max(score, this.highScore);

        // Bump animation
        this.scoreValue.classList.add('bump');
        setTimeout(() => this.scoreValue.classList.remove('bump'), 200);
    }

    /** Update level display */
    updateLevel(level) {
        this.levelDisplay.textContent = `LEVEL ${level}`;
    }
}
