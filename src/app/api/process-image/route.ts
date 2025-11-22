import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { AstroFacts, EditParams } from "@/types/astro";

export const runtime = "nodejs"; // ensure Node runtime (we use Buffer)

// ---- Gemini client ----

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in .env.local");
}

const ai = new GoogleGenAI({
    apiKey,
    // default Developer API settings are fine here
});

const TEXT_MODEL = "gemini-3-pro-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview";

// ---- Helpers ----

async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
): Promise<T> {
    try {
        return await fn();
    } catch (err: any) {
        if (retries > 0 && err?.status === 429) {
            console.warn(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw err;
    }
}

async function fetchAstroFacts(objectName: string): Promise<AstroFacts | null> {
    // Uses Google Search grounding for real-world astro info.
    // Pattern follows official "Grounding with Google Search" JS docs:
    // tools: [{ googleSearch: {} }] in config.

    const groundingTool = { googleSearch: {} as Record<string, never> };

    const prompt = `
You are an astrophysics assistant. Use Google Search to look up the deep sky object "${objectName}".

Return ONLY valid JSON with this exact structure:

{
  "object_name": string,                      // Common name + catalog if available
  "object_type": string,                      // e.g. "emission nebula", "spiral galaxy", "open cluster"
  "canonical_colors": string,                 // Typical broadband RGB colours
  "key_structures_to_preserve": [string, ...],
  "unrealistic_edits_to_avoid": [string, ...]
}

If you are unsure about the object, respond with:

{
  "object_name": "${objectName}",
  "object_type": "unknown",
  "canonical_colors": "unknown",
  "key_structures_to_preserve": [],
  "unrealistic_edits_to_avoid": []
}
  `.trim();

    return retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            config: {
                tools: [groundingTool],
                responseMimeType: "application/json",
            },
        });

        const text = response.text || "";
        try {
            const parsed = JSON.parse(text) as AstroFacts;
            return parsed;
        } catch {
            // Fall back gracefully if JSON is malformed.
            return null;
        }
    });
}

