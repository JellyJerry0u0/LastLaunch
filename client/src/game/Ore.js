export default class Ore {
  constructor(scene, id, x, y,hp, type, size = 40, color = 0xaaaaaae) {
    this.scene = scene;
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.hp = hp;
    this.type = type;
    this.createOre();
  }

  createOre() {
    this.graphics = this.scene.add.graphics();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillCircle(this.x, this.y, this.size);
    this.graphics.lineStyle(2, 0x888888, 1);
    this.graphics.strokeCircle(this.x, this.y, this.size);
  }
  hit(damage){
    this.hp-=damage;
    if(this.hp <= 0){
      this.destroy();
      return true;
    }
    return false;
  }
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
} 