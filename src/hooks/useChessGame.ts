import { useState, useCallback, useMemo } from "react";
import { Chess } from "chess.js";
import type { Square, Piece, MoveWithEval, PGNHeaders, GameResult } from "../types/chess";

interface GameState {
  position: Map<Square, Piece>;
  fen: string;
  moves: MoveWithEval[];
  currentMoveIndex: number;
  lastMove: { from: Square; to: Square } | null;
  turn: "w" | "b";
  isLoaded: boolean;
  headers: PGNHeaders;
  result: GameResult;
}

interface UseChessGameReturn extends GameState {
  loadPgn: (pgn: string) => boolean;
  goToMove: (index: number) => void;
  goToStart: () => void;
  goToEnd: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  reset: () => void;
}

function getPositionFromChess(chess: Chess): Map<Square, Piece> {
  const position = new Map<Square, Piece>();
  const board = chess.board();
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  board.forEach((row, rankIdx) => {
    row.forEach((piece, fileIdx) => {
      if (piece) {
        const square = `${files[fileIdx]}${ranks[rankIdx]}` as Square;
        position.set(square, { type: piece.type, color: piece.color });
      }
    });
  });

  return position;
}

/**
 * Parse PGN headers from the PGN string
 * Returns normalized headers with camelCase keys
 */
function parsePGNHeaders(pgn: string): PGNHeaders {
  const headers: PGNHeaders = {};
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match;

  while ((match = headerRegex.exec(pgn)) !== null) {
    const key = match[1];
    const value = match[2];
    
    // Normalize header keys to camelCase
    const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
    headers[normalizedKey] = value;
  }

  return headers;
}

/**
 * Extract result from PGN (from headers or move text)
 */
function extractResult(pgn: string, headers: PGNHeaders): GameResult {
  // First try headers
  if (headers.result && ["1-0", "0-1", "1/2-1/2", "*"].includes(headers.result)) {
    return headers.result as GameResult;
  }
  
  // Then try to find in the move text
  const resultMatch = pgn.match(/(1-0|0-1|1\/2-1\/2|\*)\s*$/);
  if (resultMatch) {
    return resultMatch[1] as GameResult;
  }
  
  return "*";
}

export function useChessGame(): UseChessGameReturn {
  const [chess] = useState(() => new Chess());
  const [moves, setMoves] = useState<MoveWithEval[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [headers, setHeaders] = useState<PGNHeaders>({});
  const [result, setResult] = useState<GameResult>("*");

  const gameChess = useMemo(() => {
    const game = new Chess();
    if (moves.length > 0 && currentMoveIndex >= 0) {
      for (let i = 0; i <= currentMoveIndex; i++) {
        game.move(moves[i].san);
      }
    }
    return game;
  }, [moves, currentMoveIndex]);

  const position = useMemo(
    () => getPositionFromChess(gameChess),
    [gameChess]
  );

  const lastMove = useMemo(() => {
    if (currentMoveIndex < 0 || !moves[currentMoveIndex]) return null;
    const move = moves[currentMoveIndex].move;
    return { from: move.from as Square, to: move.to as Square };
  }, [moves, currentMoveIndex]);

  const fen = useMemo(() => gameChess.fen(), [gameChess]);

  const loadPgn = useCallback((pgn: string): boolean => {
    try {
      // Clean up the PGN input
      const cleanedPgn = pgn.trim();
      chess.reset();
      
      // Parse headers first (before chess.js processes the PGN)
      const parsedHeaders = parsePGNHeaders(cleanedPgn);
      const gameResult = extractResult(cleanedPgn, parsedHeaders);
      
      // Try to load as full PGN first
      try {
        chess.loadPgn(cleanedPgn);
      } catch {
        // If that fails, try parsing as move list
        chess.reset();
        
        // Remove headers and comments for move parsing
        const moveText = cleanedPgn
          .replace(/\[[^\]]*\]/g, "") // Remove headers
          .replace(/\{[^}]*\}/g, "") // Remove comments
          .replace(/\([^)]*\)/g, "") // Remove variations
          .replace(/\d+\.\.\.\s*/g, " ") // Remove black move numbers (e.g., "1...")
          .replace(/\d+\.\s*/g, " ") // Remove move numbers
          .replace(/\s+/g, " ") // Normalize spaces
          .trim();
        
        const moveTokens = moveText.split(" ").filter((m) => m.length > 0);
        for (const token of moveTokens) {
          if (token && !["1-0", "0-1", "1/2-1/2", "*"].includes(token)) {
            chess.move(token);
          }
        }
      }

      const history = chess.history({ verbose: true });
      const parsedMoves: MoveWithEval[] = history.map((move) => {
        // Classifications will be set by the game analysis hook
        return {
          move,
          san: move.san,
          fen: "", // Will be set during analysis
          // No classification yet - will be computed by useGameAnalysis
        };
      });

      setMoves(parsedMoves);
      setHeaders(parsedHeaders);
      setResult(gameResult);
      setCurrentMoveIndex(-1);
      setIsLoaded(true);
      chess.reset();
      return true;
    } catch (error) {
      console.error("Failed to parse PGN:", error);
      return false;
    }
  }, [chess]);

  const goToMove = useCallback((index: number) => {
    setCurrentMoveIndex(Math.max(-1, Math.min(index, moves.length - 1)));
  }, [moves.length]);

  const goToStart = useCallback(() => {
    setCurrentMoveIndex(-1);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentMoveIndex(moves.length - 1);
  }, [moves.length]);

  const goToPrevious = useCallback(() => {
    setCurrentMoveIndex((prev) => Math.max(-1, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentMoveIndex((prev) => Math.min(moves.length - 1, prev + 1));
  }, [moves.length]);

  const reset = useCallback(() => {
    setMoves([]);
    setCurrentMoveIndex(-1);
    setIsLoaded(false);
    setHeaders({});
    setResult("*");
  }, []);

  return {
    position,
    fen,
    moves,
    currentMoveIndex,
    lastMove,
    turn: gameChess.turn(),
    isLoaded,
    headers,
    result,
    loadPgn,
    goToMove,
    goToStart,
    goToEnd,
    goToPrevious,
    goToNext,
    reset,
  };
}

