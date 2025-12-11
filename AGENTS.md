# AGENTS.md - AI Agent Guidelines

## Project Overview

**Chess Review** is a web application for analyzing and reviewing chess games. Built with a modern React stack using Vite as the build tool.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.0 | UI library with concurrent features |
| TypeScript | ~5.9.3 | Type-safe development |
| Vite | ^7.1.7 | Build tool and dev server |
| Tailwind CSS | ^4.1.16 | Utility-first CSS framework |
| ESLint | ^9.36.0 | Code linting |

## Project Structure

```
chess-review/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles with Tailwind directives
│   └── vite-env.d.ts    # Vite type declarations
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config (references app & node configs)
├── tsconfig.app.json    # TypeScript config for app code
├── tsconfig.node.json   # TypeScript config for Node/Vite config
├── postcss.config.js    # PostCSS configuration
└── eslint.config.js     # ESLint configuration
```

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (http://localhost:5173) |
| `pnpm build` | Build for production (outputs to `dist/`) |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint to check code quality |

## Code Conventions

### TypeScript
- Use strict TypeScript configuration
- Prefer explicit type annotations for function parameters and return types
- Use interfaces for object shapes, types for unions/primitives

### React
- Use functional components exclusively
- Prefer named exports for components
- Keep components small and focused on a single responsibility
- Use React 19 features where appropriate

### File Naming
- React components: `PascalCase.tsx` (e.g., `ChessBoard.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useGameAnalysis.ts`)
- Types: `types.ts` or colocated in component files

### Imports
- Use absolute imports where configured
- Group imports: React → external packages → internal modules → styles

## Styling Guidelines

### Tailwind CSS
- Use Tailwind utility classes for all styling
- Avoid inline styles and custom CSS unless absolutely necessary
- Use Tailwind's design system (spacing, colors, typography)
- Leverage Tailwind CSS v4 features

### UI Components
- Prefer Hero Icons (`@heroicons/react`) over inline SVGs
- Build responsive layouts by default (mobile-first)
- Use semantic HTML elements

## Architecture Recommendations

When building features for this chess review application, consider:

### Suggested Directory Structure (as project grows)
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Generic UI components (buttons, inputs, etc.)
│   └── chess/          # Chess-specific components (board, pieces, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
├── types/              # TypeScript type definitions
├── pages/              # Page-level components (if using routing)
└── stores/             # State management (if needed)
```

### Chess-Specific Considerations
- Use standard chess notation (PGN, FEN) for game data
- Consider existing chess libraries (e.g., `chess.js`) for game logic
- Implement a modular board component that can be reused

## Testing

No testing framework is currently configured. When adding tests, consider:
- Vitest for unit testing (integrates well with Vite)
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

## Performance

- Use React 19's concurrent features for heavy computations
- Lazy load routes/components as the application grows
- Optimize chess board rendering (many squares = many elements)

## Environment

- Node.js 20.x or higher required
- pnpm is the preferred package manager

