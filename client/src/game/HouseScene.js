import Phaser from 'phaser';

export default class HouseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HouseScene' });
  }

  create() {
    // 집 내부 공간(사각형) 그리기
    const roomX = 100;
    const roomY = 100;
    const roomWidth = 600;
    const roomHeight = 400;
    const roomColor = 0x222288;
    const g = this.add.graphics();
    g.fillStyle(roomColor, 1);
    g.fillRect(roomX, roomY, roomWidth, roomHeight);

    // 플레이어(임시로 '나'만) 방 안에 원으로 표시
    const playerRadius = 30;
    const playerX = roomX + roomWidth / 2;
    const playerY = roomY + roomHeight / 2;
    g.fillStyle(0x00ffcc, 1);
    g.fillCircle(playerX, playerY, playerRadius);
    this.add.text(playerX - 20, playerY - 10, '나', { fontSize: '24px', fill: '#fff' });

    // 나가기 버튼
    const exitButton = this.add.text(roomX + roomWidth - 100, roomY + roomHeight + 20, '나가기', { fontSize: '28px', fill: '#ff0', backgroundColor: '#333', padding: { x: 20, y: 10 } })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MainScene');
      });
  }
} 