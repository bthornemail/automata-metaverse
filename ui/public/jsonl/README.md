# Local JSONL Files

This directory contains JSONL files that can be loaded directly in the browser without requiring a server connection.

## Available Files

- `generate.metaverse.jsonl` - Metaverse generator definitions
- `automaton-kernel.jsonl` - Core kernel definitions
- `automaton.jsonl` - Operational automaton data
- `r5rs-functions-trie.jsonl` - R5RS function definitions
- `automaton.canvas.space.jsonl` - Canvas space definitions
- `automaton-kernel.seed.jsonl` - Kernel seed data

## Usage

The UI will automatically try to load files from this directory first before falling back to the API server. This allows the UI to work offline or when the server is disconnected.

## Updating Files

To update these files, copy them from the project root:
```bash
cp *.jsonl ui/public/jsonl/
```
