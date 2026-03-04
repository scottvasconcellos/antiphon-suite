# Design System Update Rule

When the user provides a new Figma export ZIP file to update the design system:

## Process

1. **Run the update script:**
   ```bash
   node scripts/update-design-system.mjs /path/to/new-figma-export.zip
   ```

2. **Review the generated `.migration-warnings.md` file:**
   - Check for breaking changes (component API changes, token removals)
   - Review removed items and verify they're not still needed
   - Check for kept items that contradict guidelines

3. **For each warning:**
   - **Breaking changes:** Update consuming apps to use new APIs
   - **Removed items:** Check if still used, migrate if needed
   - **Kept items:** Review and decide whether to keep or remove

4. **Test that consuming apps still work:**
   - Run `pnpm install` to ensure dependencies are updated
   - Check that components render correctly
   - Verify tokens are accessible
   - Test icons display properly

5. **Commit changes:**
   ```bash
   git add packages/design-system/
   git commit -m "Update design system to [version]"
   ```

## Conflict Resolution Rules

- **Newer wins:** If a file exists in both old and new → Replace with new version
- **Direct contradiction:** If removing an old component/token would contradict new Guidelines.md:
  - Keep the old item temporarily
  - Generate a warning for manual review
  - Flag for decision

## Notes

- The update script preserves the original ZIP in `.update-history/` for reference
- Migration warnings are always generated, even for non-breaking changes
- Version is automatically bumped in `package.json`
- Manifest tracks all file hashes for change detection
