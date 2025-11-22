# AstroLab 🔭

**AstroLab** is an AI-powered astrophotography post-processing tool that emulates professional workflows using **Google's Gemini 3 Pro Image** (Nano Banana Pro). It allows users to upload raw stacked images from smart telescopes (like Seestar, Dwarf, or Vaonis) and apply scientifically grounded enhancements.

## ✨ Features

- **Context-Aware Processing**: Uses Google Search grounding to identify the celestial object (e.g., "M42", "NGC 281") and understand its physical properties (colors, structure) to prevent hallucinations.
- **Smart Presets**: Optimized defaults for different object types:
  - 🌌 **Nebula**: Balanced stretch and saturation for Ha/OIII regions.
  - 🌀 **Galaxy**: Preserves dust lanes and core detail.
  - ✨ **Cluster**: Focuses on star color separation and background cleanliness.
  - 🌠 **Wide-field**: Maintains natural sky glow and rich star fields.
  - 🪐 **Planetary**: Enhances belts, rings, and surface details.
  - 🌕 **Lunar**: Sharpens crater rims and terminators with a pitch-black sky.
  - ☀️ **Solar**: Emphasizes granulation and sunspots.
- **Granular Control**:
  - **Star Correction**: Modes ranging from "None" to "Starless Emphasis" (emulating StarNet++).
  - **Sky Darkness**: Control the black point without clipping faint data.
  - **Stretch & Noise**: Fine-tune the histogram stretch and noise reduction.
  - **Scientific Mode**: Enforces physically plausible colors and avoids artifacts.
- **Auto Aspect Ratio**: Automatically matches the output dimensions to your uploaded image.
- **High-Res Output**: Supports processing at **1K**, **2K**, and **4K** resolutions.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **AI Model**: Google Gemini 2.5 Flash / Gemini 3 Pro Image (via `@google/genai`)
- **Styling**: Vanilla CSS (Neo-brutalist astro aesthetic)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud Project with the **Gemini API** enabled.
- An API Key for Gemini.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/siddhantparadox/astrolab.git
   cd astro-lab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🎛️ Usage Guide

1. **Upload**: Drag and drop your stacked PNG/JPEG image (e.g., from Seestar S50).
2. **Identify**: Enter the object name (e.g., "Rosette Nebula"). This fetches real astrophysical data to guide the AI.
3. **Select Preset**: Choose the type of object (Nebula, Galaxy, Moon, etc.) to load "sane defaults".
4. **Tune**:
   - Use **Sky Darkness** to control background black levels (safe for Moon/Sun, careful for Nebulae).
   - Adjust **Star Correction** to shrink or remove stars.
   - Toggle **Scientific Mode** for realistic vs. artistic results.
5. **Process**: Click "Process Image" and wait for the AI to generate the result.
6. **Download**: Save the full-resolution image.

## ⚙️ Configuration

Default slider values for each preset are defined in `src/config/presets.ts`. You can adjust these values to match your personal processing taste.

```typescript
// Example: src/config/presets.ts
export const PRESET_DEFAULTS = {
  nebula: {
    sliders: {
      stretch_strength: 62, // Adjusted for balanced contrast
      star_reduction: 55,   // Moderate star shrinking
      // ...
    },
    // ...
  },
  // ...
};
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