function buildEditPrompt(params: EditParams, astro: AstroFacts | null): string {
    const lines: string[] = [];

    lines.push(
        "You are an expert deep-sky astrophotography image processing assistant.",
        "You receive a single stacked image from a smart telescope, and your job is to emulate a standard astrophotography post-processing workflow.",
    );

    if (params.object_name) {
        lines.push(`\nTarget object (user input): "${params.object_name}".`);
    }

    if (astro) {
        lines.push("\nAstrophysical context (grounded via Google Search):");
        lines.push(`- Interpreted name: ${astro.object_name}`);
        lines.push(`- Object type: ${astro.object_type}`);

        if (astro.canonical_colors.toLowerCase() !== "unknown") {
            lines.push(
                `- Canonical broadband colours: ${astro.canonical_colors}. Keep the result broadly consistent.`,
            );
        }

        if (astro.key_structures_to_preserve.length > 0) {
            lines.push("\nImportant physical structures to preserve:");
            for (const item of astro.key_structures_to_preserve) {
                lines.push(`- ${item}`);
            }
        }

        if (astro.unrealistic_edits_to_avoid.length > 0) {
            lines.push("\nUnrealistic edits to avoid:");
            for (const item of astro.unrealistic_edits_to_avoid) {
                lines.push(`- ${item}`);
            }
        }
    } else {
        lines.push(
            "\nIf you cannot identify the object, treat it as generic deep-sky data and avoid obviously non-physical changes.",
        );
    }

    // Generic astro workflow
    lines.push(
        `
Conceptual workflow you should emulate:

1. Background & gradients
   - Remove light pollution gradients and vignetting.
   - Neutralise the sky background to a very dark grey, not pure black.
   - Do not erase real nebulosity, galaxy halos, or dust lanes.

2. Stretch
   - Apply a non-linear stretch to reveal faint structures.
   - Protect bright cores and star colours from clipping.

3. Noise reduction
   - Target mainly background and faint nebulosity.
   - Avoid smearing stars, small galaxies, or small-scale details.

4. Star control
   - Optionally reduce star sizes based on the slider.
   - Keep star shapes natural. Preserve colours.

5. Local contrast & colour
   - Gently enhance contrast in real structures.
   - Apply colour saturation according to the slider while keeping a tasteful appearance.

6. Integrity constraints
   - Do NOT invent large new structures.
   - Do NOT substantially move, remove, or reposition stars or nebulae.
   - Do NOT rotate, flip, crop, or add overlays.
`.trim(),
    );

    // Slider values
    lines.push("\nSlider values (0 = none, 100 = very strong):");
    lines.push(
        `- Background / gradient neutralisation: ${params.background_neutralization}/100`,
    );
    lines.push(`- Stretch strength: ${params.stretch_strength}/100`);
    lines.push(`- Noise reduction: ${params.noise_strength}/100`);
    lines.push(
        `- Star / edge sharpness control: ${params.star_reduction}/100 (interpreted per preset)`,
    );
    lines.push(`- Colour saturation: ${params.saturation}/100`);
    lines.push(`- Sky darkness / black point: ${params.sky_darkening}/100`);

    lines.push(
        `
Interpret "Sky darkness / black point" as how strongly to push the background towards pure black:

- 0–20: keep a natural dark grey sky and preserve the faintest stars.
- 20–60: moderately darker background while still avoiding obvious clipping.
- 60–100: very dark, inky background; only do this where the background truly should be black and avoid eating into real signal.
`.trim(),
    );

    lines.push(
        `
Interpret "Star correction" and "Star/edge control" as follows:

- When star_correction_mode = "none":
  * Preserve star sizes and brightness; only fix obvious artifacts or halos.
- When "mild_reduction":
  * Gently shrink stars by roughly 10–20% and slightly reduce overpowering star halos.
- When "moderate_reduction":
  * Noticeably reduce star sizes (about 20–40%) so the main target stands out,
    but keep the star field looking believable.
- When "strong_reduction":
  * Strongly reduce star sizes (up to ~50%) and de-emphasise background stars;
    avoid making stars vanish completely or look like pin-pricks.
- When "starless_emphasis":
  * Substantially suppress or remove most stars in the style of starless processing
    tools (e.g. StarNet++), primarily for nebula images. Do NOT hallucinate new
    nebulosity; treat it as a cosmetic star mask.
`.trim(),
    );

    lines.push(
        `
Use the "Star/edge control" value (0–100) as the strength within the chosen star_correction_mode:
- 0–20: very subtle
- 20–40: mild
- 40–60: medium
- 60–80: strong
- 80–100: very strong (use with care to avoid artifacts)
`.trim(),
    );

    if (params.scientific_mode) {
        lines.push(
            `
Scientific mode is ON:

- Prioritise physically plausible colours and brightness.
- Avoid clipping highlights and shadows.
- Keep noise reduction conservative and detail-preserving.
- Avoid halos and oversharpening artifacts.
`.trim(),
        );
    } else {
        lines.push(
            `
Scientific mode is OFF (more artistic):

- You may use stronger stretch and saturation and a slightly darker background.
- Still avoid neon colours and obviously fake structures.
`.trim(),
        );
    }

    // Preset-specific hints
    lines.push(`\nPreset: ${params.preset_id}`);

    switch (params.preset_id) {
        case "nebula":
            lines.push(
                `
- This is an emission/reflection nebula. Stars are important but the nebula is the main subject.
- When star_correction_mode is "moderate_reduction" (the default), shrink stars enough
  to reveal the nebula structure but keep some star field context.
- Only use "starless_emphasis" if the user selected it; in that case, strongly suppress
  stars but still return a clean, artifact-free background.
- Emphasise faint outer nebulosity and dark dust lanes.
- Preserve bright core detail.
- Maintain differences between reddish H-alpha regions and bluer reflection/OIII regions.
- Only use strong sky darkening if there is no real faint nebulosity in the background.
- If "Sky darkness / black point" is >50, be extremely careful not to clip faint nebula or tiny stars.
`.trim(),
            );
            break;
        case "galaxy":
            lines.push(
                `
- Preserve spiral arms, dust lanes and halo.
- Maintain contrast between yellowish bulge and bluer disk.
- Avoid over-smoothing small satellite galaxies.
`.trim(),
            );
            break;
        case "cluster":
            lines.push(
                `
- Focus on clean star shapes and colour separation.
- Only mild star size reduction.
- Keep the background clean but not fully black.
`.trim(),
            );
            break;
        case "widefield":
            lines.push(
                `
- Emphasise Milky Way dust lanes and diffuse emission.
- Remove strong gradients from light pollution while keeping natural sky glow.
- Maintain rich, dense star fields.
`.trim(),
            );
            break;
        case "planetary":
            lines.push(
                `
- Emphasise small-scale details (rings, belts, crater rims).
- Use strong local contrast with careful noise reduction.
- Maintain crisp edges without ringing.
`.trim(),
            );
            break;
        case "lunar":
            lines.push(
                `
- This is a high-resolution lunar image (Moon). Treat it as a bright, nearby body, not a faint deep-sky object.
- Prioritise sharp, crisp detail along the terminator, crater rims and rilles.
- Use the star/edge sharpness slider as a control for microcontrast and sharpening of small-scale lunar details:
  - 0–30: almost no extra sharpening, only gentle clarity.
  - 30–70: moderate, natural sharpening suitable for most lunar images.
  - 70–100: aggressive sharpening; still avoid halos and ringing.
- Preserve the natural phase and terminator geometry; do not move or reshape the illuminated part.
- Background should be a clean, neutral black or very dark grey, with no large gradients or banding.
- Keep colour very subtle: Moon is mostly grey with slight warm/cool variations. Avoid turning it neon or strongly tinted.
- Use "Sky darkness / black point" to make the background essentially black:
  - At values >60, remove virtually all background glow and noise so the sky looks black,
    but do NOT eat into the lunar limb or any faint limb haze.
- If needed, slightly expand the dynamic range of the Moon itself rather than letting the
  background stay grey.
`.trim(),
            );
            break;
        case "solar":
            lines.push(
                `
- This is a solar image (Sun). Treat it as a bright disc with fine surface texture, not a faint deep-sky object.
- Do NOT add artificial flares, prominences or sunspots that are not present.
- Use the star/edge sharpness slider as a control for fine structure:
  - 0–30: very gentle enhancement; preserve smooth gradations.
  - 30–70: moderate emphasis of granulation, sunspots, penumbrae and limb detail.
  - 70–100: strong local contrast; avoid halos and harsh rings around features.
- Preserve the circular shape and limb darkening; do not distort the disc.
- If the source is white-light broadband:
  - Keep colours roughly neutral white to warm yellow, with natural limb darkening.
  - Avoid cartoonish yellows/oranges.
- If the source appears narrowband (e.g. H-alpha):
  - Respect the existing colour cast; do not force it to white-light yellow.
  - Emphasise prominences and filaments that are actually visible.
- Background should be uniform and clean; remove gradients or banding without changing the disc geometry.
- Use "Sky darkness / black point" to make areas outside the disc clean, uniform and very dark.
- Do not shrink the disc or nibble away the limb to make the background darker.
- If the telescope has internal scatter or subtle glow, remove that in the background but
  preserve true limb darkening and any real structures at the edge.
`.trim(),
            );
            break;
        default:
            lines.push("- Use a balanced, general-purpose deep-sky processing approach.");
    }

    lines.push(
        "\nReturn ONLY the edited astro image content; no borders, text labels, or watermarks.",
    );

    return lines.join("\n");
}

