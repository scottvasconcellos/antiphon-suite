import type { Meta, StoryObj } from "@storybook/react";
import { Fretboard } from "../src/components/audio/Fretboard";

const meta: Meta<typeof Fretboard> = {
  title: "Design System/Audio/Fretboard",
  component: Fretboard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    type: { control: "select", options: ["guitar", "bass"] },
    frets: { control: { type: "number", min: 12, max: 24 } },
  },
};

export default meta;

type Story = StoryObj<typeof Fretboard>;

export const Guitar: Story = {
  args: {
    type: "guitar",
    frets: 15,
  },
};

export const Bass: Story = {
  args: {
    type: "bass",
    frets: 15,
  },
};

export const GuitarWithCallback: Story = {
  args: {
    type: "guitar",
    frets: 12,
    onNoteSelect: (stringIdx, fret, noteName) => {
      console.log("Note selected:", stringIdx, fret, noteName);
    },
  },
};
