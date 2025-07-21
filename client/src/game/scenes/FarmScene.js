import Phaser from 'phaser';
import Player from '../Player';
import socket from '../../services/socket';
import { INITIAL_POSITION } from '../constants';
import Ore from '../Ore';
import Inventory from '../Inventory';
import Item from '../Item';

export default class FarmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FarmScene' });
    this.aKeyDown = false;
    this.sKeyDown = false;
  }
  moveToMainMapScene(){
    socket.emit('leave_scene', { roomId: this.roomId, userId: this.myId, scene: 'FarmScene'});
    this.scene.start('MainMapScene', {
      whoId: this.myId,
      roomId: this.roomId,
      directionFrom: 'FarmScene',
      inventory: this.inventory ? this.inventory.items : undefined // 인벤토리 데이터 전달
    });
  }

  spawnOre(){
    const ore = new Ore(this, Math.random() * 1000, Math.random() * 1000);
    this.ores.push(ore);
    
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
    this.myId = data.whoId;
    console.log("myId in FarmScene : ", this.myId);
    this.roomId = data.roomId;
    this.directionFrom = data.directionFrom;
    this.players = {}; // 서버로 부터 받아옴
    this.items = []; 
    this.myInventory = data.inventory || new Array(5).fill(null); // 인벤토리 데이터 받기
    this.ores = [];
    this.initialPosition = INITIAL_POSITION[this.directionFrom];
    this.players[this.myId] = new Player(this, this.myId, this.initialPosition.x, this.initialPosition.y, 0x00ffcc);
    this.myPlayer = this.players[this.myId];
    this.input.keyboard.on('keydown-A', () => { this.aKeyDown = true; });
    this.input.keyboard.on('keyup-A', () => { this.aKeyDown = false; });
    this.input.keyboard.on('keydown-S', () => { this.sKeyDown = true; });
    this.input.keyboard.on('keyup-S', () => { this.sKeyDown = false; });
  }

  preload() {
    this.load.image('iron', '/assets/iron.png');
    // 필요시 다른 광물도 preload
  }

  create() {
    // === 체스판(체커보드) 배경 그리기 ===
    this.cameras.main.startFollow(this.players[this.myId].sprite);
    //여기서 기존의 플레이어들을 없애는 로직이 필요할수도?
    // === 기존 플레이어 동기화 로직 ===
    socket.off('roomOresGet');
    socket.on('roomOresGet', (ores) => {
      console.log("roomOresGet in FarmScene, ores: ", ores);
      // 기존 오브젝트 제거
      this.ores.forEach(ore => ore.destroy());
      // 새로 생성
      this.ores = ores.map(ore => new Ore(this, ore.id, ore.x, ore.y, ore.hp, ore.type));
    });
    socket.off('oresUpdate');
    socket.on('oresUpdate', (ores) => {
      // 기존 오브젝트 제거
      this.ores.forEach(ore => ore.destroy());
      // 새로 생성
      this.ores = ores.map(ore => new Ore(this, ore.id, ore.x, ore.y, ore.hp, ore.type));
    });
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
    socket.off('itemsUpdate');
    socket.on('itemsUpdate', (items) => {
      // 기존 아이템 오브젝트 제거
      this.items.forEach(item => {
        if (item) item.destroy()});
      // 새로 생성
      this.items = items.map(item => new Item(this, item.id, item.x, item.y, item.type, item.amount));
      socket.off('oreCollected');
      socket.on('oreCollected', (data) => {
        console.log('oreCollected 수신:', data);
        this.inventory.addItem({
          type: data.type,
          name: data.name,
          imageKey: data.imageKey
        });
      });

    });
    this.inventory = new Inventory(this); //인벤토리 생성
    
    // === 마우스 클릭 시 내 캐릭터 이동 ===
    this.input.on('pointerdown', (pointer) => {
      if (this.players[this.myId]) {
        console.log("pointerdown in FarmScene, myId : ", this.myId);
        this.players[this.myId].setTarget(pointer.worldX, pointer.worldY);
        socket.emit('move', { roomId: this.roomId, userId: this.myId, scene: 'FarmScene', x: pointer.worldX, y: pointer.worldY });
      }
    });
    socket.emit('join_scene', { roomId: this.roomId, userId: this.myId, scene: 'FarmScene',position :this.initialPosition });
    // 인벤토리 생성 및 데이터 반영
    if (this.inventory) {
      this.inventory.items = this.myInventory;
      this.inventory.updateAllSlots();
    }
  }

  update() {

    if (this.sKeyDown) {
      const myX = this.myPlayer.sprite.x;
      const myY = this.myPlayer.sprite.y;
      this.ores.forEach((ore, idx) => {
        const dist = Phaser.Math.Distance.Between(myX, myY, ore.x, ore.y);
        if (dist < ore.size + 20 && ore.hp > 0) { // 근처(광석 반지름+20) 이내
          console.log("oreHit in FarmScene, oreId : ", ore.id);
          socket.emit('oreHit', { roomId: this.roomId, scene: 'FarmScene', oreId: ore.id, damage: 1 });
        }
      });
      this.items.forEach((item, idx) => {
        if (!item) return;
        const dist = Phaser.Math.Distance.Between(myX, myY, item.x, item.y);
        if (dist < 20 + 20) {
          //서버에 아이템 획득 요청
          socket.emit('itemPick', { roomId: this.roomId, scene: 'FarmScene', itemId: item.id });
        }})
      this.sKeyDown = false; // 한 번만 닳게 하려면
    }
    const dx = this.myPlayer.sprite.x - 400;
    const dy = this.myPlayer.sprite.y - 400;
    if(Math.hypot(dx, dy) < 40 && this.aKeyDown) {
        this.moveToMainMapScene();
    }
    Object.values(this.players).forEach(player => player.update());
  }
} 