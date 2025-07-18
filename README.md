# Angular Related Files

Switch between related Angular files (like `.ts`, `.html`, `.scss`, `.spec.ts`) using a single shortcut, tab icon, or right-click menu.

## Features

- **Cycle Related Files**: Press `Alt+O` (`Option+O` on macOS) to cycle through related files in a logical order.
- **Show Related Files**: Click the tab bar icon or right-click a tab to view and open all related files.
- **Configurable**: Ignore specific file types or toggle the tab icon in your settings.

## How to Use

### Cycle with Shortcut

Press `Alt+O` to jump to the next related file. Keep pressing to cycle through `.html`, `.ts`, `.scss`, `.spec.ts`, etc.

### Show Related Files

- Click the icon in the editor title bar  
- Or right-click the active tab  
Then pick a related file from the dropdown list.

## Configuration

You can customize the extension's behavior through your VS Code settings (`settings.json`):

- **`angular-related-files.showTabBarButton`**: Show or hide the "Show Related Angular Files" button in the editor title bar.
  - `true` (default)
  - `false`

- **`angular-related-files.showInContextMenu`**: Show or hide the "Show Related Angular Files" option in the context menu.
  - `true` (default)
  - `false`

- **`angular-related-files.ignore`**: A list of glob patterns to ignore when searching for related files.
  - Example: `["*.module.ts", "*.spec.ts"]`

## Contributing

Contributions are welcome! If you have ideas for new features or have found a bug, please open an issue or submit a pull request on the [GitHub repository](https://github.com/pokkertilkatt/angular-related-files).

---

Developed by pokkertilkatt.
