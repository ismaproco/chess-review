import { useState, useCallback, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import type { MoveWithEval, MoveClassification, EngineEvaluation } from "../types/chess";

// Cache for position evaluations (FEN -> evaluation)
const evaluationCache = new Map<string, EngineEvaluation>();

interface AnalysisProgress {
  currentMove: number;
  totalMoves: number;
  isAnalyzing: boolean;
  isComplete: boolean;
}

interface UseGameAnalysisReturn {
  analyzedMoves: MoveWithEval[];
  progress: AnalysisProgress;
  analyzeGame: (moves: MoveWithEval[]) => void;
  stopAnalysis: () => void;
  getEvaluationForMove: (moveIndex: number) => EngineEvaluation | null;
}

// Analysis depth for move classification
const ANALYSIS_DEPTH = 16;

/**
 * Classify a move based on evaluation change
 * evalBefore: evaluation before the move (from side to move's perspective)
 * evalAfter: evaluation after the move (from opponent's perspective, so negated)
 */
function classifyMove(
  evalBefore: EngineEvaluation,
  evalAfter: EngineEvaluation,
  bestMoveWasPlayed: boolean
): MoveClassification {
  // Handle mate scenarios
  if (evalBefore.mate !== null && evalAfter.mate === null) {
    // Had forced mate, lost it
    return "blunder";
  }
  
  if (evalAfter.mate !== null && evalBefore.mate === null) {
    // Found a mate that wasn't there before
    if (evalAfter.mate > 0) {
      return "brilliant";
    }
    // Allowed opponent to have mate
    return "blunder";
  }
  
  if (evalBefore.mate !== null && evalAfter.mate !== null) {
    // Both positions have mate
    if (evalBefore.mate > 0 && evalAfter.mate < 0) {
      // Had mate for us, now opponent has mate
      return "blunder";
    }
    if (evalBefore.mate < 0 && evalAfter.mate > 0) {
      // Opponent had mate, now we have mate (shouldn't happen normally)
      return "brilliant";
    }
  }
  
  // Calculate centipawn loss
  // evalAfter is from opponent's perspective, so negate it for comparison
  const scoreBefore = evalBefore.score;
  const scoreAfter = -evalAfter.score; // Negate because it's opponent's turn
  const cpLoss = scoreBefore - scoreAfter;
  
  // If this was the best move
  if (bestMoveWasPlayed) {
    if (cpLoss <= 0) {
      return "best";
    }
  }
  
  // Classify based on centipawn loss
  if (cpLoss <= 10) {
    return bestMoveWasPlayed ? "best" : "excellent";
  }
  if (cpLoss <= 25) {
    return "good";
  }
  if (cpLoss <= 50) {
    return "good";
  }
  if (cpLoss <= 100) {
    return "inaccuracy";
  }
  if (cpLoss <= 200) {
    return "mistake";
  }
  return "blunder";
}

/**
 * Hook to analyze an entire game with Stockfish
 */
export function useGameAnalysis(): UseGameAnalysisReturn {
  const [analyzedMoves, setAnalyzedMoves] = useState<MoveWithEval[]>([]);
  const [progress, setProgress] = useState<AnalysisProgress>({
    currentMove: 0,
    totalMoves: 0,
    isAnalyzing: false,
    isComplete: false,
  });
  
  const workerRef = useRef<Worker | null>(null);
  const analysisQueueRef = useRef<{ fen: string; moveIndex: number; moveSan: string }[]>([]);
  const movesRef = useRef<MoveWithEval[]>([]);
  const resolveAnalysisRef = useRef<((eval_: EngineEvaluation) => void) | null>(null);
  const isStoppedRef = useRef(false);
  
  // Initialize worker
  useEffect(() => {
    const worker = new Worker("/stockfish-lichess.js");
    workerRef.current = worker;
    
    let currentDepth = 0;
    let currentEval: EngineEvaluation = {
      score: 0,
      mate: null,
      depth: 0,
      bestMove: "",
      pv: [],
    };
    
    worker.onmessage = (event: MessageEvent<string>) => {
      const message = event.data;
      
      if (message === "uciok") {
        worker.postMessage("isready");
        return;
      }
      
      if (message === "readyok") {
        return;
      }
      
      // Parse info lines
      if (message.startsWith("info") && message.includes(" pv ")) {
        const depthMatch = message.match(/\bdepth\s+(\d+)/);
        const cpMatch = message.match(/\bscore\s+cp\s+(-?\d+)/);
        const mateMatch = message.match(/\bscore\s+mate\s+(-?\d+)/);
        const pvMatch = message.match(/\bpv\s+(.+)$/);
        
        if (depthMatch) {
          const depth = parseInt(depthMatch[1], 10);
          if (depth >= currentDepth) {
            currentDepth = depth;
            currentEval.depth = depth;
            
            if (cpMatch) {
              currentEval.score = parseInt(cpMatch[1], 10);
              currentEval.mate = null;
            }
            if (mateMatch) {
              currentEval.mate = parseInt(mateMatch[1], 10);
              currentEval.score = currentEval.mate > 0 ? 10000 : -10000;
            }
            if (pvMatch) {
              const pv = pvMatch[1].trim().split(/\s+/);
              currentEval.pv = pv;
              currentEval.bestMove = pv[0] || "";
            }
          }
        }
      }
      
      // Best move found - analysis complete for this position
      if (message.startsWith("bestmove")) {
        if (resolveAnalysisRef.current) {
          resolveAnalysisRef.current({ ...currentEval });
          resolveAnalysisRef.current = null;
        }
        currentDepth = 0;
        currentEval = {
          score: 0,
          mate: null,
          depth: 0,
          bestMove: "",
          pv: [],
        };
      }
    };
    
    worker.postMessage("uci");
    
    return () => {
      worker.postMessage("quit");
      worker.terminate();
    };
  }, []);
  
  /**
   * Analyze a single position
   */
  const analyzePosition = useCallback((fen: string): Promise<EngineEvaluation> => {
    return new Promise((resolve) => {
      // Check cache first
      const cached = evaluationCache.get(fen);
      if (cached) {
        resolve(cached);
        return;
      }
      
      const worker = workerRef.current;
      if (!worker) {
        resolve({
          score: 0,
          mate: null,
          depth: 0,
          bestMove: "",
          pv: [],
        });
        return;
      }
      
      resolveAnalysisRef.current = (eval_) => {
        evaluationCache.set(fen, eval_);
        resolve(eval_);
      };
      
      worker.postMessage("ucinewgame");
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${ANALYSIS_DEPTH}`);
    });
  }, []);
  
  /**
   * Analyze the entire game
   */
  const analyzeGame = useCallback(async (moves: MoveWithEval[]) => {
    if (moves.length === 0) return;
    
    isStoppedRef.current = false;
    movesRef.current = [...moves];
    
    setProgress({
      currentMove: 0,
      totalMoves: moves.length,
      isAnalyzing: true,
      isComplete: false,
    });
    
    const chess = new Chess();
    const analyzedMovesResult: MoveWithEval[] = [];
    
    // Analyze starting position
    const startFen = chess.fen();
    let prevEval = await analyzePosition(startFen);
    
    // Analyze each move
    for (let i = 0; i < moves.length; i++) {
      if (isStoppedRef.current) break;
      
      const move = moves[i];
      const fenBefore = chess.fen();
      
      // Get evaluation before the move (if not already have it)
      if (i > 0) {
        prevEval = evaluationCache.get(fenBefore) || prevEval;
      }
      
      // Make the move
      chess.move(move.san);
      const fenAfter = chess.fen();
      
      // Get evaluation after the move
      const evalAfter = await analyzePosition(fenAfter);
      
      if (isStoppedRef.current) break;
      
      // Check if the played move was the best move
      // Convert UCI move to match (e.g., "e2e4" matches "e4")
      const bestMoveUci = prevEval.bestMove;
      const playedMoveUci = `${move.move.from}${move.move.to}${move.move.promotion || ""}`;
      const bestMoveWasPlayed = bestMoveUci === playedMoveUci;
      
      // Adjust evaluation perspective based on who moved
      // prevEval is from the perspective of the side that just moved
      // evalAfter is from the perspective of the opponent (after the move)
      const classification = classifyMove(prevEval, evalAfter, bestMoveWasPlayed);
      
      // Store evaluation AFTER the move from white's perspective for display
      // evalAfter is from the opponent's perspective (the side to move after this move)
      // If it's now black's turn (white just moved), evalAfter is from black's perspective → negate
      // If it's now white's turn (black just moved), evalAfter is from white's perspective → keep as is
      const isWhiteToMoveNow = move.move.color === "w"; // white moved, so now it's black's turn
      const evalFromWhite: EngineEvaluation = {
        ...evalAfter,
        // If white just moved (black to move now), negate to get white's perspective
        score: isWhiteToMoveNow ? -evalAfter.score : evalAfter.score,
        mate: isWhiteToMoveNow && evalAfter.mate !== null ? -evalAfter.mate : evalAfter.mate,
      };
      
      analyzedMovesResult.push({
        ...move,
        fen: fenAfter,
        evaluation: evalFromWhite,
        classification,
      });
      
      // Update for next iteration
      prevEval = evalAfter;
      
      setProgress({
        currentMove: i + 1,
        totalMoves: moves.length,
        isAnalyzing: true,
        isComplete: false,
      });
      
      // Update moves as we go so UI updates progressively
      setAnalyzedMoves([...analyzedMovesResult]);
    }
    
    if (!isStoppedRef.current) {
      setProgress({
        currentMove: moves.length,
        totalMoves: moves.length,
        isAnalyzing: false,
        isComplete: true,
      });
    }
  }, [analyzePosition]);
  
  /**
   * Stop the current analysis
   */
  const stopAnalysis = useCallback(() => {
    isStoppedRef.current = true;
    if (workerRef.current) {
      workerRef.current.postMessage("stop");
    }
    setProgress((prev) => ({
      ...prev,
      isAnalyzing: false,
    }));
  }, []);
  
  /**
   * Get evaluation for a specific move
   */
  const getEvaluationForMove = useCallback((moveIndex: number): EngineEvaluation | null => {
    if (moveIndex < 0 || moveIndex >= analyzedMoves.length) {
      return null;
    }
    return analyzedMoves[moveIndex]?.evaluation || null;
  }, [analyzedMoves]);
  
  return {
    analyzedMoves,
    progress,
    analyzeGame,
    stopAnalysis,
    getEvaluationForMove,
  };
}

/**
 * Get cached evaluation for a FEN position
 */
export function getCachedEvaluation(fen: string): EngineEvaluation | null {
  return evaluationCache.get(fen) || null;
}

/**
 * Clear the evaluation cache
 */
export function clearEvaluationCache(): void {
  evaluationCache.clear();
}

