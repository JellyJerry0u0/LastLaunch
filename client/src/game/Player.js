import socket from '../services/socket';

export default class Player {
  constructor(scene, id, x, y, color = 0x00ffcc) {
    this.id = id;
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player').setDepth(10);
    this.sprite;
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.target = { x, y };
    this.speed = 10;
    this.speedMultiplier = 1; // 기본값
    this.lastDirection = 'down'; // 마지막 이동 방향
    // console.log("Player constructor : ", this.id, this.scene, this.sprite, this.target, this.speed);
  }

  setTarget(x, y) {
    this.target.x = x;
    this.target.y = y;
  }
  useGloveSkill(players) {
    // 1. 글러브 이펙트 생성
    const offset = 40 * this.sprite.scale; // 캐릭터 앞 거리
    let gloveX = this.sprite.x, gloveY = this.sprite.y;
    let dx = 0, dy = 0;
    switch (this.lastDirection) {
      case 'down': dy = offset; break;
      case 'up': dy = -offset; break;
      case 'left': dx = -offset; break;
      case 'right': dx = offset; break;
    }
    gloveX += dx;
    gloveY += dy;

    // 글러브 스프라이트 생성 (glove.png는 미리 preload 필요)
    const glove = this.scene.add.sprite(gloveX, gloveY, 'glove').setDepth(20);
    glove.setDisplaySize(64, 64);
    // 방향에 따라 flipX만 조정, angle은 0으로 고정
    if (this.lastDirection === 'left') {
      glove.setFlipX(true);
      glove.angle = 0;
    } else if (this.lastDirection === 'right') {
      glove.setFlipX(false);
      glove.angle = 0;
    } else if (this.lastDirection === 'up') {
      glove.setFlipX(false);
      glove.angle = -90;
    }
    else if (this.lastDirection === 'down'){
      glove.setFlipX(false);
      glove.angle = 90;
    }

    // 0.2초 후 글러브 제거
    this.scene.time.delayedCall(200, () => glove.destroy());

    // 2. 앞에 있는 플레이어 판별 및 3. 서버에 밀어내기 이벤트 emit
    players.forEach(other => {
      if (other === this) return;
      const dist = Phaser.Math.Distance.Between(gloveX, gloveY, other.sprite.x, other.sprite.y);
      if (dist < 40) {
        // 서버에 gloveSkill 이벤트 emit
        socket.emit('gloveSkill', {
          roomId: this.scene.roomId,
          scene: this.scene.scene.key,
          fromId: this.id,
          toId: other.id,
          direction: this.lastDirection
        });
      }
    });
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