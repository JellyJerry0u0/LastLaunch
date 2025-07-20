export default class Mine {
  constructor(scene, x, y, size = 100, color = 0x888888) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.isActive = true;
    
    this.createMine();
  }

  createMine() {
    // 광산 그래픽 생성
    this.graphics = this.scene.add.graphics();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillRect(this.x, this.y, this.size, this.size);
    this.graphics.lineStyle(2, 0x000000, 1);
    this.graphics.strokeRect(this.x, this.y, this.size, this.size);
    
    // 광산 내부 장식 (곡괭이 모양 등)
    this.graphics.fillStyle(0x444444, 1);
    this.graphics.fillRect(this.x + 20, this.y + 20, this.size - 40, this.size - 40);
  }

  // 플레이어가 광산 영역에 있는지 확인
  isPlayerInRange(playerX, playerY) {
    return playerX >= this.x && playerX <= this.x + this.size &&
           playerY >= this.y && playerY <= this.y + this.size;
  }

  // 광산 비활성화 (이미 사용됨)
  deactivate() {
    this.isActive = false;
  }

  // 광산 재활성화
  reactivate() {
    this.isActive = true;
    this.graphics.clearTint();
  }

  // 광산 제거
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
} 