import type { Meta, StoryObj } from "@storybook/react";
import { PianoKeyboard } from "../src/components/audio/PianoKeyboard";

const meta: Meta<typeof PianoKeyboard> = {
  title: "Design System/Audio/PianoKeyboard",
  component: PianoKeyboard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    octaves: { control: { type: "number", min: 1, max: 7 } },
    startOctave: { control: { type: "number", min: 0, max: 6 } },
    showNoteNames: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof PianoKeyboard>;

export const Default: Story = {
  args: {
    octaves: 3,
    startOctave: 3,
    showNoteNames: true,
  },
};

export const TwoOctaves: Story = {
  args: {
    octaves: 2,
    startOctave: 4,
    showNoteNames: true,
  },
};

export const NoNoteNames: Story = {
  args: {
    octaves: 3,
    startOctave: 3,
    showNoteNames: false,
  },
};
