export default class Player {
  constructor(scene, id, x, y, color = 0x00ffcc) {
    this.id = id;
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 40, 40, color);
    scene.physics.add.existing(this.sprite);
    this.target = { x, y };
    this.speed = 6;
    console.log("Player constructor : ", this.id, this.scene, this.sprite, this.target, this.speed);
  }

  setTarget(x, y) {
    this.target.x = x;
    this.target.y = y;
  }

  update() {
    const dx = this.target.x - this.sprite.x;
    const dy = this.target.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.speed) {
      this.sprite.x += (dx / dist) * this.speed;
      this.sprite.y += (dy / dist) * this.speed;
    } else {
      this.sprite.x = this.target.x;
      this.sprite.y = this.target.y;
    }
  }
} 