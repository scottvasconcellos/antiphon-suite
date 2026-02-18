# Design System Integration Guide

This guide walks you through integrating the Antiphon Design System into a new app in the monorepo.

## Prerequisites

- Your app is in `apps/*` directory
- Your app uses React and TypeScript
- Your app uses Vite (or another build tool that supports CSS imports)

## Step-by-Step Integration

### 1. Add Design System Dependency

Add `@antiphon/design-system` to your app's `package.json`:

```json
{
  "dependencies": {
    "@antiphon/design-system": "workspace:*"
  }
}
```

### 2. Install Tailwind CSS Dependencies

Add Tailwind CSS and PostCSS to your app's `devDependencies`:

```json
{
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17"
  }
}
```

### 3. Configure Tailwind CSS

Create or update `tailwind.config.js` in your app root:

```javascript
/** @type {import('tailwindcss').Config} */
import designSystemConfig from '@antiphon/design-system/tailwind.config.js';

export default {
  ...designSystemConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include design system components for Tailwind class detection
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

### 4. Configure PostCSS

Create `postcss.config.js` in your app root:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 5. Import Design System Styles

In your app's main entry file (e.g., `src/main.tsx` or `src/index.tsx`):

```typescript
// Import app-specific styles first
import './styles/app.css';

// Import design system styles last (so design system tokens are source of truth)
import '@antiphon/design-system/styles';
```

**Important**: Import design system styles **after** your app-specific styles so that design system tokens take precedence.

### 6. Use Design System Components

Import and use components:

```typescript
import { Button, Card, Input } from '@antiphon/design-system/components';
// Or import specific components
import { Button } from '@antiphon/design-system/components';
```

### 7. Use Design System Icons

```typescript
import { IconHome, IconDashboard } from '@antiphon/design-system/icons';
```

### 8. Use Design Tokens

#### Via CSS Variables

```css
.my-component {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

#### Via Tailwind Classes

```tsx
<div className="bg-surface text-primary rounded-md p-md">
  Content
</div>
```

#### Via TypeScript Tokens

```typescript
import { colors, spacing, radius } from '@antiphon/design-system/tokens';

const styles = {
  background: colors.bg.surface,
  padding: spacing.md,
  borderRadius: radius.md,
};
```

## Example: Complete App Setup

Here's a complete example for a new app:

**`apps/my-app/package.json`**:
```json
{
  "name": "@antiphon/my-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@antiphon/design-system": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.3",
    "vite": "^7.2.1"
  }
}
```

**`apps/my-app/tailwind.config.js`**:
```javascript
import designSystemConfig from '@antiphon/design-system/tailwind.config.js';

export default {
  ...designSystemConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

**`apps/my-app/postcss.config.js`**:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`apps/my-app/src/main.tsx`**:
```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import app-specific styles first
import './styles/app.css';

// Import design system styles last
import '@antiphon/design-system/styles';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**`apps/my-app/src/App.tsx`**:
```typescript
import { Button, Card } from '@antiphon/design-system/components';
import { IconHome } from '@antiphon/design-system/icons';

export default function App() {
  return (
    <Card className="p-lg">
      <h1>My App</h1>
      <Button variant="primary">
        <IconHome />
        Click me
      </Button>
    </Card>
  );
}
```

## Troubleshooting

### Styles Not Applying

- Ensure design system styles are imported **after** your app styles
- Check that Tailwind config includes design system source files in `content`
- Verify PostCSS is configured correctly

### TypeScript Errors

- Ensure `@antiphon/design-system` is in your `dependencies` (not `devDependencies`)
- Run `pnpm install` to ensure workspace dependencies are linked
- Check that your TypeScript config allows imports from workspace packages

### Components Not Found

- Verify the import path: `@antiphon/design-system/components`
- Check that the component is exported in `packages/design-system/src/components/index.ts`
- Ensure you're using the correct export name (case-sensitive)

### Tailwind Classes Not Working

- Verify Tailwind config extends design system config
- Check that design system source files are in Tailwind's `content` array
- Ensure PostCSS is processing CSS files correctly

## Best Practices

1. **Don't Override Design Tokens**: Use design system tokens as-is. If you need customizations, add them to your app's CSS file, but avoid duplicating design system tokens.

2. **Use Design System Components**: Prefer design system components over building custom ones. They're tested and consistent.

3. **Follow Design Guidelines**: Read `packages/design-system/src/guidelines/Guidelines.md` for brand guidelines and usage patterns.

4. **Import Styles Correctly**: Always import design system styles last so they take precedence.

5. **Type Safety**: Use TypeScript types exported from the design system for better IDE support.

## Next Steps

- Read the [Design Guidelines](../design-system/src/guidelines/Guidelines.md)
- Explore [Usage Examples](./USAGE_EXAMPLES.md)
- Check the [Quick Start Guide](./QUICK_START.md)
