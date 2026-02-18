# Design System Usage Examples

## Basic Component Usage

```tsx
import { Button, Card, Input } from '@antiphon/design-system/components';

function MyComponent() {
  return (
    <Card>
      <h2>My Card</h2>
      <Input placeholder="Enter text..." />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

## With Icons

```tsx
import { Button } from '@antiphon/design-system/components';
import { IconHome, IconSettings } from '@antiphon/design-system/icons';

function Navigation() {
  return (
    <nav>
      <Button variant="ghost">
        <IconHome /> Home
      </Button>
      <Button variant="ghost">
        <IconSettings /> Settings
      </Button>
    </nav>
  );
}
```

## Using Design Tokens

```tsx
import { colors, spacing } from '@antiphon/design-system/tokens';

// In CSS/className
<div style={{
  backgroundColor: colors.bg.surface,
  padding: spacing.md,
  color: colors.text.primary
}}>
  Content
</div>

// Or with CSS variables
<div className="bg-[var(--color-bg-surface)] p-[var(--spacing-md)]">
  Content
</div>
```

## Button Variants

```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="danger">Delete</Button>
<Button variant="illuminated">Hardware Style</Button>
```

## Audio Components

```tsx
import { PianoRoll, Transport, Knob } from '@antiphon/design-system/components';

function AudioInterface() {
  return (
    <div>
      <Transport />
      <PianoRoll />
      <Knob label="Gain" value={50} />
    </div>
  );
}
```

## Utility Classes

```tsx
<span className="hardware-label">GAIN</span>
<span className="telemetry">-12.5 dB</span>
<h1 className="display">Antiphon Suite</h1>
```
