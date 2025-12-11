import type { Square, PieceSymbol, Color, Move } from "chess.js";

export type { Square, PieceSymbol, Color, Move };

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

export interface SquareInfo {
  square: Square;
  piece: Piece | null;
  isLight: boolean;
  isHighlighted: boolean;
  isLastMove: boolean;
}

export interface EngineEvaluation {
  score: number; // Centipawns from white's perspective, positive = white advantage
  mate: number | null; // Mate in X moves, positive = white mates, negative = black mates
  depth: number;
  bestMove: string;
  pv: string[]; // Principal variation (best line)
}

export interface EngineLine {
  id: number;
  evaluation: EngineEvaluation;
  moves: string[];
}

export interface MoveWithEval {
  move: Move;
  san: string;
  fen: string;
  evaluation?: EngineEvaluation;
  classification?: MoveClassification;
}

export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed_win";

/**
 * Standard PGN headers plus common extensions from chess.com, lichess, etc.
 */
export interface PGNHeaders {
  // Required Seven Tag Roster (STR)
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white?: string;
  black?: string;
  result?: string;
  
  // Common optional headers
  whiteElo?: string;
  blackElo?: string;
  timeControl?: string;
  termination?: string;
  eco?: string; // Encyclopedia of Chess Openings code
  opening?: string;
  
  // Platform-specific
  link?: string;
  endTime?: string;
  startTime?: string;
  
  // Catch-all for any other headers
  [key: string]: string | undefined;
}

export type GameResult = "1-0" | "0-1" | "1/2-1/2" | "*";

export interface GameData {
  pgn: string;
  moves: MoveWithEval[];
  headers: PGNHeaders;
  result: GameResult;
}

/**
 * Parse time control string into readable format
 * e.g., "180" -> "3 min", "600+5" -> "10+5"
 */
export function formatTimeControl(timeControl?: string): string {
  if (!timeControl) return "Unknown";
  
  // Handle "180" format (seconds)
  if (/^\d+$/.test(timeControl)) {
    const seconds = parseInt(timeControl);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  
  // Handle "600+5" format (base+increment)
  const match = timeControl.match(/^(\d+)\+(\d+)$/);
  if (match) {
    const baseMinutes = Math.floor(parseInt(match[1]) / 60);
    const increment = parseInt(match[2]);
    return `${baseMinutes}+${increment}`;
  }
  
  return timeControl;
}

/**
 * Format date from PGN format (YYYY.MM.DD) to readable format
 */
export function formatPGNDate(date?: string): string {
  if (!date || date === "????.??.??") return "Unknown date";
  
  const parts = date.split(".");
  if (parts.length !== 3) return date;
  
  const [year, month, day] = parts;
  
  // Handle unknown parts
  if (month === "??" || day === "??") {
    return year !== "????" ? year : "Unknown date";
  }
  
  try {
    const dateObj = new Date(`${year}-${month}-${day}`);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

/**
 * Get time control category
 */
export function getTimeControlCategory(timeControl?: string): string {
  if (!timeControl) return "Unknown";
  
  // Extract base time in seconds
  let baseSeconds: number;
  const incrementMatch = timeControl.match(/^(\d+)\+(\d+)$/);
  
  if (incrementMatch) {
    baseSeconds = parseInt(incrementMatch[1]);
  } else if (/^\d+$/.test(timeControl)) {
    baseSeconds = parseInt(timeControl);
  } else {
    return "Custom";
  }
  
  // Categories based on estimated game duration
  const estimatedMinutes = baseSeconds / 60;
  
  if (estimatedMinutes < 3) return "Bullet";
  if (estimatedMinutes < 10) return "Blitz";
  if (estimatedMinutes < 30) return "Rapid";
  return "Classical";
}

