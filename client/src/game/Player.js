import socket from '../services/socket';

export default class Player {
  constructor(scene, id, x, y, color = 0x00ffcc, spriteKey = 'player') {
    this.id = id;
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, spriteKey).setDepth(10);
    this.sprite.setVisible(false); // 처음엔 숨김
    this.sprite.setFrame(20);      // idle 프레임 지정
    this.sprite.setVisible(true);  // 바로 보이게
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.target = { x, y };
    this.speed = 10;
    this.speedMultiplier = 1; // 기본값
    this.lastDirection = 'down'; // 마지막 이동 방향
    this.isKnockback = false;
    this.deathCount = 0; // 데스카운트
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

  showGloveEffect(direction) {
    const offset = 40 * this.sprite.scale;
    let gloveX = this.sprite.x, gloveY = this.sprite.y;
    let dx = 0, dy = 0;
    switch (direction) {
      case 'down': dy = offset; break;
      case 'up': dy = -offset; break;
      case 'left': dx = -offset; break;
      case 'right': dx = offset; break;
    }
    gloveX += dx;
    gloveY += dy;

    const glove = this.scene.add.sprite(gloveX, gloveY, 'glove').setDepth(20);
    glove.setDisplaySize(64, 64);
    if (direction === 'left') {
      glove.setFlipX(true);
      glove.angle = 0;
    } else if (direction === 'right') {
      glove.setFlipX(false);
      glove.angle = 0;
    } else if (direction === 'up') {
      glove.setFlipX(false);
      glove.angle = -90;
    } else if (direction === 'down') {
      glove.setFlipX(false);
      glove.angle = 90;
    }
    this.scene.time.delayedCall(200, () => glove.destroy());
  }

  startKnockback(direction) {
    if (this.isKnockback) return;
    this.isKnockback = true;
    const knockbackDistance = 150;
    const knockbackDuration = 350;
    const arcHeight = 30;

    // 스프라이트시트 사용 제거: 텍스처 변경 없이 기존 player 텍스처만 사용
    // (필요하다면, 맞은 방향에 따라 setFrame만 변경 가능)

    let dx = 0, dy = 0;
    switch (direction) {
      case 'left': dx = -knockbackDistance; break;
      case 'right': dx = knockbackDistance; break;
      case 'up': dy = -knockbackDistance; break;
      case 'down': dy = knockbackDistance; break;
    }

    const originX = this.sprite.x;
    const originY = this.sprite.y;
    const destX = originX + dx;
    const destY = originY + dy;

    this.scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: knockbackDuration,
      ease: 'Linear',
      onUpdate: (tween, target) => {
        const t = target.t;
        this.sprite.x = originX + (destX - originX) * t;
        this.sprite.y = originY + (destY - originY) * t - ( -4 * arcHeight * (t - 0.5) * (t - 0.5) + arcHeight );
      },
      onComplete: () => {
        // 넉백 끝나면 idle 프레임으로 복귀
        this.sprite.setFrame(this.getIdleFrame(this.lastDirection));
        socket.emit('knockbackEnd', {
          roomId: this.scene.roomId,
          scene: this.scene.scene.key,
          id: this.id,
          x: this.sprite.x,
          y: this.sprite.y
        });
        this.target.x = this.sprite.x;
        this.target.y = this.sprite.y;
      }
    });
  }

  update() {
    if (this.isKnockback) return;
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
          this.sprite.anims.play(`walk-right-${this.id}`, true);
          this.lastDirection = 'right';
        } else {
          this.sprite.anims.play(`walk-left-${this.id}`, true);
          this.lastDirection = 'left';
        }
      } else {
        // 상하 이동이 더 큼
        if (dy > 0) {
          this.sprite.anims.play(`walk-down-${this.id}`, true);
          this.lastDirection = 'down';
        } else {
          this.sprite.anims.play(`walk-up-${this.id}`, true);
          this.lastDirection = 'up';
        }
      }
    } else {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.x = this.target.x;
      this.sprite.y = this.target.y;
      // 멈췄을 때 애니메이션 정지 + idle 프레임 고정
      const idleKey = `idle-${this.lastDirection}-${this.id}`;
      if (this.sprite.anims.currentAnim?.key !== idleKey) {
        this.sprite.anims.play(idleKey, true);
      }
    }
  }

  getIdleFrame(direction) {
    // 각 캐릭터별로 idle 프레임이 다를 수 있으나, 기본적으로 walk 애니메이션의 첫 프레임 사용
    switch (direction) {
      case 'down': return 20;
      case 'left': return 28;
      case 'right': return 36;
      case 'up': return 44;
      default: return 20;
    }
  }

  // 죽었을 때 반투명+깜빡임 효과 (1초)
  showDeathBlinkEffect() {
    const sprite = this.sprite;
    let blinkCount = 0;
    const blinkTotal = 8; // 1초 동안 8번 깜빡임
    const blinkInterval = 125; // ms
    const blink = () => {
      if (blinkCount >= blinkTotal) {
        sprite.setAlpha(1);
        return;
      }
      sprite.setAlpha(blinkCount % 2 === 0 ? 0.3 : 0.7);
      blinkCount++;
      setTimeout(blink, blinkInterval);
    };
    blink();
  }
} 