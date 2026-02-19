/**
 * Client-side app metadata for display in the Hub.
 * Descriptions, categories, use cases, and links for each app.
 */
export type AppCategory = "effects" | "apps" | "utilities" | "instruments";

export type AppMetadata = {
  id: string;
  name: string;
  /** Short tagline shown under the app name (one line). */
  tagline: string;
  description: string;
  category: AppCategory;
  useCases: string[];
  videoUrl?: string;
  /** Path to square app icon (e.g. /icons/hello-world.svg); fallback gradient dot if absent */
  iconPath?: string;
};

export const APP_METADATA: Record<string, AppMetadata> = {
  "antiphon.layer.hello-world": {
    id: "antiphon.layer.hello-world",
    name: "Hello World",
    tagline: "Minimal layer app for testing the control-plane.",
    description: "Minimal layer app for testing install, update, and launch flows.",
    category: "apps",
    useCases: ["Verify Hub control-plane", "Test artifact install", "Smoke test layer apps"],
    iconPath: "/icons/hello-world.svg",
  },
  "antiphon.layer.rhythm": {
    id: "antiphon.layer.rhythm",
    name: "Rhythm",
    tagline: "Rhythm and groove tools for producers and performers.",
    description: "Rhythm and groove tools for producers and performers.",
    category: "apps",
    useCases: ["Create rhythmic patterns", "Sync groove with projects", "Quick rhythm sketching"],
    iconPath: "/icons/rhythm.svg",
  },
  "antiphon.layer.chord-scale-helper": {
    id: "antiphon.layer.chord-scale-helper",
    name: "Chord Scale Helper",
    tagline: "One definitive chord-scale per view, exportable.",
    description: "Definitive chord-scale reference: one chord per view, exportable.",
    category: "apps",
    useCases: ["Chord lookup while composing", "Scale reference for solos", "Export chord charts"],
    iconPath: "/icons/chord-scale-helper.svg",
  },
  "hub-synth": {
    id: "hub-synth",
    name: "Antiphon Synth",
    tagline: "Sound synthesis for production and performance.",
    description: "Sound synthesis engine for music production and performance.",
    category: "instruments",
    useCases: ["Sound design", "Live performance", "Studio production"],
    iconPath: "/icons/synth.svg",
  },
  "hub-delay": {
    id: "hub-delay",
    name: "Antiphon Delay",
    tagline: "Time-based delay with tempo sync and filtering.",
    description: "Time-based delay effect with tempo sync and filtering.",
    category: "effects",
    useCases: ["Dub-style echoes", "Tempo-synced repeats", "Creative sound design"],
    videoUrl: "https://www.youtube.com/results?search_query=antiphon+delay",
    iconPath: "/icons/delay.svg",
  },
  "hub-chorus": {
    id: "hub-chorus",
    name: "Antiphon Chorus",
    tagline: "Modulation for thickening and stereo width.",
    description: "Modulation effect for thickening and stereo width.",
    category: "effects",
    useCases: ["Vocal thickening", "Stereo widening", "Classic chorus sounds"],
    iconPath: "/icons/chorus.svg",
  },
};

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  effects: "Effects",
  "apps": "Apps",
  utilities: "Utilities",
  instruments: "Instruments",
};
