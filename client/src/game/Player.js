export default class Player {
  constructor(scene, id, x, y, color = 0x00ffcc) {
    this.id = id;
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player').setDepth(10);
    this.sprite.setScale(2);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.target = { x, y };
    this.speed = 30;
    this.speedMultiplier = 1; // 기본값
    this.lastDirection = 'down'; // 마지막 이동 방향
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
    const moveSpeed = this.speed * (this.speedMultiplier || 1) * 10;

    if (dist > 8) {
      const angle = Math.atan2(dy, dx);
      this.sprite.body.setVelocity(
        Math.cos(angle) * moveSpeed,
        Math.sin(angle) * moveSpeed
      );
      // 방향 판별
      if (Math.abs(dx) > Math.abs(dy)) {
        // 좌우 이동이 더 큼
        if (dx > 0) {
          this.sprite.anims.play('walk-right', true);
          this.lastDirection = 'right';
        } else {
          this.sprite.anims.play('walk-left', true);
          this.lastDirection = 'left';
        }
      } else {
        // 상하 이동이 더 큼
        if (dy > 0) {
          this.sprite.anims.play('walk-down', true);
          this.lastDirection = 'down';
        } else {
          this.sprite.anims.play('walk-up', true);
          this.lastDirection = 'up';
        }
      }
    } else {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.x = this.target.x;
      this.sprite.y = this.target.y;
      // 멈췄을 때 애니메이션 정지 + idle 프레임 고정
      this.sprite.anims.stop();
      this.sprite.setFrame(this.getIdleFrame(this.lastDirection));
    }
  }

  getIdleFrame(direction) {
    switch (direction) {
      case 'down': return 20;
      case 'left': return 28;
      case 'right': return 36;
      case 'up': return 44;
      default: return 20;
    }
  }
} 