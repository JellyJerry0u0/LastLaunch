export default class House {
  constructor(scene, x, y, size = 120, color = 0x3399ff) { // 파란색
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.createHouse();
  }

  createHouse() {
    this.graphics = this.scene.add.graphics();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillRect(this.x, this.y, this.size, this.size);
  }
<<<<<<< HEAD

  isPlayerInRange(px, py) {
    return (
      px >= this.x && px <= this.x + this.size &&
      py >= this.y && py <= this.y + this.size
    );
  }
} 
=======
}
>>>>>>> origin/main
