# Angular Related Files

Navigate between your Angular files with ease! This VS Code extension helps you quickly switch between related component, service, directive, and other files without searching through the file explorer.

![Angular Related Files Icon](resources/dark/angular-files-icon.svg)

## Features

- **Show Related Files**: Instantly see a list of all related files (e.g., `.ts`, `.html`, `.scss`, `.spec.ts`) and jump to any of them.
- **Cycle Through Files**: Use a simple keybinding (`Alt+O`) to cycle through all related files in a logical order, perfect for quick edits.
- **Configurable**: Customize the extension to ignore certain file patterns.

## How to Use

### Show Related Files

Click the icon in the editor title bar to open a dropdown list of all related files. Select a file from the list to open it.

*(You can add a GIF here showing this feature in action)*

### Cycle Related Files

Press `Alt+O` (`Option+O` on macOS) to instantly switch to the next related file. The cycle order is prioritized for common workflows: `.html` -> `.ts` -> `.scss` -> `.spec.ts`, etc.

## Configuration

You can customize the extension's behavior through your VS Code settings (`settings.json`):

- **`angular-related-files.showTabBarButton`**: Show or hide the "Show Related Angular Files" button in the editor title bar.
  - `true` (default)
  - `false`

- **`angular-related-files.ignore`**: A list of glob patterns to ignore when searching for related files.
  - Example: `["*.module.ts", "*.spec.ts"]`

## Contributing

Contributions are welcome! If you have ideas for new features or have found a bug, please open an issue or submit a pull request on the [GitHub repository](https://github.com/pokkertilkatt/angular-related-files).

---

Developed by pokkertilkatt.
