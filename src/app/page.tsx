"use client";

import React, { useEffect, useState } from "react";

import { SliderField } from "@/components/SliderField";
import { PRESET_DEFAULTS } from "@/config/presets";
import type { AspectRatio, AstroFacts, EditParams, PresetId, StarCorrectionMode } from "@/types/astro";

const DEFAULT_PRESET: PresetId = "nebula";
const defaultConfig = PRESET_DEFAULTS[DEFAULT_PRESET];

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);

  const [objectName, setObjectName] = useState<string>("");
  const [presetId, setPresetId] = useState<PresetId>(DEFAULT_PRESET);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("auto");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("2K");

  const [noiseStrength, setNoiseStrength] = useState<number>(
    defaultConfig.sliders.noise_strength,
  );
  const [stretchStrength, setStretchStrength] = useState<number>(
    defaultConfig.sliders.stretch_strength,
  );
  const [starReduction, setStarReduction] = useState<number>(
    defaultConfig.sliders.star_reduction,
  );
  const [saturation, setSaturation] = useState<number>(
    defaultConfig.sliders.saturation,
  );
  const [backgroundNeutralization, setBackgroundNeutralization] = useState<number>(
    defaultConfig.sliders.background_neutralization,
  );
  const [skyDarkening, setSkyDarkening] = useState<number>(
    defaultConfig.sliders.sky_darkening,
  );
  const [scientificMode, setScientificMode] = useState<boolean>(
    defaultConfig.scientific_mode,
  );
  const [starCorrectionMode, setStarCorrectionMode] =
    useState<StarCorrectionMode>(defaultConfig.star_correction_mode);

  const [astroFacts, setAstroFacts] = useState<AstroFacts | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(selected.type)) {
      setError("Please upload a PNG or JPEG image.");
      return;
    }

    setError(null);
    setEditedUrl(null);
    setAstroFacts(null);

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(selected);
    setOriginalUrl(url);
    setFile(selected);
  };

  const processImage = async () => {
    if (!file) {
      setError("Please upload an astro image first.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setEditedUrl(null);
    setAstroFacts(null);

    const payload: EditParams = {
      object_name: objectName.trim() || null,
      preset_id: presetId,
      aspect_ratio: aspectRatio,
      image_size: imageSize,
      noise_strength: noiseStrength,
      stretch_strength: stretchStrength,
      star_reduction: starReduction,
      saturation,
      background_neutralization: backgroundNeutralization,
      sky_darkening: skyDarkening,
      scientific_mode: scientificMode,
      star_correction_mode: starCorrectionMode,
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("payload", JSON.stringify(payload));

    try {
      const res = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: {
        edited_image_base64?: string;
        astro_facts?: AstroFacts;
        error?: string;
      } = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.edited_image_base64) {
        setEditedUrl(`data:image/png;base64,${data.edited_image_base64}`);
      }
      if (data.astro_facts) {
        setAstroFacts(data.astro_facts);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!editedUrl) return;
    const link = document.createElement("a");
    link.href = editedUrl;
    link.download = `astro-lab-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyPresetDefaults = (id: PresetId) => {
    const cfg = PRESET_DEFAULTS[id];
    setPresetId(id);
    setBackgroundNeutralization(cfg.sliders.background_neutralization);
    setSkyDarkening(cfg.sliders.sky_darkening);
    setStretchStrength(cfg.sliders.stretch_strength);
    setNoiseStrength(cfg.sliders.noise_strength);
    setStarReduction(cfg.sliders.star_reduction);
    setSaturation(cfg.sliders.saturation);
    setScientificMode(cfg.scientific_mode);
    setStarCorrectionMode(cfg.star_correction_mode);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-mark" />
        <div>
          <h1 className="app-title">AstroLab · Nano Banana Pro</h1>
          <p className="app-subtitle">
            Upload a deep-sky frame, name the target, and let Gemini 3 Pro Image
            emulate a pro astro workflow.
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="layout-grid">
          {/* LEFT COLUMN */}
          <div className="layout-column">
            {/* Upload card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">1 · Upload image</h2>
                <p className="card-subtitle">
                  PNG or JPEG stacked output from your smart telescope.
                </p>
              </div>
              <label className="upload-dropzone">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={onFileChange}
                  hidden
                />
                <div className="upload-inner">
                  <span className="upload-icon">⬆</span>
                  <div>
                    <div className="upload-title">
                      Click to choose or drop a file
                    </div>
                    <div className="upload-hint">
                      We’ll preserve this as the “before” view.
                    </div>
                  </div>
                </div>
              </label>
              {originalUrl && (
                <div className="upload-preview">
                  <img src={originalUrl} alt="Original preview" />
                </div>
              )}
            </div>

            {/* Target & preset */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">2 · Target & preset</h2>
                <p className="card-subtitle">
                  Object name feeds a search-grounded astro profile.
                </p>
              </div>

              <div className="field">
                <label className="field-label">Object name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. M42, NGC 7000, Andromeda"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
                <p className="field-help">
                  Used with Google Search grounding to understand type, colours
                  and structures to preserve.
                </p>
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label">Preset</label>
                  <select
                    className="field-input"
                    value={presetId}
                    onChange={(e) => applyPresetDefaults(e.target.value as PresetId)}
                  >
                    <option value="nebula">Emission / reflection nebula</option>
                    <option value="galaxy">Galaxy</option>
                    <option value="cluster">Open / globular cluster</option>
                    <option value="widefield">Wide-field Milky Way</option>
                    <option value="planetary">Planetary (Jupiter, Saturn, etc.)</option>
                    <option value="lunar">Moon / lunar surface</option>
                    <option value="solar">Sun / solar disc</option>
                    <option value="generic">Generic deep-sky</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Aspect ratio</label>
                  <select
                    className="field-input"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  >
                    <option value="auto">Auto (match uploaded image)</option>
                    <option value="3:2">3:2 (typical camera)</option>
                    <option value="2:3">2:3 (portrait)</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                    <option value="5:4">5:4</option>
                    <option value="4:5">4:5</option>
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="21:9">21:9 (cinematic)</option>
                  </select>
                  <p className="field-help">
                    “Auto” lets Gemini keep the same aspect ratio as your uploaded frame.
                    Choose a fixed ratio only if you explicitly want to crop/extend.
                  </p>
                </div>

                <div className="field">
                  <label className="field-label">Resolution</label>
                  <select
                    className="field-input"
                    value={imageSize}
                    onChange={(e) =>
                      setImageSize(e.target.value as "1K" | "2K" | "4K")
                    }
                  >
                    <option value="1K">1K (fast)</option>
                    <option value="2K">2K (balanced)</option>
                    <option value="4K">4K (max detail)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sliders card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">3 · Processing controls</h2>
                <p className="card-subtitle">
                  These map directly into Nano Banana Pro’s editing prompt.
                </p>
              </div>

              <SliderField
                label="Background / gradient removal"
                value={backgroundNeutralization}
                onChange={setBackgroundNeutralization}
                tooltip="Removes light pollution gradients and vignetting while trying to keep true nebulosity and halos."
              />
              <SliderField
                label="Stretch strength"
                value={stretchStrength}
                onChange={setStretchStrength}
                tooltip="How aggressively to brighten faint signal. High values can blow out bright cores if overdone."
              />
              <SliderField
                label="Noise reduction"
                value={noiseStrength}
                onChange={setNoiseStrength}
                tooltip="Target mainly background and faint nebulosity. Avoid smearing stars or small details."
              />
              <SliderField
                label={
                  presetId === "lunar"
                    ? "Edge / crater sharpness"
                    : presetId === "solar"
                      ? "Limb & fine-structure sharpness"
                      : "Star size reduction"
                }
                value={starReduction}
                onChange={setStarReduction}
                tooltip={
                  presetId === "lunar"
                    ? "Controls micro-contrast and sharpening on crater edges and fine lunar structure."
                    : presetId === "solar"
                      ? "Controls sharpness of granulation, sunspots and limb detail."
                      : "Controls how much small stars are reduced in size to reveal nebulosity or galaxy detail."
                }
              />
              <SliderField
                label="Colour saturation"
                value={saturation}
                onChange={setSaturation}
                tooltip="Global colour intensity. In scientific mode this stays more subtle; in artistic mode you can push it further."
              />
              <SliderField
                label="Sky darkness / black point"
                value={skyDarkening}
                onChange={setSkyDarkening}
                tooltip="How close the sky background should get to pure black. High values risk clipping faint stars and nebulosity; safe for lunar/solar."
              />

              <div className="field" style={{ marginTop: "0.75rem" }}>
                <label className="field-label">Star correction</label>
                <select
                  className="field-input"
                  value={starCorrectionMode}
                  onChange={(e) =>
                    setStarCorrectionMode(e.target.value as StarCorrectionMode)
                  }
                >
                  <option value="none">None (keep stars natural)</option>
                  <option value="mild_reduction">Mild reduction</option>
                  <option value="moderate_reduction">Moderate reduction</option>
                  <option value="strong_reduction">Strong reduction</option>
                  <option value="starless_emphasis">
                    Starless-style (nebula emphasis)
                  </option>
                </select>
                <p className="field-help">
                  Controls how aggressively Nano Banana Pro should shrink or suppress
                  stars. For nebulae, “moderate” is usually a good starting point;
                  for clusters and galaxies, “mild” keeps the field believable.
                </p>
              </div>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={scientificMode}
                  onChange={(e) => setScientificMode(e.target.checked)}
                />
                <span className="toggle-label">
                  Scientific mode (more conservative, physically plausible)
                </span>
              </label>

              <button
                className="primary-btn"
                disabled={isProcessing}
                onClick={processImage}
              >
                {isProcessing ? "Processing…" : "Run Nano Banana Pro"}
              </button>

              {error && <p className="error-text">{error}</p>}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="layout-column">
            {editedUrl ? (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Result</h2>
                  <p className="card-subtitle">Processed output from Nano Banana Pro.</p>
                </div>
                <div className="result-preview" style={{ marginTop: 0 }}>
                  <img src={editedUrl} alt="Edited astro" />
                </div>
                <button className="download-btn" onClick={handleDownload}>
                  Download full size
                </button>
              </div>
            ) : (
              <div className="card" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="status-text" style={{ textAlign: "center" }}>
                  {isProcessing ? "Processing..." : "Result will appear here"}
                </p>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Status & astro context</h2>
              </div>

              {isProcessing && (
                <p className="status-text">
                  Talking to Gemini 3 Pro & Nano Banana Pro… usually a few
                  seconds at 2K.
                </p>
              )}

              {!isProcessing && !editedUrl && (
                <p className="status-text">
                  Upload an image, set presets, then click “Run Nano Banana
                  Pro”.
                </p>
              )}

              {astroFacts && (
                <div className="astro-facts">
                  <div className="astro-pill">Search grounded</div>
                  <h3>{astroFacts.object_name}</h3>
                  <p className="astro-type">
                    Type: {astroFacts.object_type || "Unknown"}
                  </p>

                  {astroFacts.canonical_colors !== "unknown" && (
                    <p className="astro-text">
                      <strong>Typical colours:</strong>{" "}
                      {astroFacts.canonical_colors}
                    </p>
                  )}

                  {astroFacts.key_structures_to_preserve.length > 0 && (
                    <>
                      <p className="astro-text">
                        <strong>Preserve:</strong>
                      </p>
                      <ul>
                        {astroFacts.key_structures_to_preserve.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {astroFacts.unrealistic_edits_to_avoid.length > 0 && (
                    <>
                      <p className="astro-text">
                        <strong>Avoid:</strong>
                      </p>
                      <ul>
                        {astroFacts.unrealistic_edits_to_avoid.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
