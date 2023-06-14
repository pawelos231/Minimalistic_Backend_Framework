export type Brick = {
  rowNumber: number;
  columnNumber: number;
  color: string;
  timesToHit: number;
  points: number;
  buffDropRate: number;
};

export interface Level {
  level: number;
  levelName: string;
  numberOfRows: number;
  numberOfColumns: number;
  lives: number;
  timer: number;
  bossLevel: boolean;
  brickArray: Brick[];
  description: string;
  highScore: number;
  requiredScore: number;
}
