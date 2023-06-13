import { useEffect, useState } from "react";
import "./App.css";
import _ from "lodash";
import { Group, Layer, Line, Rect, Shape, Stage } from "react-konva";

enum Compass {
  NORTH = 1,
  EAST,
  SOUTH,
  WEST,
}

interface ICell {
  x: number;
  y: number;
  walls: number;
  visited: boolean;
  id: string;
}

class Maze {
  cells: ICell[][] = [];
  stack: ICell[] = [];
  constructor(public size = 32) {
    for (let y = 0; y < this.size; y++) {
      this.cells.push([]);
      for (let x = 0; x < this.size; x++) {
        this.cells[y].push({ x, y, walls: 1 + 2 + 4 + 8, visited: false, id: `${y}_${x}` });
      }
    }
  }
  reset() {
    this.cells.forEach((row) =>
      row.forEach((cell) => {
        (cell.walls = 1 + 2 + 4 + 8), (cell.visited = false);
      })
    );
    this.stack = [];
  }
  getNeighbors(x: number, y: number) {
    const neighbors: (ICell | undefined)[] = [undefined, undefined, undefined, undefined];
    if (y > 0) neighbors[0] = this.cells[y - 1][x];
    if (x < this.size - 1) neighbors[1] = this.cells[y][x + 1];
    if (y < this.size - 1) neighbors[2] = this.cells[y + 1][x];
    if (x > 0) neighbors[3] = this.cells[y][x - 1];
    return neighbors;
  }
  removeWall(cell: ICell, direction: number) {
    cell.walls = cell.walls & ~(1 << direction);
  }
  generate() {
    this.generateStart();
    while (this.stack.length > 0) {
      this.generateStep();
    }
    return this.cells;
  }
  generateStart() {
    this.cells[0][0].visited = true;
    this.stack.push(this.cells[0][0]);
  }
  generateStep() {
    const cell = this.stack.pop()!;
    const neighbors = this.getNeighbors(cell.x, cell.y);
    const emptyNeighbors = neighbors.flatMap((n, i) => (n && !n.visited ? i : []));
    if (emptyNeighbors.length > 0) {
      this.stack.push(cell);

      const selectedNeighbor = emptyNeighbors[_.random(0, emptyNeighbors.length - 1)];
      const oppositeDirection = (selectedNeighbor + 2) % 4;

      const neighborCell = neighbors[selectedNeighbor];
      if (!neighborCell) throw Error();

      this.removeWall(neighborCell, oppositeDirection);
      this.removeWall(cell, selectedNeighbor);
      neighborCell.visited = true;
      this.stack.push(neighborCell);
    }
    return this.cells;
  }
}

const MAZE_SIZE_PX = 600;
const MAZE_DIM_CELLS = 32;
const CELL_SIZE_PX = MAZE_SIZE_PX / MAZE_DIM_CELLS;

const drawCell = (cell: ICell) => {
  if (!cell.visited) return undefined;
  if (cell.walls & Compass.NORTH) {
    if (cell.walls & Compass.EAST) {
      return <Line key={`${cell.id}_NE`} points={[0, 0, CELL_SIZE_PX, 0, CELL_SIZE_PX, CELL_SIZE_PX]} stroke="black"></Line>;
    } else
      return (
        <Line x={cell.x * CELL_SIZE_PX} y={cell.y * CELL_SIZE_PX} points={[0, 0, CELL_SIZE_PX, 0]} stroke="black" key={`${cell.id}_N`}></Line>
      );
  } else if (cell.walls & Compass.EAST)
    return (
      <Line
        x={cell.x * CELL_SIZE_PX}
        y={cell.y * CELL_SIZE_PX}
        points={[CELL_SIZE_PX, 0, CELL_SIZE_PX, CELL_SIZE_PX]}
        stroke="black"
        key={`${cell.id}_E`}></Line>
    );
};

const drawCell2 = (cell: ICell) => {
  if (!cell.visited) return undefined;
  return (
    <Shape
      sceneFunc={(context, shape) => {
        if (cell.walls & Compass.NORTH) {
          context.moveTo(0, 0);
          context.lineTo(CELL_SIZE_PX, 0);
          context.stroke();
        }
        if (cell.walls & Compass.EAST) {
          context.moveTo(CELL_SIZE_PX, 0);
          context.lineTo(CELL_SIZE_PX, CELL_SIZE_PX);
          context.stroke();
        }
        if (cell.walls & 4) {
          context.moveTo(CELL_SIZE_PX, CELL_SIZE_PX);
          context.lineTo(0, CELL_SIZE_PX);
          context.stroke();
        }
        if (cell.walls & 8) {
          context.moveTo(0, CELL_SIZE_PX);
          context.lineTo(0, 0);
          context.stroke();
        }
      }}
      stroke="black"
      fill="white"
      x={cell.x * CELL_SIZE_PX}
      y={cell.y * CELL_SIZE_PX}
      key={cell.id}></Shape>
  );
};

const drawCell3 = (cell: ICell) => {
  if (!cell.visited) return undefined;
  return (
    <Group x={cell.x * CELL_SIZE_PX} y={cell.y * CELL_SIZE_PX} key={cell.id}>
      {maze.stack.find((c) => c.id == cell.id) ? (
        <Rect x={0} y={0} width={CELL_SIZE_PX} height={CELL_SIZE_PX} fill="lightblue"></Rect>
      ) : undefined}
      {cell.walls & Compass.NORTH ? <Line points={[0, 0, CELL_SIZE_PX, 0]} stroke="black"></Line> : undefined}
      {cell.walls & Compass.EAST ? <Line points={[CELL_SIZE_PX, 0, CELL_SIZE_PX, CELL_SIZE_PX]} stroke="black"></Line> : undefined}
      {cell.walls & 4 ? <Line points={[CELL_SIZE_PX, CELL_SIZE_PX, 0, CELL_SIZE_PX]} stroke="black"></Line> : undefined}
      {cell.walls & 8 ? <Line points={[0, CELL_SIZE_PX, 0, 0]} stroke="black"></Line> : undefined}
    </Group>
  );
};

const drawStackCell = (cell: ICell) => {
  return <Rect x={cell.x * CELL_SIZE_PX + 3} y={cell.y * CELL_SIZE_PX + 3}></Rect>;
};

const maze = new Maze();

function App() {
  const [cells, setCells] = useState<ICell[][]>([]);

  useEffect(() => {
    maze.generateStart();
    const interval = setInterval(() => {
      // setCells(generateMaze(makethis.cells(32)));
      setCells([...maze.generateStep()]);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <Stage width={600} height={600}>
      <Layer>
        <Rect x={0} y={0} width={600} height={600} stroke="black"></Rect>
        {cells.map((row) => row.map((cell) => drawCell3(cell)))}
        {/* {maze.stack.map((cell) => drawStackCell(cell))} */}
      </Layer>
    </Stage>
  );

  // return <this.cells templateColumns="repeat(32, 1fr)">{cells.map((row) => row.map((cell) => makeCell(cell)))}</this.cells>;
}

export default App;
