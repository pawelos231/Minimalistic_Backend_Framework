export type Brick = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string
}

export interface Level {
    level: number
    levelName: string
    numberOfRows: number
    numberOfColumns: number
    lives: number
    timer: number
    bossLevel: boolean
    brickArray: Brick[]
    description: string
    highScore: number
    requiredScore: number
}