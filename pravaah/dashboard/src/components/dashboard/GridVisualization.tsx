/**
 * Pravaah Dashboard — Grid Visualization Component
 *
 * Displays an 8x8 grid of crowd movement cells with regime-based coloring.
 */

import { REGIME_CONFIG } from '@/types/domain';

interface CellFeatures {
  row: number;
  col: number;
  density: number;
  velocity: number;
  regime: 'FLOWING' | 'STOP_AND_GO' | 'TURBULENT';
}

interface GridVisualizationProps {
  cells: CellFeatures[];
  gridSize?: number;
}

export default function GridVisualization({
  cells,
  gridSize = 8,
}: GridVisualizationProps) {
  return (
    <div
      className="grid gap-px bg-cyan/5 p-4 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {Array.from({ length: gridSize * gridSize }).map((_, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const cell = cells.find((c) => c.row === row && c.col === col);
        const cellCfg = cell ? REGIME_CONFIG[cell.regime] : REGIME_CONFIG.FLOWING;
        const opacity = cell ? cell.density * 0.8 : 0.1;

        return (
          <div
            key={i}
            className="rounded-sm transition-all duration-300"
            style={{
              backgroundColor: cellCfg.color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
