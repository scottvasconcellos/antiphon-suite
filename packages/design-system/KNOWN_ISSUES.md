# Known Issues

## TypeScript Errors (Non-Blocking)

The design system has ~90 TypeScript errors that are **non-blocking** and don't affect runtime functionality. These are primarily related to third-party library type compatibility:

### Lucide React Icons (TS2786)
- **Error**: `'ChevronDownIcon' cannot be used as a JSX component`
- **Affected**: accordion, breadcrumb, calendar, carousel, checkbox, command, and other components using lucide-react icons
- **Cause**: React type compatibility between lucide-react and React 18/19 types
- **Impact**: None - icons render correctly at runtime
- **Status**: Known issue with lucide-react library types

### Recharts Components (TS2344, TS2786)
- **Error**: Type compatibility issues with `ResponsiveContainer` and chart components
- **Affected**: `src/components/ui/chart.tsx`
- **Cause**: Recharts type definitions compatibility
- **Impact**: None - charts render correctly at runtime
- **Status**: Known issue with recharts library types

### CMDK (Command) Components (TS2339, TS2344)
- **Error**: Property 'className' does not exist, type constraint issues
- **Affected**: `src/components/ui/command.tsx`
- **Cause**: cmdk library type definitions
- **Impact**: None - command palette works correctly at runtime
- **Status**: Known issue with cmdk library types

## Resolution Strategy

These errors are **intentionally left unfixed** because:

1. **Non-blocking**: They don't prevent the design system from building or running
2. **Library issues**: They're caused by third-party library type definitions, not our code
3. **Runtime works**: All components function correctly despite TypeScript warnings
4. **Future fixes**: Will be resolved when libraries update their type definitions

## Workarounds (If Needed)

If you need to suppress these errors in your IDE:

1. **VS Code/Cursor**: Add to `.vscode/settings.json`:
   ```json
   {
     "typescript.preferences.includePackageJsonAutoImports": "off",
     "typescript.tsdk": "node_modules/typescript/lib"
   }
   ```

2. **TypeScript Config**: Already has `skipLibCheck: true` which helps

3. **Build**: The build process ignores these errors and produces working output

## Monitoring

These issues will be monitored and addressed when:
- Library maintainers release type definition updates
- React types stabilize across versions
- Critical functionality is affected (currently none)
