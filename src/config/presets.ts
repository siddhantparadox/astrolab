import type { PresetDefaults, PresetId } from "@/types/astro";

export const PRESET_DEFAULTS: Record<PresetId, PresetDefaults> = {
    nebula: {
        label: "Emission / reflection nebula",
        description:
            "Balanced defaults for Ha/OIII nebulae like NGC 281, with decent contrast but not overcooked reds.",
        sliders: {
            // Moderate gradient fix, little black-point push
            background_neutralization: 65,
            sky_darkening: 10,

            // Strong-ish stretch but not insane (80 was too much)
            stretch_strength: 62,

            // Medium noise reduction: clean but not plastic
            noise_strength: 52,

            // Moderate star shrink to pull focus to the nebula
            star_reduction: 55,

            // Reasonable saturation; avoids giant neon red halo
            saturation: 55,
        },
        scientific_mode: true,
        // Nebulae benefit from clear target with reduced star clutter;
        // starless is optional, so default to moderate reduction.
        star_correction_mode: "moderate_reduction",
    },

    galaxy: {
        label: "Galaxy",
        description:
            "Preserves cores, arms and dust lanes with a clean but not crushed background.",
        sliders: {
            background_neutralization: 60,
            sky_darkening: 25,
            stretch_strength: 55,
            noise_strength: 45,
            // Only mild shrink so the star field stays believable
            star_reduction: 35,
            saturation: 45,
        },
        scientific_mode: true,
        star_correction_mode: "mild_reduction",
    },

    cluster: {
        label: "Open / globular cluster",
        description:
            "Keeps stars as the main feature, with clean colour and gentle background control.",
        sliders: {
            background_neutralization: 45,
            sky_darkening: 40,
            stretch_strength: 48,
            noise_strength: 38,
            // Clusters want natural-looking stars, just tame the biggest
            star_reduction: 25,
            saturation: 52,
        },
        scientific_mode: true,
        star_correction_mode: "mild_reduction",
    },

    widefield: {
        label: "Wide-field Milky Way",
        description:
            "Good for tracked or untracked Milky Way shots: natural sky glow, not overcooked.",
        sliders: {
            background_neutralization: 65,
            // Keep some sky glow; don’t crush the band
            sky_darkening: 20,
            stretch_strength: 65,
            noise_strength: 55,
            // Mild star reduction to keep the band readable
            star_reduction: 30,
            saturation: 55,
        },
        scientific_mode: true,
        star_correction_mode: "mild_reduction",
    },

    planetary: {
        label: "Planets (Jupiter, Saturn, etc.)",
        description:
            "Emphasises belts, storms and rings, with a clean black background.",
        sliders: {
            background_neutralization: 40,
            sky_darkening: 80,
            stretch_strength: 55,
            noise_strength: 50,
            // Interpreted as edge/fine-detail sharpness in the prompt
            star_reduction: 70,
            saturation: 45,
        },
        scientific_mode: true,
        star_correction_mode: "none", // no star work, just planetary detail
    },

    lunar: {
        label: "Moon / lunar surface",
        description:
            "Sharpened lunar detail with a properly black sky and subtle colour.",
        sliders: {
            background_neutralization: 50,
            sky_darkening: 82, // sky should be basically black
            stretch_strength: 50,
            noise_strength: 45,
            // Interpreted as microcontrast / crater sharpness
            star_reduction: 80,
            saturation: 15,
        },
        scientific_mode: true,
        star_correction_mode: "none",
    },

    solar: {
        label: "Sun / solar disc",
        description:
            "Emphasises granulation and spots, keeps the disc shape and limb darkening intact.",
        sliders: {
            background_neutralization: 60,
            sky_darkening: 85,
            stretch_strength: 55,
            noise_strength: 50,
            // Interpreted as limb & fine-structure sharpness
            star_reduction: 75,
            saturation: 40,
        },
        scientific_mode: true,
        star_correction_mode: "none",
    },

    generic: {
        label: "Generic deep-sky",
        description:
            "Safe defaults when you’re not sure what the object is; moderate in all directions.",
        sliders: {
            background_neutralization: 58,
            sky_darkening: 18,
            stretch_strength: 60,
            noise_strength: 50,
            star_reduction: 45,
            saturation: 50,
        },
        scientific_mode: true,
        star_correction_mode: "moderate_reduction",
    },
};
