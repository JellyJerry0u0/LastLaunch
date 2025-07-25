import Phaser from 'phaser';
import Player from '../Player';
import socket from '../../services/socket';
import { INITIAL_POSITION } from '../constants';
import Inventory from '../Inventory';
import CraftingTable from '../CraftingTable';
import Portal from '../Portal';
import { HOUSE_PORTAL_POSITION } from '../constants';


export default class HouseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HouseScene' });
    this.aKeyDown = false;
  }
  moveToMainMapScene(){
    socket.emit('leave_scene', { roomId: this.roomId, userId: this.myId, scene: 'HouseScene'});
    this.scene.start('MainMapScene', {
      whoId: this.myId,
      roomId: this.roomId,
      directionFrom: 'HouseScene',
      inventory: this.inventory ? this.inventory.items : undefined // 인벤토리 데이터 전달
    });
  }

  init(data) {
    const tileSize = 80;
    const boardSize = 10;
    const color1 = 0x666666;
    const color2 = 0x888888;
    const g = this.add.graphics();
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const color = (x + y) % 2 === 0 ? color1 : color2;
        g.fillStyle(color, 1);
        g.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    const portal = this.add.graphics();
    portal.fillStyle(0x3399ff, 1);
    portal.fillCircle(400, 400, 40);
    portal.lineStyle(3, 0xffffff, 1);
    portal.strokeCircle(400, 400, 40);
    const craftingTable = this.add.graphics();
    craftingTable.fillStyle(0xffd700, 1); // 노란색
    craftingTable.fillRect(685, 35, 80, 80);
    craftingTable.lineStyle(3, 0xffffff, 1);
    craftingTable.strokeRect(685, 35, 80, 80);  
    this.myId = data.whoId;
    console.log("myId in HouseScene : ", this.myId);
    this.roomId = data.roomId;
    this.directionFrom = data.directionFrom;
    this.players = {}; // 서버로 부터 받아옴
    this.items = data.inventory || new Array(5).fill(null); // 인벤토리 데이터 받기
    
    this.initialPosition = INITIAL_POSITION[this.directionFrom];
    this.players[this.myId] = new Player(this, this.myId, this.initialPosition.x, this.initialPosition.y, 0x00ffcc);
    this.myPlayer = this.players[this.myId];
    this.input.keyboard.on('keydown-A', () => { this.aKeyDown = true; });
    this.input.keyboard.on('keyup-A', () => { this.aKeyDown = false; });
    this.input.keyboard.on('keydown-S', () => { this.sKeyDown = true; });
    this.input.keyboard.on('keyup-S', () => { this.sKeyDown = false; });
    
    // 포탈 생성
    this.MainMapPortal = new Portal(this, "MainMapPortal_1", HOUSE_PORTAL_POSITION.MainMapPortal.x, HOUSE_PORTAL_POSITION.MainMapPortal.y, 40, 'MainMapScene');
    
  }

  create() {
    // === 체스판(체커보드) 배경 그리기 ===
    this.cameras.main.startFollow(this.players[this.myId].sprite);
    //여기서 기존의 플레이어들을 없애는 로직이 필요할수도?
    this.inventory = new Inventory(this); //인벤토리 생성
    this.craftingTable = new CraftingTable(this, this.cameras.main.centerX, this.cameras.main.centerY, this.inventory);
    
    // === 기존 플레이어 동기화 로직 ===
    socket.off('playersUpdate');
    socket.on('playersUpdate', ({ players }) => {
        Object.entries(players).forEach(([id, player]) => {
          if (!id || id === "undefined") return;
          if (!this.players[id]) {
            this.players[id] = new Player(this, id, player.x, player.y, id === this.myId ? 0x00ffcc : 0xffcc00);
          }
          // 내 캐릭터는 서버 값으로 target을 덮어쓰지 않는다!
          if (id !== this.myId) {
            this.players[id].target.x = player.destX;
            this.players[id].target.y = player.destY;
          }
        });
        Object.keys(this.players).forEach(id => {
          if (!players[id]) {
            this.players[id].sprite.destroy();
            delete this.players[id];
          }
        });
      });
    // === 마우스 클릭 시 내 캐릭터 이동 ===
    this.input.on('pointerdown', (pointer) => {
      if (this.players[this.myId]) {
        console.log("pointerdown in HouseScene, myId : ", this.myId);
        this.players[this.myId].setTarget(pointer.worldX, pointer.worldY);
        socket.emit('move', { roomId: this.roomId, userId: this.myId, scene: 'HouseScene', x: pointer.worldX, y: pointer.worldY });
      }
    });
    socket.emit('join_scene', { roomId: this.roomId, userId: this.myId, scene: 'HouseScene',position :this.initialPosition });
    // 인벤토리 생성 및 데이터 반영
    if (this.inventory) {
      this.inventory.items = this.items;
      this.inventory.updateAllSlots();
    }
  }

  update() {
    const dx = this.myPlayer.sprite.x - 400;
    const dy = this.myPlayer.sprite.y - 400;
    if(Math.hypot(dx, dy) < 40 && this.aKeyDown) {
        this.MainMapPortal.moveToTargetScene(this.myId);
    }
    // 제작대 근처에서 S키를 누르면 팝업 표시
    const tableX = 725, tableY = 75;
    const dist = Phaser.Math.Distance.Between(this.myPlayer.sprite.x, this.myPlayer.sprite.y, tableX, tableY);
    if (dist < 80 && this.sKeyDown) {
      this.craftingTable.show();
      this.sKeyDown = false;
    }
    Object.values(this.players).forEach(player => player.update());
  }
} 