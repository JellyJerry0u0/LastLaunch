import Phaser from 'phaser';
import Player from '../Player';
import socket from '../../services/socket';
import { STARTING_POINT } from '../constants';
import { MAIN_MAP_PORTAL_POSITION } from '../constants';
import Inventory from '../Inventory';
import { SkillBar } from '../SkillBar';
import Portal from '../Portal';
import { PORTAL_DEST_POSITION } from '../constants';

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
    
    this.initialPosition = STARTING_POINT[this.directionFrom];
    this.character = data.character || { sprite: 'RACCOONSPRITESHEET.png', key: 'RACCOON' };
    // 내 플레이어 생성 (내 id를 key로)
    this.players[this.myId] = new Player(this, this.myId, this.initialPosition.x, this.initialPosition.y, 0x00ffcc, this.myId);
    this.players[this.myId].sprite.setFrame(20); // idle 프레임 명확히 지정
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
    this.currentUsers = data.currentUsers || [];
    // userCharacterMap 제거
  }

  preload() {
    this.load.tilemapTiledJSON('map', '/assets/madMap.tmj');
    this.load.image('plant', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Plant.png');
    this.load.image('stair', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Struct.png');
    this.load.image('grass', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Tileset Grass.png');
    this.load.image('wall', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Tileset Wall.png');
    this.load.image('object', '/assets/Pixel Art Top Down - Basic v1/Texture/TX Props.png');
    this.load.image('water', '/assets/Water+-2.png');
    // 캐릭터별 스프라이트시트 동적 preload
    if (this.currentUsers) {
      for (const user of this.currentUsers) {
        this.load.spritesheet(user.id, `/assets/${user.character || 'RACCOONSPRITESHEET.png'}`, { frameWidth: 32, frameHeight: 32 });
      }
    }
    this.load.image('glove','/assets/Punch.png');    
    // this.load.spritesheet('raccoon_hurt', '/assets/raccoon_hurt.png', { frameWidth: 32, frameHeight: 32 });
    }

  create() {
    // 모든 참가자별로 애니메이션 생성
    if (this.currentUsers) {
      for (const user of this.currentUsers) {
        this.anims.create({
          key: `walk-down-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 20, end: 27 }),
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `walk-left-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 28, end: 35 }),
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `walk-right-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 36, end: 43 }),
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `walk-up-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 44, end: 51 }),
          frameRate: 10,
          repeat: -1
        });
      }
    }

    this.physics.world.setBounds(0, 0, 40*32, 40*32);

    const map = this.make.tilemap({ key: 'map' });

  // 타일셋 이름과 이미지 키를 정확히 일치시켜야 함
    const wallset = map.addTilesetImage('wall', 'wall');
    const objectset = map.addTilesetImage('object', 'object');
    const tileset = map.addTilesetImage('grass', 'grass');
    const stairset = map.addTilesetImage('struct', 'stair');
    const waterset = map.addTilesetImage('water', 'water');
    const plantset = map.addTilesetImage('plant', 'plant');

    // 레이어 이름도 정확히 일치시켜야 함
    const grass_0 = map.createLayer('grass_0', tileset, 0, 0).setDepth(0);
    const grass_1 = map.createLayer('grass_1', tileset, 0, 0).setDepth(0);
    const grass_2 = map.createLayer('grass_2', tileset, 0, 0).setDepth(0);

    this.wall_0 = map.createLayer('wall_0', wallset, 0, 0).setDepth(0);
    this.wall_1 = map.createLayer('wall_1', wallset, 0, 0).setDepth(0);
    this.wall_2 = map.createLayer('wall_2', wallset, 0, 0).setDepth(0);

    this.wall_0.setCollisionByExclusion([-1]);
    this.wall_1.setCollisionByExclusion([-1]);
    
    const stair = map.createLayer('stair', stairset, 0, 0).setDepth(0);
    const water = map.createLayer('water', waterset, 0, 0).setDepth(0);
    const object = map.createLayer('object', [objectset, plantset], 0, 0).setDepth(11);
    
    this.physics.add.collider(this.players[this.myId].sprite, this.wall_0);
    this.physics.add.collider(this.players[this.myId].sprite, this.wall_1);
    
    this.cameras.main.startFollow(this.players[this.myId].sprite);
    this.cameras.main.setZoom(3);

    //포탈 생성 및 초기화
    // this.Portal1 = new Portal(this, "3to2Portal", MAIN_MAP_PORTAL_POSITION['3to2Portal'].x, MAIN_MAP_PORTAL_POSITION['3to2Portal'].y, 40, undefined);
    // this.Portal2 = new Portal(this, "2to1Portal", MAIN_MAP_PORTAL_POSITION['2to1Portal'].x, MAIN_MAP_PORTAL_POSITION['2to1Portal'].y, 40, undefined);
    // this.Portal3 = new Portal(this, "1to2Portal", MAIN_MAP_PORTAL_POSITION['1to2Portal'].x, MAIN_MAP_PORTAL_POSITION['1to2Portal'].y, 40, undefined);
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
      Object.entries(players).forEach(([id, player]) => {
        if (!id || id === "undefined") return;
        // Player 생성 시 텍스처 키로 id 사용
        if (!this.players[id]) {
          this.players[id] = new Player(this, id, player.x, player.y, id === this.myId ? 0x00ffcc : 0xffcc00, id);
          this.physics.add.collider(this.players[id].sprite, this.propLayer);
          this.physics.add.collider(this.players[id].sprite, this.wall_layer_1);
          this.physics.add.collider(this.players[id].sprite, this.wall_layer_2);
        } else {
          const sprite = this.players[id].sprite;
          const dist = Math.hypot(sprite.x - player.x, sprite.y - player.y);
          // 평소에는 기존 방식대로 target만 갱신
          if (id !== this.myId) {
            this.players[id].target.x = player.destX;
            this.players[id].target.y = player.destY;
          }
        }
      });
      Object.keys(this.players).forEach(id => {
        if (!players[id]) {
          this.players[id].sprite.destroy();
          delete this.players[id];
        }
      });
    });
    //넉백 신호 수신
    socket.off('knockback')
    socket.on('knockback', ({ toId, direction }) => {
        if(this.players[toId]) {
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
    // water 레이어와 충돌 시 스폰 위치로 이동
    this.physics.add.collider(this.players[this.myId].sprite, water, () => {
      // 플레이어를 스폰 위치로 이동
      this.players[this.myId].sprite.x = this.initialPosition.x;
      this.players[this.myId].sprite.y = this.initialPosition.y;
      // 서버에도 위치 갱신
      socket.emit('move', {
        roomId: this.roomId,
        userId: this.myId,
        scene: this.scene.key,
        x: this.initialPosition.x,
        y: this.initialPosition.y
      });
    });
  }

  update() {
    const dx = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION['3to2Portal'].x;
    const dy = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION['3to2Portal'].y;
    if(Math.hypot(dx, dy) < 40 && this.aKeyDown) {
        this.Portal1.moveWithinScene();
    }

    const hx = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION['2to1Portal'].x;
    const hy = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION['2to1Portal'].y;
    if(Math.hypot(hx, hy) < 40 && this.aKeyDown) {
        this.Portal2.moveWithinScene();
    }
    const ex = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION['1to2Portal'].x;
    const ey = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION['1to2Portal'].y;
    if(Math.hypot(ex, ey) < 40 && this.aKeyDown) {
        this.Portal3.moveWithinScene();
    }

    Object.values(this.players).forEach(player => player.update());
  }
} 