# Your Name (Kimi no Na wa) - Scroll-Driven Interactive Experience

An immersive, scroll-driven interactive landing page built with HTML5 Canvas, modern Glassmorphism CSS, and the Web Audio API. This project scrubs through 106 high-quality screenshots from Makoto Shinkai's masterpiece "Your Name" using smooth linear interpolation (lerping), synced with typography animations and a real-time reactive audio visualizer.

## 🚀 Live Demo & Hosting
You can publish this static website directly on **GitHub Pages** for free:
1. Create a new repository on your GitHub account.
2. Upload the files in this directory to your repository.
3. Go to **Settings > Pages** in your repository.
4. Under **Build and deployment**, select **Deploy from a branch**, set the source branch to `main` (or `master`) and the folder to `/ (root)`.
5. Save, and GitHub will publish your site in about a minute!

---

## ✨ Features
* **Scroll-Scrubbed Canvas Animation**: 106 sequence frames driven directly by scroll position with linear interpolation (lerp) for inertia momentum.
* **Responsive Object-Fit Scaling**: The canvas resizes dynamically to cover any landscape/portrait aspect ratio without stretching.
* **Glassmorphic UI Elements**: Glass overlay badges, transparent navigation bars, and glowing borders matching modern design systems.
* **Synced Lyrics Player**: A dedicated section displaying your custom lyrics (*"Memory's Shadow"*).
* **Real-time Web Audio Visualizer**: Connects to the lofi track, extracts frequency data, and draws responsive visualizer waves.
* **Pulsing Lyrics Beat**: The text-shadow glow of active stanzas dynamically breathes to the average sound volume.

---

## 🛠️ Local Development
1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the local address in your browser (e.g. `http://localhost:5173/`).
