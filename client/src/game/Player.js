export default class Player {
  constructor(scene, id, x, y, color = 0x00ffcc) {
    this.id = id;
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 40, 40, color).setDepth(10);
    scene.physics.add.existing(this.sprite);
    this.sprite.setCollideWorldBounds(true);
    this.target = { x, y };
    this.speed = 6;
    this.speedMultiplier = 1; // 기본값
    // console.log("Player constructor : ", this.id, this.scene, this.sprite, this.target, this.speed);
  }

  setTarget(x, y) {
    this.target.x = x;
    this.target.y = y;
  }

  update() {
    const dx = this.target.x - this.sprite.x;
    const dy = this.target.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const moveSpeed = this.speed * (this.speedMultiplier || 1);
    if (dist > moveSpeed) {
      this.sprite.x += (dx / dist) * moveSpeed;
      this.sprite.y += (dy / dist) * moveSpeed;
    } else {
      this.sprite.x = this.target.x;
      this.sprite.y = this.target.y;
    }
  }
} 