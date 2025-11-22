export type PresetId =
  | "nebula"
  | "galaxy"
  | "cluster"
  | "widefield"
  | "planetary"
  | "lunar"
  | "solar"
  | "generic";

export interface AstroFacts {
  object_name: string;
  object_type: string;
  canonical_colors: string;
  key_structures_to_preserve: string[];
  unrealistic_edits_to_avoid: string[];
}

// How aggressive we want star correction / removal in the prompt.
export type StarCorrectionMode =
  | "none"              // preserve stars; only fix obvious artifacts
  | "mild_reduction"    // small shrink, keep field natural
  | "moderate_reduction"// noticeably smaller stars
  | "strong_reduction"  // heavy shrink; stars secondary
  | "starless_emphasis";// emulate starless processing for nebulae

// Supported aspect ratios from the Gemini docs + our "auto" mode.
export type AspectRatio =
  | "auto"  // NEW – let Gemini match the uploaded image
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

export interface EditParams {
  object_name: string | null;
  preset_id: PresetId;

  aspect_ratio: AspectRatio;
  image_size: "1K" | "2K" | "4K";  // Nano Banana Pro sizes

  // Sliders: 0–100

  // Sliders: 0–100
  background_neutralization: number; // gradient removal / background balance
  sky_darkening: number;             // black point push
  stretch_strength: number;          // global stretch / contrast
  noise_strength: number;            // noise reduction
  star_reduction: number;            // star/edge control
  saturation: number;                // colour intensity

  scientific_mode: boolean;
  star_correction_mode: StarCorrectionMode;
}

// Used for UI defaults per preset
export interface PresetDefaults {
  label: string;
  description: string;
  sliders: {
    background_neutralization: number;
    sky_darkening: number;
    stretch_strength: number;
    noise_strength: number;
    star_reduction: number;
    saturation: number;
  };
  scientific_mode: boolean;
  star_correction_mode: StarCorrectionMode;
}
