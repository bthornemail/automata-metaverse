---
id: automaton-evolution-dashboard-readme
title: "Snapshot Dashboard"
level: practical
type: guide
tags: [automaton-evolution, dashboard, visualization, snapshot-analysis]
keywords: [automaton-evolution, snapshot-dashboard, visualization, evolution-tracking, memory-monitoring]
prerequisites: [automaton-evolution-logging-readme]
enables: []
related: [automaton-evolution-architecture, automaton-evolution-workflow]
readingTime: 30
difficulty: 3
blackboard:
  status: active
  assignedAgent: "6D-Intelligence-Agent"
  lastUpdate: 2025-01-07
  dependencies: [snapshot-system]
  watchers: []
---

# Snapshot Analysis Dashboard

## Overview

Interactive web dashboard for visualizing automaton snapshot analysis results from actual snapshot files.

## Files

- **`snapshot-dashboard-standalone.html`** - Standalone dashboard (works offline, uses file upload)
- **`snapshot-dashboard.html`** - Server-based dashboard (requires web server)
- **`generate-snapshot-list.js`** - Script to generate snapshot file list

## Quick Start

### Option 1: Standalone Dashboard (Recommended)

1. Open `snapshot-dashboard-standalone.html` in your web browser
2. Click "Load Sample Data" to see example visualization
3. Or select snapshot JSON files from `snapshots-memory/` directory
4. Click "Analyze Snapshots" to process them

**No server required** - works completely offline!

### Option 2: Server-Based Dashboard

1. Start a local web server:
   ```bash
   cd /home/main/automaton/docs/14-Automaton-Evolution-Logging
   python3 -m http.server 8000
   # or
   npx serve .
   ```

2. Open `http://localhost:8000/snapshot-dashboard.html` in browser

3. Enter path to snapshots: `../../snapshots-memory`

4. Click "Load Snapshots"

## Features

### 📊 Statistics Cards
- Total snapshots analyzed
- Time span
- Memory metrics (start, end, peak, change)
- Memory stability
- Quality score

### 📈 Interactive Charts
- **Memory Usage Over Time** - Line chart showing memory progression
- **Memory Pressure Distribution** - Doughnut chart of LOW/MEDIUM/HIGH pressure
- **Dimension Distribution** - Bar chart showing time spent at each dimension (0D-7D)

### 📋 Data Tables
- **Snapshot Progression** - Sample points showing memory, objects, modifications, dimension, pressure
- **Memory Growth Phases** - Analysis of 4 growth phases with rates and object changes

### 💾 Export
- Export analysis report as JSON
- Includes all statistics and progression data

## Usage

### Loading Snapshots

**Standalone Dashboard:**
1. Click file input
2. Select multiple snapshot JSON files (Ctrl+Click or Cmd+Click)
3. Click "Analyze Snapshots"

**Server-Based Dashboard:**
1. Enter path to `snapshots-memory` directory
2. Optionally set sample size (0 = all snapshots)
3. Click "Load Snapshots"

### Sample Data

Click "Load Sample Data" to see example visualization with 3 sample snapshots.

## Generating Snapshot List

For server-based dashboard, generate snapshot list file:

```bash
node generate-snapshot-list.js
```

This creates `.snapshot-list.json` in the `snapshots-memory/` directory.

## Dashboard Features

### Real-Time Analysis
- Processes snapshot files on-the-fly
- Calculates statistics dynamically
- Generates charts using Chart.js

### Visualizations
- **Memory Chart**: Shows memory usage over time with smooth line
- **Pressure Chart**: Visual distribution of memory pressure levels
- **Dimension Chart**: Bar chart showing dimension distribution

### Responsive Design
- Works on desktop and mobile
- Adaptive grid layout
- Interactive hover effects

## Technical Details

### Data Format

Snapshots are expected to have this structure:
```json
{
  "timestamp": 1762632118181,
  "isoTime": "2025-11-08T20:01:58.181Z",
  "memory": {
    "heapUsed": 8325024,
    "heapTotal": 11145216,
    "rss": 119828480
  },
  "automatonState": {
    "objectCount": 552,
    "selfModificationCount": 407,
    "currentDimension": 0
  },
  "reasoning": {
    "newObjects": 552,
    "newModifications": 407,
    "memoryDelta": 0,
    "memoryPressure": "low"
  }
}
```

### Calculations

- **Memory Volatility**: Standard deviation of memory deltas
- **Quality Score**: Weighted combination of active snapshots, memory efficiency, and stability
- **Growth Rate**: MB per second calculated from memory changes over time
- **Phase Analysis**: Divides snapshots into 4 phases and analyzes growth patterns

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Troubleshooting

### "No snapshots loaded"
- Ensure you've selected files (standalone) or entered correct path (server-based)
- Check that files are valid JSON
- Verify file names match pattern: `memory-snapshot-*.json`

### Charts not displaying
- Check browser console for errors
- Ensure Chart.js CDN is accessible
- Try refreshing the page

### Performance with large datasets
- Use sample size limit in server-based dashboard
- Select subset of files in standalone dashboard
- Charts automatically sample data for performance

## Related Documentation

- **`SNAPSHOT-ANALYSIS-TEST-RUN.md`** - Analysis results and recommendations
- **`README.md`** - Evolution logging system overview
- **`analyze-memory-snapshots.ts`** - Command-line analysis script
