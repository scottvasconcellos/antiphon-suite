import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader } from "../src/components/ui/Card";

const meta: Meta<typeof Card> = {
  title: "Design System/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["flat", "raised", "inset"] },
    padding: { control: "select", options: ["none", "compact", "default", "spacious"] },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: "raised",
    padding: "default",
    children: (
      <>
        <CardHeader title="Card title" subtitle="Optional subtitle" />
        <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
          Card body content. Use design system tokens for typography and spacing.
        </p>
      </>
    ),
  },
};

export const Flat: Story = {
  args: {
    variant: "flat",
    padding: "default",
    children: "Flat variant with default padding.",
  },
};

export const Inset: Story = {
  args: {
    variant: "inset",
    padding: "compact",
    children: "Inset variant with compact padding.",
  },
};
