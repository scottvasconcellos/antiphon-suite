import type { Meta, StoryObj } from "@storybook/react";
import { PianoRoll } from "../src/components/audio/PianoRoll";

const meta: Meta<typeof PianoRoll> = {
  title: "Design System/Audio/PianoRoll",
  component: PianoRoll,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    bars: { control: { type: "number", min: 1, max: 16 } },
  },
};

export default meta;

type Story = StoryObj<typeof PianoRoll>;

export const Default: Story = {
  args: {
    bars: 4,
    notes: [],
  },
};

export const WithNotes: Story = {
  args: {
    bars: 4,
    notes: [
      { id: "1", pitch: 48, start: 0, duration: 4, velocity: 100 },
      { id: "2", pitch: 52, start: 4, duration: 4, velocity: 90 },
      { id: "3", pitch: 55, start: 8, duration: 8, velocity: 80 },
    ],
  },
};
