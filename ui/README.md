# Automaton UI

Phase 1 implementation of the user interface for the Self-Referencing JSONL Automaton system.

## Features Implemented

### ✅ Core Components
- **Dashboard**: Real-time status monitoring with dimensional progression
- **DimensionalCanvas**: Interactive 8D topology visualization with D3.js
- **ControlPanel**: Manual action execution and parameter controls
- **WebSocket Integration**: Real-time updates from automaton backend
- **TypeScript Architecture**: Full type safety with comprehensive interfaces

### ✅ Key Features
- Real-time status monitoring (iterations, self-modifications, objects)
- Interactive dimensional visualization (0D-7D progression)
- Manual action execution with all 8 automaton actions
- Dynamic parameter adjustment (interval, max iterations)
- Dimension jumping capabilities
- WebSocket connection management
- Error handling and status indicators
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+
- Automaton backend running on port 8080

### Installation
```bash
cd ui
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Architecture

### Components Structure
```
src/
├── components/
│   ├── Dashboard/           # Real-time status monitoring
│   ├── DimensionalCanvas/   # 8D topology visualization
│   └── ControlPanel/        # Action execution controls
├── hooks/
│   ├── useAutomatonState.ts  # State management
│   └── useExecutionHistory.ts # History tracking
├── services/
│   ├── api.ts              # REST API client
│   └── websocket.ts        # WebSocket client
└── types/
    └── index.ts            # TypeScript definitions
```

### Technology Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **D3.js** for data visualization
- **Lucide React** for icons

## Backend Integration

The UI expects a backend API running on `localhost:8080` with the following endpoints:

### REST API
- `GET /api/status` - Current automaton state
- `POST /api/automaton/start` - Start execution
- `POST /api/automaton/stop` - Stop execution
- `POST /api/automaton/action` - Execute action
- `POST /api/automaton/dimension` - Set dimension

### WebSocket
- `ws://localhost:8080/ws` - Real-time updates

## Next Steps

### Phase 2: Advanced Features
- Self-reference analysis tools
- Execution history visualization
- Agent chat interface
- Configuration management

### Phase 3: Visualization
- Quantum state visualization
- Advanced animations
- Interactive canvas manipulation

## Design System

### Color Scheme
- **0D**: Indigo (#6366f1)
- **1D**: Purple (#8b5cf6)
- **2D**: Pink (#ec4899)
- **3D**: Rose (#f43f5e)
- **4D**: Orange (#f97316)
- **5D**: Yellow (#eab308)
- **6D**: Green (#22c55e)
- **7D**: Cyan (#06b6d4)

### Animations
- Smooth transitions between states
- Pulsing status indicators
- Hover effects on interactive elements
- Glow effects for active dimensions

## Contributing

1. Follow the established component structure
2. Use TypeScript for all new code
3. Maintain responsive design principles
4. Test with different screen sizes
5. Ensure accessibility standards

## License

MIT License - see LICENSE file for details