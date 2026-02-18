import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../src/components/ui/Button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "outline", "link"],
    },
    size: {
      control: "select",
      options: ["compact", "default", "spacious"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary", children: "Primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <Button size="compact">Compact</Button>
      <Button size="default">Default</Button>
      <Button size="spacious">Spacious</Button>
    </div>
  ),
};
