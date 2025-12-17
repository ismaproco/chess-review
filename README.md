# Chess Review

A modern web application for analyzing and reviewing chess games with real-time Stockfish engine evaluation.

![Chess Review](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Stockfish](https://img.shields.io/badge/Stockfish-17-green)

## Features

- ♟️ **PGN Import** - Paste any PGN game or move list for instant analysis
- 🧠 **Stockfish Analysis** - Real-time position evaluation powered by Stockfish WASM
- 📊 **Multi-PV Lines** - View top 3 engine variations with evaluations
- 📈 **Evaluation Histogram** - Visual graph showing evaluation across the entire game
- ⬛ **Interactive Board** - Beautiful chessboard with last move highlighting
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate through moves
- 🎨 **Modern UI** - Dark theme with elegant gradients and smooth animations

## Screenshots

The application features:
- A sidebar evaluation bar showing position advantage
- Engine analysis panel with multiple principal variations
- Move list with color-coded evaluations (brilliant, good, inaccuracy, mistake, blunder)
- Game evaluation histogram for quick game overview

## Prerequisites

- Node.js 20.x or higher
- pnpm (recommended) or npm

## Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/ismaproco/chess-review.git
cd chess-review
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Start development server**

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Paste a PGN game or move list (e.g., `1. e4 e5 2. Nf3 Nc6`)
3. Click "Analyze Game" to start the analysis
4. Navigate through moves using:
   - **← / →** - Previous / Next move
   - **↑ / ↓** - Jump to start / end of game
5. View engine evaluation, best lines, and position assessments

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint to check code quality |

## Project Structure

```
chess-review/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   ├── index.css                  # Global styles with Tailwind
│   ├── components/
│   │   └── chess/
│   │       ├── ChessBoard.tsx     # Interactive chessboard
│   │       ├── ChessPiece.tsx     # Individual chess piece
│   │       ├── EngineLines.tsx    # Stockfish analysis lines
│   │       ├── EvaluationBar.tsx  # Side evaluation bar
│   │       ├── EvaluationHistogram.tsx  # Game evaluation graph
│   │       ├── GameInfo.tsx       # Game metadata display
│   │       ├── GameReview.tsx     # Main review screen
│   │       └── MoveList.tsx       # Move notation list
│   ├── hooks/
│   │   ├── useChessGame.ts        # Game state management
│   │   ├── useGameAnalysis.ts     # Full game analysis
│   │   └── useStockfish.ts        # Stockfish Web Worker integration
│   └── types/
│       └── chess.ts               # TypeScript definitions
├── public/
│   └── stockfish-lichess.js       # Stockfish WASM engine
└── ...config files
```

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.0 | UI library with concurrent features |
| TypeScript | ~5.9.3 | Type-safe development |
| Vite | ^7.1.7 | Build tool and dev server |
| Tailwind CSS | ^4.1.16 | Utility-first CSS framework |
| chess.js | ^1.4.0 | Chess game logic and PGN parsing |
| Stockfish | ^17.1.0 | Chess engine (WASM) |
| Hero Icons | ^2.2.0 | SVG icon library |

## How It Works

### Engine Integration

The application uses the Stockfish chess engine compiled to WebAssembly, running in a Web Worker for non-blocking UI. Key features:

- **UCI Protocol** - Standard Universal Chess Interface communication
- **Multi-PV Analysis** - Displays multiple best lines (configurable)
- **Depth Control** - Analysis runs up to depth 20 for optimal performance
- **Automatic Recovery** - Worker reinitializes on errors

### Game Analysis

When you load a game:
1. The PGN is parsed using chess.js
2. Each position is queued for Stockfish analysis
3. Evaluations are cached and displayed in the move list
4. An evaluation histogram shows the game's progression

## Development

This project uses:
- **ESLint** with TypeScript and React plugins for code quality
- **PostCSS** with Tailwind CSS v4 for styling
- **Strict TypeScript** configuration for type safety

## Building for Production

```bash
pnpm build
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## License

MIT © Isma Jim

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
