export default class Item {
  constructor(scene, id, x, y, type = 'iron', amount = 1) {
    this.scene = scene;
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.amount = amount;
    this.createItem();
  }

  createItem() {
    this.graphics = this.scene.add.graphics();
    // 타입별 색상 예시
    let color = 0xffd700; // 기본 노란색
    if (this.type === 'iron') color = 0xaaaaaa;
    if (this.type === 'gold') color = 0xffd700;
    if (this.type === 'diamond') color = 0x00ffff;
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(this.x, this.y, 20);
    this.graphics.lineStyle(2, 0x888888, 1);
    this.graphics.strokeCircle(this.x, this.y, 20);
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
} 