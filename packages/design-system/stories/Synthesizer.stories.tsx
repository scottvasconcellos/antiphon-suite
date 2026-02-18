import type { Meta, StoryObj } from "@storybook/react";
import { Synthesizer } from "../src/components/audio/Synthesizer";

const meta: Meta<typeof Synthesizer> = {
  title: "Design System/Audio/Synthesizer",
  component: Synthesizer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof Synthesizer>;

export const Default: Story = {
  args: {},
};
