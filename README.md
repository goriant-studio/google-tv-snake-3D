# 🐍 Snake 3D — Neon Edition

A 3D Snake game with neon cyberpunk aesthetics, built for **Google TV** and **Chromecast** using Three.js and the Google Cast Web Receiver SDK.

![Snake 3D](https://img.shields.io/badge/Platform-Google%20TV%20%7C%20Chromecast-00f0ff?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-0.170-00ff88?style=for-the-badge)
![Cast SDK](https://img.shields.io/badge/Cast%20SDK-v3-ff00aa?style=for-the-badge)

## 🎮 Features

- **3D Snake** — Head/body/tail with smooth lerp animation
- **Neon Arena** — Grid floor, glowing walls, bloom post-processing
- **Glowing Food** — Icosahedron with orbiting particles
- **Multiple Controls** — TV Remote D-pad, Keyboard, Bluetooth Gamepad, Phone Controller
- **Cast Integration** — Phone becomes a virtual D-pad controller
- **Score System** — Level progression, speed increase, localStorage high score
- **Synthesized Audio** — Web Audio API (no external files)

## 🚀 Quick Start

### Play in Browser
```bash
npx serve .
# Open http://localhost:3000
```

### Controls
| Input | Action |
|---|---|
| Arrow Keys / WASD | Move snake |
| Space / Escape | Pause |
| Enter | Start / Restart |
| Gamepad D-pad | Move snake |
| Gamepad A button | Start / Restart |

## 📺 Chromecast Setup

### 1. Deploy to GitHub Pages
```bash
git push origin main
# Enable Pages in repo Settings → Pages → Deploy from main
```

### 2. Register on Cast Developer Console
1. Go to [cast.google.com/publish](https://cast.google.com/publish)
2. Register for a developer account ($5 one-time fee)
3. Click **"Add New Application"** → **Custom Receiver**
4. Enter name: `Snake 3D`
5. Enter Receiver URL: `https://goriant-studio.github.io/google-tv-snake-3D/`
6. Save → copy your **Application ID**

### 3. Update Application ID
Edit `js/sender.js` and replace `YOUR_APP_ID`:
```javascript
const CAST_APP_ID = 'YOUR_APP_ID'; // Replace with your ID
```

### 4. Test
1. Register your Chromecast device serial number in the Console
2. Reboot your Chromecast
3. Open `sender.html` on your phone
4. Tap the Cast button → select your device
5. Use the D-pad to play!

### 5. Publish
Click **"Publish"** in the Cast Developer Console to make it available to all Cast devices.

## 🏗️ Architecture

```
Google TV / Chromecast
┌─────────────────────────────┐
│  Cast Receiver (index.html) │
│  ├── Three.js 3D Scene      │
│  ├── Game Logic              │
│  └── cast-receiver.js       │
└──────────┬──────────────────┘
           │ Custom Messages
           │ urn:x-cast:snake3d
┌──────────┴──────────────────┐
│  Sender App (sender.html)   │
│  ├── Virtual D-pad          │
│  ├── Score Display           │
│  └── sender.js              │
└─────────────────────────────┘
       📱 Phone
```

## 📁 File Structure

```
├── index.html          # Cast Receiver (game)
├── sender.html         # Cast Sender (phone controller)
├── css/
│   ├── style.css       # Game styles
│   └── sender.css      # Controller styles
├── js/
│   ├── main.js         # Game loop & state machine
│   ├── snake.js        # Snake logic & rendering
│   ├── grid.js         # 3D arena
│   ├── food.js         # Food spawning & effects
│   ├── controls.js     # Keyboard/Gamepad/D-pad input
│   ├── effects.js      # Bloom & particle effects
│   ├── ui.js           # HUD & screen management
│   ├── audio.js        # Synthesized sound effects
│   ├── cast-receiver.js # Cast SDK receiver
│   └── sender.js       # Cast SDK sender
└── README.md
```

## 📄 License

MIT
