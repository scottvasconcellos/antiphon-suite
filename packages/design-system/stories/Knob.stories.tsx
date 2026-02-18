import type { Meta, StoryObj } from "@storybook/react";
import { Knob } from "../src/components/audio/Knob";

const meta: Meta<typeof Knob> = {
  title: "Design System/Audio/Knob",
  component: Knob,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    size: { control: "select", options: ["small", "medium", "large"] },
    min: { control: "number" },
    max: { control: "number" },
    defaultValue: { control: "number" },
    disabled: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Knob>;

export const Default: Story = {
  args: {
    label: "GAIN",
    defaultValue: 50,
    min: 0,
    max: 100,
    unit: "%",
    size: "medium",
  },
};

export const Small: Story = {
  args: {
    label: "PAN",
    defaultValue: 0,
    min: -100,
    max: 100,
    unit: "%",
    size: "small",
  },
};

export const Large: Story = {
  args: {
    label: "VOLUME",
    defaultValue: 80,
    min: 0,
    max: 100,
    unit: " dB",
    size: "large",
  },
};

export const RowOfKnobs: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
      <Knob label="CUTOFF" defaultValue={8000} min={20} max={20000} unit=" Hz" size="medium" />
      <Knob label="RES" defaultValue={30} min={0} max={100} unit="%" size="medium" />
      <Knob label="A" defaultValue={10} min={0} max={100} unit=" ms" size="small" />
      <Knob label="D" defaultValue={30} min={0} max={100} unit=" ms" size="small" />
      <Knob label="S" defaultValue={70} min={0} max={100} unit="%" size="small" />
      <Knob label="R" defaultValue={40} min={0} max={100} unit=" ms" size="small" />
    </div>
  ),
};