async function runAstroEdit(
    base64Image: string,
    mimeType: string,
    params: EditParams,
    astro: AstroFacts | null,
): Promise<string> {
    const prompt = buildEditPrompt(params, astro);

    // Build multimodal contents: text + original astro image.
    const contents = [
        {
            role: "user",
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType,
                        data: base64Image,
                    },
                },
            ],
        },
    ];

    // For Nano Banana Pro, image config is controlled via imageConfig.imageSize + imageConfig.aspectRatio
    // as shown in official image generation docs.

    // Build imageConfig with optional aspectRatio
    const imageConfig: { imageSize: string; aspectRatio?: string } = {
        imageSize: params.image_size, // "1K" | "2K" | "4K"
    };

    // Only override aspect ratio if the user did NOT choose auto
    if (params.aspect_ratio && params.aspect_ratio !== "auto") {
        imageConfig.aspectRatio = params.aspect_ratio;
    }

    return retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents,
            config: {
                // We don't *need* googleSearch here because we've already grounded object facts,
                // but you *can* enable it if you want the model to double-check:
                // tools: [{ googleSearch: {} }],
                imageConfig,
            },
        });

        // Grab first image from candidates
        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content) {
            throw new Error("No candidates returned from Nano Banana Pro.");
        }

        for (const part of candidate.content.parts ?? []) {
            if (part.inlineData?.data) {
                return part.inlineData.data; // base64 image
            }
        }

        throw new Error("No image part returned from Nano Banana Pro.");
    });
}

// ---- API handler ----

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const file = formData.get("file");
        const payloadRaw = formData.get("payload");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "Missing or invalid image file." },
                { status: 400 },
            );
        }

        if (!payloadRaw || typeof payloadRaw !== "string") {
            return NextResponse.json(
                { error: "Missing metadata payload." },
                { status: 400 },
            );
        }

        const params = JSON.parse(payloadRaw) as EditParams;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        const mimeType = file.type || "image/png";

        let astroFacts: AstroFacts | null = null;
        if (params.object_name && params.object_name.trim().length > 1) {
            astroFacts = await fetchAstroFacts(params.object_name.trim());
        }

        const editedBase64 = await runAstroEdit(
            base64Image,
            mimeType,
            params,
            astroFacts,
        );

        return NextResponse.json({
            edited_image_base64: editedBase64,
            astro_facts: astroFacts,
        });
    } catch (err: unknown) {
        console.error("Error in /api/process-image:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 },
        );
    }
}
