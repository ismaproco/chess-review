import { useState, useEffect, useCallback, useRef } from "react";
import type { EngineLine } from "../types/chess";

interface StockfishState {
  isReady: boolean;
  isAnalyzing: boolean;
  evaluation: number;
  mate: number | null;
  depth: number;
  engineLines: EngineLine[];
}

interface UseStockfishReturn extends StockfishState {
  analyze: (fen: string, options?: AnalyzeOptions) => void;
  stop: () => void;
}

interface AnalyzeOptions {
  depth?: number; // Max recommended: 18 for lite WASM build
  multiPv?: number;
}

// Stockfish engine path (served from public folder)
// Using lichess-org build which is optimized for web workers
const STOCKFISH_PATH = "/stockfish-lichess.js";

// Maximum analysis depth
const MAX_SAFE_DEPTH = 20;

/**
 * Parse UCI info line to extract evaluation data
 */
function parseInfoLine(line: string): Partial<{
  depth: number;
  score: number;
  mate: number | null;
  pv: string[];
  multiPv: number;
  seldepth: number;
  nodes: number;
  nps: number;
}> | null {
  if (!line.startsWith("info")) return null;
  
  // Skip info strings that don't have score (like "info string" messages)
  if (line.includes("info string")) return null;
  if (!line.includes(" pv ") && !line.includes("score")) return null;
  
  const result: Partial<{
    depth: number;
    score: number;
    mate: number | null;
    pv: string[];
    multiPv: number;
    seldepth: number;
    nodes: number;
    nps: number;
  }> = { mate: null };
  
  // Parse depth
  const depthMatch = line.match(/\bdepth\s+(\d+)/);
  if (depthMatch) {
    result.depth = parseInt(depthMatch[1], 10);
  }
  
  // Parse seldepth
  const seldepthMatch = line.match(/\bseldepth\s+(\d+)/);
  if (seldepthMatch) {
    result.seldepth = parseInt(seldepthMatch[1], 10);
  }
  
  // Parse multipv
  const multiPvMatch = line.match(/\bmultipv\s+(\d+)/);
  if (multiPvMatch) {
    result.multiPv = parseInt(multiPvMatch[1], 10);
  }
  
  // Parse nodes
  const nodesMatch = line.match(/\bnodes\s+(\d+)/);
  if (nodesMatch) {
    result.nodes = parseInt(nodesMatch[1], 10);
  }
  
  // Parse nps
  const npsMatch = line.match(/\bnps\s+(\d+)/);
  if (npsMatch) {
    result.nps = parseInt(npsMatch[1], 10);
  }
  
  // Parse score (centipawns or mate)
  const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
  if (cpMatch) {
    result.score = parseInt(cpMatch[1], 10);
  }
  
  const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
  if (mateMatch) {
    result.mate = parseInt(mateMatch[1], 10);
    // When mate is found, set an extreme score for sorting purposes
    result.score = result.mate > 0 ? 10000 : -10000;
  }
  
  // Parse principal variation (pv) - comes after all other fields
  const pvMatch = line.match(/\bpv\s+(.+)$/);
  if (pvMatch) {
    result.pv = pvMatch[1].trim().split(/\s+/);
  }
  
  return result;
}

/**
 * Hook to interact with Stockfish chess engine via Web Worker
 */
