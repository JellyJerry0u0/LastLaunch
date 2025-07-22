export default class Player {
  constructor(scene, id, x, y, color = 0x00ffcc) {
    this.id = id;
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, 40, 40, color).setDepth(10);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.target = { x, y };
    this.speed = 30;
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
    const moveSpeed = this.speed * (this.speedMultiplier || 1) * 10; // *10은 속도 단위 맞추기용, 필요시 조정
    if (dist > 8) { // 너무 가까우면 떨림 방지
      const angle = Math.atan2(dy, dx);
      this.sprite.body.setVelocity(
        Math.cos(angle) * moveSpeed,
        Math.sin(angle) * moveSpeed
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.x = this.target.x;
      this.sprite.y = this.target.y;
    }
  }
} 