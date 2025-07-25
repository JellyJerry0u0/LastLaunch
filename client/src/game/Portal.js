import socket from '../services/socket';
import { PORTAL_DEST_POSITION } from './constants';

export default class Portal {
  constructor(scene, id, x, y, radius, targetScene) {
    this.scene = scene;
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.targetScene = targetScene;
    this.enabled = true;
    this.graphics = this.scene.add.graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    this.graphics.fillStyle(this.enabled ? 0x3399ff : 0x888888, 1);
    this.graphics.fillCircle(this.x, this.y, this.radius);
    this.graphics.lineStyle(3, 0xffffff, 1);
    this.graphics.strokeCircle(this.x, this.y, this.radius);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.draw();
  }

  isPlayerInPortal(playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    return Math.hypot(dx, dy) < this.radius;
  }

  moveToTargetScene(playerId) {
    // 씬 이동에 필요한 데이터 추출
    if(this.enabled === false) {
      return;
    }
    const roomId = this.scene.roomId;
    const myId = this.scene.myId;
    const inventory = this.scene.inventory ? this.scene.inventory.items : undefined;
    console.log("moveToTargetScene in Portal, roomId : ", roomId, "whoId : ", playerId, "directionFrom : ", this.scene.scene.key + 'To' + this.targetScene, "inventory : ", inventory);
    // 씬 이동
    socket.emit('leave_scene', { roomId: roomId, userId: myId, scene: this.scene.scene.key});
    this.scene.scene.start(this.targetScene, {
      roomId,
      whoId: playerId,
      directionFrom: this.scene.scene.key + 'To' + this.targetScene,
      inventory
    });
  }

  // 같은 씬 내에서 플레이어 좌표만 이동
  moveWithinScene() {
    console.log("moveWithinScene in Portal, id : ", this.id);
    if (!this.scene.myPlayer || !this.scene.myPlayer.sprite) return;
    this.scene.myPlayer.sprite.x = PORTAL_DEST_POSITION[this.id].x;
    this.scene.myPlayer.sprite.y = PORTAL_DEST_POSITION[this.id].y;
    // 서버에 순간이동 이벤트 emit
    socket.emit('teleport', {
      roomId: this.scene.roomId,
      userId: this.scene.myId,
      scene: this.scene.scene.key,
      x: PORTAL_DEST_POSITION[this.id].x,
      y: PORTAL_DEST_POSITION[this.id].y
    });
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
} 