export function useStockfish(): UseStockfishReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingFenRef = useRef<string | null>(null);
  const optionsRef = useRef<AnalyzeOptions>({ depth: 20, multiPv: 3 });
  
  const [state, setState] = useState<StockfishState>({
    isReady: false,
    isAnalyzing: false,
    evaluation: 0,
    mate: null,
    depth: 0,
    engineLines: [],
  });
  
  // Store engine lines by multipv index during analysis
  const linesRef = useRef<Map<number, EngineLine>>(new Map());
  
  /**
   * Initialize the Stockfish worker
   */
  useEffect(() => {
    let worker: Worker | null = null;
    let isInitializing = true;
    
    function initWorker() {
      try {
        worker = new Worker(STOCKFISH_PATH);
        workerRef.current = worker;
        
        worker.onmessage = (event: MessageEvent<string>) => {
          const message = event.data;
          
          // Engine ready after UCI initialization
          if (message === "uciok") {
            // Set MultiPV for multiple lines
            worker?.postMessage(`setoption name MultiPV value ${optionsRef.current.multiPv ?? 3}`);
            worker?.postMessage("isready");
            return;
          }
          
          if (message === "readyok") {
            setState((prev) => ({ ...prev, isReady: true }));
            isInitializing = false;
            
            // If there's a pending analysis, start it
            if (pendingFenRef.current) {
              const fen = pendingFenRef.current;
              pendingFenRef.current = null;
              const depth = Math.min(optionsRef.current.depth ?? MAX_SAFE_DEPTH, MAX_SAFE_DEPTH);
              workerRef.current?.postMessage(`position fen ${fen}`);
              workerRef.current?.postMessage(`go depth ${depth}`);
              setState((prev) => ({ ...prev, isAnalyzing: true }));
            }
            return;
          }
          
          // Parse info lines for evaluation
          if (message.startsWith("info")) {
            const parsed = parseInfoLine(message);
            if (parsed && parsed.depth !== undefined && parsed.pv && parsed.pv.length > 0) {
              const multiPv = parsed.multiPv || 1;
              
              const engineLine: EngineLine = {
                id: multiPv,
                evaluation: {
                  score: parsed.score ?? 0,
                  mate: parsed.mate ?? null,
                  depth: parsed.depth,
                  bestMove: parsed.pv[0] || "",
                  pv: parsed.pv,
                },
                moves: parsed.pv,
              };
              
              linesRef.current.set(multiPv, engineLine);
              
              // Update state with all lines
              const lines = Array.from(linesRef.current.values())
                .sort((a, b) => a.id - b.id);
              
              // Main evaluation is from the best line (first PV)
              const mainLine = lines[0];
              
              setState((prev) => ({
                ...prev,
                depth: parsed.depth ?? prev.depth,
                evaluation: mainLine?.evaluation.score ?? prev.evaluation,
                mate: mainLine?.evaluation.mate ?? prev.mate,
                engineLines: lines,
              }));
            }
          }
          
          // Best move found - analysis complete
          if (message.startsWith("bestmove")) {
            setState((prev) => ({ ...prev, isAnalyzing: false }));
          }
        };
        
        worker.onerror = (error) => {
          console.error("Stockfish worker error:", error);
          // Keep the last successful evaluation, just mark as not analyzing
          setState((prev) => ({ 
            ...prev, 
            isReady: false, 
            isAnalyzing: false,
            // Preserve: evaluation, mate, depth, engineLines
          }));
          
          // Attempt to recover by reinitializing the worker
          console.log("Attempting to reinitialize Stockfish...");
          setTimeout(() => {
            if (workerRef.current) {
              try {
                workerRef.current.terminate();
              } catch {
                // Ignore termination errors
              }
              workerRef.current = null;
            }
            initWorker();
          }, 1000);
        };
        
        // Initialize UCI protocol
        worker.postMessage("uci");
        
      } catch (error) {
        console.error("Failed to initialize Stockfish:", error);
      }
    }
    
    initWorker();
    
    return () => {
      isInitializing = true;
      if (workerRef.current) {
        workerRef.current.postMessage("quit");
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  /**
   * Analyze a position given FEN
   * Note: Using refs to avoid dependency on changing state values
   */
  const analyze = useCallback((fen: string, options?: AnalyzeOptions) => {
    const worker = workerRef.current;
    
    if (options) {
      optionsRef.current = { ...optionsRef.current, ...options };
      
      // Update MultiPV if changed and engine is ready
      if (options.multiPv && worker) {
        worker.postMessage(`setoption name MultiPV value ${options.multiPv}`);
      }
    }
    
    // Stop any current analysis
    if (worker) {
      worker.postMessage("stop");
    }
    
    // Don't clear linesRef - keep showing previous results until new ones arrive
    // New results will overwrite the old ones via linesRef.set()
    
    // Queue the analysis for when the engine is ready
    pendingFenRef.current = fen;
    
    // Check if engine is ready via state getter pattern
    setState((prev) => {
      if (!prev.isReady) {
        // Engine not ready yet, will be handled when readyok is received
        return prev;
      }
      
      // Start new analysis (clamp depth to MAX_SAFE_DEPTH to prevent crashes)
      const depth = Math.min(optionsRef.current.depth ?? MAX_SAFE_DEPTH, MAX_SAFE_DEPTH);
      worker?.postMessage("ucinewgame");
      worker?.postMessage(`position fen ${fen}`);
      worker?.postMessage(`go depth ${depth}`);
      pendingFenRef.current = null;
      
      // Keep previous evaluation/lines visible until new results arrive
      return {
        ...prev,
        isAnalyzing: true,
        // Don't clear engineLines - they'll be replaced as new results come in
      };
    });
  }, []); // No dependencies - uses refs and setState callback
  
  /**
   * Stop the current analysis
   */
  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage("stop");
      setState((prev) => ({ ...prev, isAnalyzing: false }));
    }
  }, []);
  
  return {
    ...state,
    analyze,
    stop,
  };
}
