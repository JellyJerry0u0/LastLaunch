// client/src/game/Map.js

const GAME_WIDTH = 2500;
const GAME_HEIGHT = 2500;
const TILE_SIZE = 80;

export default class GameMap {
  constructor(scene) {
    this.scene = scene;
    this.createBase();
  }

  createBase() {
    const g = this.scene.add.graphics();
    for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
      for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
        const isEven = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
        g.fillStyle(isEven ? 0x333333 : 0x0, 1);
        g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
} 