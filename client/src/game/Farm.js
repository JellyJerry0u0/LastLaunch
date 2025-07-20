export default class Farm {
  constructor(scene, x = 3000, y = 0, size = 600, color = 0x90EE90) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.portalSize = 80; // 포탈 크기
    this.portalX = this.x + this.size / 2 - this.portalSize / 2;
    this.portalY = this.y + this.size - this.portalSize - 20; // 농장 하단 중앙
    this.isActive = false;
    this.createFarm();
  }

  createFarm() {
    // 농장 그래픽 생성
    this.graphics = this.scene.add.graphics();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillRect(this.x, this.y, this.size, this.size);
    this.graphics.lineStyle(2, 0x228B22, 1);
    this.graphics.strokeRect(this.x, this.y, this.size, this.size);
    // 농장 내부 장식 (작물 모양)
    this.graphics.fillStyle(0x32CD32, 1);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.graphics.fillCircle(
          this.x + 100 + i * 120,
          this.y + 100 + j * 120,
          18
        );
      }
    }
    this.graphics.setVisible(false);
    // 포탈 그리기
    this.portal = this.scene.add.graphics();
    this.portal.fillStyle(0x0000ff, 1);
    this.portal.fillCircle(this.portalX + this.portalSize/2, this.portalY + this.portalSize/2, this.portalSize/2);
    this.portal.setVisible(false);
  }

  activate() {
    this.isActive = true;
    this.graphics.setVisible(true);
    if (this.portal) this.portal.setVisible(true);
  }
  deactivate() {
    this.isActive = false;
    this.graphics.setVisible(false);
    if (this.portal) this.portal.setVisible(false);
  }

  // 포탈 범위 체크
  isPlayerInPortal(playerX, playerY) {
    const dx = playerX - (this.portalX + this.portalSize/2);
    const dy = playerY - (this.portalY + this.portalSize/2);
    return Math.sqrt(dx*dx + dy*dy) < this.portalSize/2;
  }

  // 농장 제거
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.portal) {
      this.portal.destroy();
    }
  }
} 