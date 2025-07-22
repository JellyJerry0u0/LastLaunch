import Phaser from 'phaser';
import Player from '../Player';
import socket from '../../services/socket';
import { INITIAL_POSITION } from '../constants';
import { MAIN_MAP_PORTAL_POSITION } from '../constants';
import Inventory from '../Inventory';
import { SkillBar } from '../SkillBar';
import Portal from '../Portal';

export default class MainMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMapScene' });
    this.aKeyDown = false;
  }
  moveToFarmScene(){
    socket.emit('leave_scene', { roomId: this.roomId, userId: this.myId, scene: 'MainMapScene'});
    this.scene.start('FarmScene', {
      roomId: this.roomId,
      whoId: this.myId,
      directionFrom: 'MainMapSceneToFarmScene',
      inventory: this.inventory ? [...this.inventory.items] : new Array(5).fill(null)
    });
  }
  moveToHouseScene(){
    socket.emit('leave_scene', { roomId: this.roomId, userId: this.myId, scene: 'MainMapScene'});
    this.scene.start('HouseScene', {
      roomId: this.roomId,
      whoId: this.myId,
      directionFrom: 'MainMapSceneToHouseScene',
      inventory: this.inventory ? [...this.inventory.items] : new Array(5).fill(null)
    });
  }

  init(data) {
    const tileSize = 80;
    const boardSize = 10;
    const color1 = 0x333333;
    const color2 = 0x888888;
    const g = this.add.graphics();
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const color = (x + y) % 2 === 0 ? color1 : color2;
        g.fillStyle(color, 1);
        g.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    this.myId = data.whoId;
    console.log("myId in MainMapScene : ", this.myId);
    this.roomId = data.roomId;
    this.directionFrom = data.directionFrom;
    this.players = {}; // 서버로 부터 받아옴
    this.items = data.inventory || new Array(5).fill(null); // 인벤토리 데이터 받기
    
    this.initialPosition = INITIAL_POSITION[this.directionFrom];
    this.players[this.myId] = new Player(this, this.myId, this.initialPosition.x, this.initialPosition.y, 0x00ffcc);
    this.myPlayer = this.players[this.myId];
    // === 포탈 상태 요청 및 핸들러 등록 ===
    socket.emit('requestPortalStatus', { roomId: this.roomId });
    socket.off('portalStatus');
    socket.on('portalStatus', ({ portals }) => {
      if (this.FarmPortal) {
        if (portals && portals.FarmPortal_1 === false) this.FarmPortal.setEnabled(false);
        else this.FarmPortal.setEnabled(true);
      }
      if (this.HousePortal) {
        if (portals && portals.HousePortal_1 === false) this.HousePortal.setEnabled(false);
        else this.HousePortal.setEnabled(true);
      }
    });
  }

  preload() {
    this.load.tilemapTiledJSON('map', '/assets/helloMap.tmj');
    this.load.image('test', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Tileset Grass.png');
    this.load.image('wall', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Tileset Wall.png');
    this.load.image('object', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Props.png');
    this.load.spritesheet('player', '/assets/RACCOONSPRITESHEET.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('glove','/assets/Punch.png');    
    this.load.spritesheet('raccoon_hurt', '/assets/raccoon_hurt.png', { frameWidth: 32, frameHeight: 32 });
    }

  create() {
    this.anims.create({
        key: 'walk-down',
        frames: this.anims.generateFrameNumbers('player', { start: 20, end: 27 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'walk-left',
        frames: this.anims.generateFrameNumbers('player', { start: 28, end: 35 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'walk-right',
        frames: this.anims.generateFrameNumbers('player', { start: 36, end: 43 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'walk-up',
        frames: this.anims.generateFrameNumbers('player', { start: 44, end: 51 }),
        frameRate: 10,
        repeat: -1
    })

    this.physics.world.setBounds(0, 0, 1000, 1000);

    const map = this.make.tilemap({ key: 'map' });

  // 타일셋 이름과 이미지 키를 정확히 일치시켜야 함
    const wallset = map.addTilesetImage('wall', 'wall');
    const objectset = map.addTilesetImage('object', 'object');
    const tileset = map.addTilesetImage('test', 'test');

    // 레이어 이름도 정확히 일치시켜야 함
    map.createLayer('grass_layer', tileset, 0, 0).setDepth(0);
    map.createLayer('wall_layer', wallset, 0, 0).setDepth(0);
    const propLayer = map.createLayer('prop_layer', objectset, 0, 0).setDepth(0);
    propLayer.setCollisionByExclusion([-1]);
    this.physics.add.collider(this.players[this.myId].sprite, propLayer);
    
    // === 체스판(체커보드) 배경 그리기 ===
    this.cameras.main.startFollow(this.players[this.myId].sprite);

    //포탈 생성 및 초기화
    this.FarmPortal = new Portal(this, "FarmPortal_1", MAIN_MAP_PORTAL_POSITION.FarmPortal.x, MAIN_MAP_PORTAL_POSITION.FarmPortal.y, 40, 'FarmScene');
    this.HousePortal = new Portal(this, "HousePortal_1", MAIN_MAP_PORTAL_POSITION.HousePortal.x, MAIN_MAP_PORTAL_POSITION.HousePortal.y, 40, 'HouseScene');
    // === 포탈 비활성화 실시간 동기화 핸들러 ===
    socket.off('portalDisabled');
    socket.on('portalDisabled', ({ portalId }) => {
      if (portalId === 'FarmPortal_1' && this.FarmPortal) this.FarmPortal.setEnabled(false);
      if (portalId === 'HousePortal_1' && this.HousePortal) this.HousePortal.setEnabled(false);
    });
    
    //인벤토리 생성 및 스킬바 생성
    this.inventory = new Inventory(this); //인벤토리 생성
    this.skillBar = new SkillBar(this); //스킬바 생성
    // === 기존 플레이어 동기화 로직 ===
    socket.off('playersUpdate');
    socket.on('playersUpdate', ({ players }) => {
        // console.log("playersUpdate in MainMapScene, players : ", players);
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
            console.log("delete player in MainMapScene, id : ", id);
            this.players[id].sprite.destroy();
            delete this.players[id];
          }
        });
      });
    // === 넉백 신호 수신 ===
    socket.off('knockback');
    socket.on('knockback', ({ toId, direction }) => {
      if (this.players[toId]) {
        this.players[toId].startKnockback(direction);
      }
    });
    // === 넉백 해제 신호 수신 ===
    socket.off('knockbackReleased');
    socket.on('knockbackReleased', ({ id }) => {
      if (this.players[id]) {
        this.players[id].isKnockback = false;
      }
    });
    // === 마우스 클릭 시 내 캐릭터 이동 ===
    this.input.on('pointerdown', (pointer) => {
      if (this.players[this.myId] && !this.players[this.myId].isKnockback) {
        this.players[this.myId].setTarget(pointer.worldX, pointer.worldY);
        socket.emit('move', { roomId: this.roomId, userId: this.myId, scene: 'MainMapScene', x: pointer.worldX, y: pointer.worldY });
      }
    });
    // === a키 입력 상태 관리 ===
    this.input.keyboard.on('keydown-A', () => { this.aKeyDown = true; });
    this.input.keyboard.on('keyup-A', () => { this.aKeyDown = false; });
    
    socket.emit('join_scene', { roomId: this.roomId, userId: this.myId, scene: 'MainMapScene',position :this.initialPosition });
    // 인벤토리 생성 및 데이터 반영
    if (this.inventory) {
      this.inventory.items = this.items;
      this.inventory.updateAllSlots();
    }
    // === 글로브 이펙트 신호 수신 ===
    socket.off('gloveEffect');
    socket.on('gloveEffect', ({ fromId, direction }) => {
      if (this.players[fromId]) {
        this.players[fromId].showGloveEffect(direction);
      }
    });
  }

  update() {
    const dx = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION.FarmPortal.x;
    const dy = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION.FarmPortal.y;
    if(Math.hypot(dx, dy) < 40 && this.aKeyDown) {
        this.FarmPortal.moveToTargetScene(this.myId);
    }

    const hx = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION.HousePortal.x;
    const hy = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION.HousePortal.y;
    if(Math.hypot(hx, hy) < 40 && this.aKeyDown) {
      this.HousePortal.moveToTargetScene(this.myId);
   }

    Object.values(this.players).forEach(player => player.update());
  }
} 