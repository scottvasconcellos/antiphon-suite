/**
 * Smoke test: design system package exports resolve and key exports are usable.
 * Run with: pnpm exec tsx tests/exports-smoke.test.ts
 */
import * as ds from "../src/index";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(typeof ds.Button === "function", "Button should be exported");
assert(typeof ds.Card === "function", "Card should be exported");
assert(typeof ds.CardHeader === "function", "CardHeader should be exported");
assert(ds.colors != null && typeof ds.colors === "object", "colors tokens should be exported");
assert(ds.spacing != null && typeof ds.spacing === "object", "spacing tokens should be exported");
assert(ds.radius != null && typeof ds.radius === "object", "radius tokens should be exported");

// Audio component exports (piano roll, piano keyboard, guitar/bass fretboards)
assert(typeof ds.PianoRoll === "function", "PianoRoll should be exported");
assert(typeof ds.PianoKeyboard === "function", "PianoKeyboard should be exported");
assert(typeof ds.Fretboard === "function", "Fretboard should be exported");

// Icon exports
const iconNames = ["IconHome", "IconDashboard"];
for (const name of iconNames) {
  const icon = (ds as Record<string, unknown>)[name];
  assert(icon != null && typeof icon === "function", `${name} should be exported`);
}

console.log("Design system exports smoke test: OK");
process.exit(0);
