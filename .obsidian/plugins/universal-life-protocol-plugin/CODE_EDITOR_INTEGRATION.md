# Code Editor Integration

## Overview

The Code Editor is a custom Obsidian view that provides a full-featured code editing experience using CodeMirror 6. It supports multiple languages including JavaScript, Markdown (with front matter), and CanvasL.

## Features

### Language Support

- **JavaScript**: Full syntax highlighting and autocomplete for JavaScript/TypeScript
- **Markdown**: Markdown editing with YAML front matter parsing and highlighting
- **CanvasL**: Extended JSONL canvas format with syntax highlighting for:
  - R5RS function references
  - Dimension references (0D-7D)
  - Node/edge references (#id)
  - Directives (@directive)
  - Scheme expressions

### Editor Features

- Syntax highlighting for all supported languages
- Dark theme (oneDark) integration
- Line numbers
- Code folding
- Basic autocomplete
- Find/replace functionality
- Bracket matching
- Multiple cursor support
- History (undo/redo)

### File Operations

- **Open File**: Open files from your Obsidian vault
- **Save File**: Save changes back to vault files
- **New File**: Create new files with language-specific templates
- **Language Switching**: Switch between languages on the fly
- **Unsaved Changes Warning**: Prompts to save before closing

## Usage

### Opening the Code Editor

1. **Command Palette**: Press `Ctrl+P` (or `Cmd+P` on Mac) and search for "Open Code Editor"
2. **Command**: Use the command `open-code-editor` via command palette

### Using the Editor

1. **Language Selection**: Use the dropdown in the toolbar to select your language
2. **Opening Files**: Click "Open File" button and enter the file path
3. **Saving Files**: Click "Save" button or press `Ctrl+S` (or `Cmd+S` on Mac)
4. **Creating New Files**: Click "New" button to start with a blank file

### Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S`: Save file
- Standard CodeMirror shortcuts for navigation, selection, etc.

## File Type Detection

The editor automatically detects the language based on file extension:

- `.js`, `.ts`, `.jsx`, `.tsx` → JavaScript
- `.md`, `.markdown` → Markdown
- `.canvasl`, `.jsonl` → CanvasL

## Front Matter Support

When editing Markdown files, the editor provides special highlighting for YAML front matter:

```markdown
---
title: "Document Title"
description: "Document description"
jsonl: ["file1.jsonl", "file2.jsonl"]
canvas: "canvas.canvas"
tags: ["tag1", "tag2"]
---

# Content starts here
```

Front matter features:
- Syntax highlighting for keys and values
- Type detection (strings, booleans, numbers)
- Visual separation from content
- JSONL and canvas reference extraction

## CanvasL Format

CanvasL is an extended JSONL format for canvas definitions:

```jsonl
{"id":"0D-topology","type":"node","x":0,"y":0,"text":"Topology Node"}
{"id":"edge-1","type":"vertical","from":"0D-topology","to":"1D-temporal"}
{"id":"r5rs-call","type":"r5rs-call","function":"r5rs:lambda","args":["x","y"]}
```

Special highlighting for:
- **IDs**: Bold blue
- **Types**: Purple
- **Edge Types**: Red
- **R5RS Functions**: Cyan monospace
- **Dimensions** (0D-7D): Orange bold
- **References** (#id): Blue
- **Directives** (@directive): Red bold

## Architecture

### Components

1. **CodeEditorView** (`src/views/CodeEditorView.ts`): Main view class extending Obsidian's `ItemView`
2. **Language Extensions**:
   - `src/extensions/markdown-frontmatter.ts`: Markdown with front matter support
   - `src/extensions/canvasl-language.ts`: CanvasL language support
3. **Utilities**:
   - `src/utils/front-matter-parser.ts`: Front matter parsing logic

### Integration Points

- Registered as a custom view type: `CODE_EDITOR_VIEW_TYPE`
- Integrated with Obsidian's workspace system
- Uses Obsidian's file system API (`app.vault`) for file operations
- Respects Obsidian's theme system (dark/light mode)

## Configuration

### Settings (Future Enhancement)

The following settings can be added to the plugin settings:

- Default language preference
- Font size
- Theme preference (dark/light)
- Enable/disable features (line numbers, word wrap, etc.)
- Tab size

## Troubleshooting

### Editor Not Displaying

- Ensure CodeMirror dependencies are installed: `npm install`
- Check browser console for errors
- Verify the view is properly registered in `main.ts`

### Language Not Switching

- Check that language extensions are properly imported
- Verify file extension detection logic
- Check browser console for errors

### File Operations Not Working

- Ensure you have proper permissions to read/write files
- Check that file paths are correct
- Verify Obsidian vault is accessible

### Syntax Highlighting Not Working

- Check that language extensions are loaded
- Verify CodeMirror theme is applied
- Check CSS styles are loaded

## Development

### Adding New Languages

1. Create a new language extension file in `src/extensions/`
2. Export a function that returns CodeMirror extensions
3. Add language to `Language` type in `CodeEditorView.ts`
4. Add language option to dropdown in `onOpen()`
5. Add language detection logic in `loadFile()`
6. Add initial content template in `getInitialContent()`

### Extending Features

- **REPL Integration**: Add Scheme REPL console panel
- **OpenCode Integration**: Integrate with OpenCode API for code analysis
- **LSP Support**: Add Language Server Protocol support for better autocomplete
- **File Picker**: Replace prompt with Obsidian's file picker modal
- **Settings UI**: Add settings panel for editor configuration

## Dependencies

- `@codemirror/state`: Core state management
- `@codemirror/view`: Editor view components
- `@codemirror/commands`: Command handling
- `@codemirror/lang-javascript`: JavaScript language support
- `@codemirror/lang-markdown`: Markdown language support
- `@codemirror/theme-one-dark`: Dark theme
- `@codemirror/fold`: Code folding
- `@codemirror/matchbrackets`: Bracket matching
- `@codemirror/autocomplete`: Autocomplete functionality
- `@codemirror/highlight`: Syntax highlighting
- `@codemirror/search`: Search functionality
- `@codemirror/lint`: Linting support
- `@lezer/common`: Parser utilities
- `@lezer/highlight`: Highlighting utilities

## License

MIT License - Same as the main plugin
