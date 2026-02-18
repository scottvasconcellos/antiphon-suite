# Design System Quick Start

## Import Styles

Add to your app's entry point (e.g., `main.tsx` or `App.tsx`):

```tsx
import '@antiphon/design-system/styles';
```

## Use Components

```tsx
import { Button, Card, Input } from '@antiphon/design-system/components';
import { IconHome, IconSettings } from '@antiphon/design-system/icons';

function MyComponent() {
  return (
    <Card>
      <Button variant="primary">
        <IconHome /> Home
      </Button>
      <Input placeholder="Search..." />
    </Card>
  );
}
```

## Use Tokens

```tsx
import { colors, typography, spacing } from '@antiphon/design-system/tokens';

// In CSS
.my-element {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

## Common Patterns

### Button Variants
- `primary` - Main action (blue)
- `secondary` - Default (elevated surface)
- `ghost` - Subtle, no background
- `danger` - Destructive action (red)
- `illuminated` - Hardware-style red button

### Icons
All icons support `filled` prop:
```tsx
<IconHome filled={false} /> // Outline (default)
<IconHome filled={true} />  // Filled (active/selected)
```

### Utility Classes
```tsx
<span className="hardware-label">GAIN</span>
<span className="telemetry">-12.5 dB</span>
<h1 className="display">Antiphon Suite</h1>
```

## Tailwind Config

Your app's `tailwind.config.js` should extend the design system:

```js
import designSystemConfig from '@antiphon/design-system/tailwind.config.js';

export default {
  ...designSystemConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

## Full Documentation

See `README.md` for complete API documentation.
