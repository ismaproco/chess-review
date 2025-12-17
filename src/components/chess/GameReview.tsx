import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ArrowPathIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import { ChessBoard } from "./ChessBoard";
import { EvaluationBar } from "./EvaluationBar";
import { EvaluationHistogram } from "./EvaluationHistogram";
import { MoveList } from "./MoveList";
import { EngineLines } from "./EngineLines";
import { GameInfo } from "./GameInfo";
import { useChessGame } from "../../hooks/useChessGame";
import { useStockfish } from "../../hooks/useStockfish";
import { useGameAnalysis } from "../../hooks/useGameAnalysis";

const EXAMPLE_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2025.12.11"]
[Round "?"]
[White "Grtze16"]
[Black "ismapro"]
[Result "0-1"]
[TimeControl "180"]
[WhiteElo "822"]
[BlackElo "828"]
[Termination "ismapro won by resignation"]
[ECO "C50"]
[EndTime "16:32:36 GMT+0000"]
[Link "https://www.chess.com/game/live/146591656944?move=0"]

1. e4 e5 2. Bc4 Nc6 3. Nf3 h6 4. O-O d6 5. Nc3 Be6 6. Bxe6 fxe6 7. d3 Nf6 8. Be3
d5 9. exd5 Nxd5 10. Nxd5 Qxd5 11. c4 Qd7 12. a4 a5 13. b3 b6 14. Re1 Bb4 15. Bd2
Bxd2 16. Qxd2 Nb4 17. Nxe5 Qd4 18. Re4 Qxa1+ 19. Re1 Qd4 20. Re3 Rd8 21. Re4
Qxe4 22. dxe4 Rxd2 23. h3 Nd3 24. f4 Nxe5 25. fxe5 Rf8 26. g4 Rd4 27. Kg2 Rxe4
0-1`;

export function GameReview(): React.ReactElement {
  const [pgnInput, setPgnInput] = useState(EXAMPLE_PGN);
  
  const {
    position,
    fen,
    moves,
    currentMoveIndex,
    lastMove,
    turn,
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
  } = useChessGame();

  const {
    isReady: engineReady,
    isAnalyzing: isLiveAnalyzing,
    evaluation: rawEvaluation,
    mate: rawMate,
    depth: engineDepth,
    engineLines: rawEngineLines,
    analyze,
    stop,
  } = useStockfish();

  const {
    analyzedMoves,
    progress: analysisProgress,
    analyzeGame,
    stopAnalysis,
  } = useGameAnalysis();

  // Use analyzed moves if available, otherwise use raw moves
  const displayMoves = analyzedMoves.length > 0 ? analyzedMoves : moves;

  // Get evaluation for current position from analyzed moves or live analysis
  const currentMoveEval = useMemo(() => {
    if (currentMoveIndex >= 0 && currentMoveIndex < analyzedMoves.length) {
      return analyzedMoves[currentMoveIndex]?.evaluation;
    }
    return null;
  }, [analyzedMoves, currentMoveIndex]);

  // Convert evaluation from side-to-move perspective to white's perspective
  // Stockfish returns positive = good for side to move
  // Our UI expects positive = good for white
  const evaluation = useMemo(() => {
    // Use cached evaluation from analysis if available
    if (currentMoveEval) {
      return currentMoveEval.score;
    }
    // Fall back to live analysis
    return turn === "w" ? rawEvaluation : -rawEvaluation;
  }, [currentMoveEval, rawEvaluation, turn]);

  const mate = useMemo(() => {
    // Use cached evaluation from analysis if available
    if (currentMoveEval) {
      return currentMoveEval.mate;
    }
    // Fall back to live analysis
    if (rawMate === null) return null;
    return turn === "w" ? rawMate : -rawMate;
  }, [currentMoveEval, rawMate, turn]);

  // Also convert engine lines to white's perspective
  const engineLines = useMemo(() => {
    if (turn === "w") return rawEngineLines;
    
    return rawEngineLines.map((line) => ({
      ...line,
      evaluation: {
        ...line.evaluation,
        score: -line.evaluation.score,
        mate: line.evaluation.mate !== null ? -line.evaluation.mate : null,
      },
    }));
  }, [rawEngineLines, turn]);

  // Start full game analysis when game is loaded
  useEffect(() => {
    if (isLoaded && moves.length > 0) {
      analyzeGame(moves);
    }
  }, [isLoaded, moves, analyzeGame]);

  // Trigger live analysis when position changes (for current position lines)
  useEffect(() => {
    if (isLoaded && engineReady && fen) {
      analyze(fen, { depth: 20, multiPv: 3 });
    }
  }, [fen, isLoaded, engineReady, analyze]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      stopAnalysis();
    };
  }, [stop, stopAnalysis]);

  const handleLoadGame = useCallback(() => {
    stopAnalysis(); // Stop any ongoing analysis
    loadPgn(pgnInput);
  }, [loadPgn, pgnInput, stopAnalysis]);

  const handleReset = useCallback(() => {
    stopAnalysis();
    reset();
  }, [reset, stopAnalysis]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoaded) return;
      
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          goToStart();
          break;
        case "ArrowDown":
          e.preventDefault();
          goToEnd();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoaded, goToPrevious, goToNext, goToStart, goToEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl">♔</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chess Review</h1>
              <p className="text-xs text-stone-400">Analyze your games</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!isLoaded ? (
          /* Input Screen */
          <div className="max-w-2xl mx-auto">
            <div className="bg-stone-800/50 rounded-xl border border-stone-700 p-6 shadow-2xl">
              <h2 className="text-lg font-semibold mb-4 text-stone-200">
                Enter your game moves
              </h2>
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder="Paste PGN or move list here... (e.g., 1. e4 e5 2. Nf3 Nc6)"
                className="w-full h-48 bg-stone-900 border border-stone-600 rounded-lg p-4 text-sm font-mono text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleLoadGame}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-semibold transition-all shadow-lg hover:shadow-amber-500/25"
                >
                  <PlayIcon className="w-5 h-5" />
                  Analyze Game
                </button>
              </div>
              <p className="mt-4 text-xs text-stone-500">
                Tip: You can paste a full PGN or just the moves. Standard algebraic notation is supported.
              </p>
            </div>
          </div>
        ) : (
          /* Review Screen */
          <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_280px] lg:grid-cols-[auto_1fr] gap-6">
            {/* Board Section */}
            <div className="flex gap-3">
              {/* Evaluation Bar */}
              <div className="h-[min(80vw,480px)] sm:h-[480px]">
                <EvaluationBar evaluation={evaluation} mate={mate} />
              </div>

              {/* Chess Board */}
              <div className="w-[min(80vw,480px)] sm:w-[480px]">
                <ChessBoard position={position} lastMove={lastMove} />
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* Navigation Controls */}
              <div className="flex items-center justify-between bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                <div className="flex items-center gap-1">
                  <NavButton onClick={goToStart} title="Go to start (↑)">
                    <ChevronDoubleLeftIcon className="w-5 h-5" />
                  </NavButton>
                  <NavButton onClick={goToPrevious} title="Previous move (←)">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </NavButton>
                  <NavButton onClick={goToNext} title="Next move (→)">
                    <ChevronRightIcon className="w-5 h-5" />
                  </NavButton>
                  <NavButton onClick={goToEnd} title="Go to end (↓)">
                    <ChevronDoubleRightIcon className="w-5 h-5" />
                  </NavButton>
                </div>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  New Analysis
                </button>
              </div>

              {/* Engine Lines */}
              <EngineLines 
                lines={engineLines} 
                isAnalyzing={isLiveAnalyzing} 
                engineReady={engineReady}
                depth={engineDepth}
                fen={fen}
              />

              {/* Move List */}
              <div className="flex-1 bg-stone-800/50 rounded-lg border border-stone-700 min-h-[200px] max-h-[300px]">
                <MoveList
                  moves={displayMoves}
                  currentMoveIndex={currentMoveIndex}
                  onMoveClick={goToMove}
                />
              </div>

              {/* Evaluation Histogram */}
              <EvaluationHistogram
                moves={displayMoves}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={goToMove}
              />

              {/* Analysis Progress / Move Counter */}
              <div className="bg-stone-800/30 rounded-lg p-3 border border-stone-700/50">
                {analysisProgress.isAnalyzing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-400">
                        Analyzing move {analysisProgress.currentMove} of {analysisProgress.totalMoves}...
                      </span>
                      <span className="text-stone-500 text-xs">
                        {Math.round((analysisProgress.currentMove / analysisProgress.totalMoves) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-700 rounded-full h-1.5">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(analysisProgress.currentMove / analysisProgress.totalMoves) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-400">
                      Move {currentMoveIndex + 1} of {moves.length}
                      {analysisProgress.isComplete && (
                        <span className="ml-2 text-green-500 text-xs">✓ Analysis complete</span>
                      )}
                    </span>
                    <span className="text-stone-500 text-xs">
                      Use arrow keys to navigate
                    </span>
                  </div>
                )}
              </div>

              {/* Game Info for smaller screens */}
              <div className="xl:hidden">
                <GameInfo headers={headers} result={result} />
              </div>
            </div>

            {/* Game Info Sidebar for large screens */}
            <div className="hidden xl:block">
              <GameInfo headers={headers} result={result} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface NavButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function NavButton({ onClick, title, children }: NavButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
    >
      {children}
    </button>
  );
}

