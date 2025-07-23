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
    // 모든 플레이어의 deathCount 0으로 초기화 (currentUsers 기준)
    this.deathBoard = [];
    if (this.currentUsers) {
      for (const user of this.currentUsers) {
        if (this.players[user.id]) this.players[user.id].deathCount = 0;
      }
    }
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
          key: `idle-down-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `idle-up-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 12, end: 15 }),
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `idle-left-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 8, end: 11 }),
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `idle-right-${user.id}`,
          frames: this.anims.generateFrameNumbers(user.id, { start: 4, end: 7 }),
          frameRate: 10,
          repeat: -1
        });
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
    socket.on('playersUpdate', ({ players, isTeleport }) => {
      Object.entries(players).forEach(([id, player]) => {
        if (!id || id === "undefined") return;
        // Player 생성 시 텍스처 키로 id 사용
        if (!this.players[id]) {
          this.players[id] = new Player(this, id, player.x, player.y, id === this.myId ? 0x00ffcc : 0xffcc00, id);
          this.physics.add.collider(this.players[id].sprite, this.wall_0);
          this.physics.add.collider(this.players[id].sprite, this.wall_1);
          this.players[id].deathCount = 0;
        } else {
          const sprite = this.players[id].sprite;
          // === 텔레포트 신호가 온 경우 ===
          if (isTeleport && (sprite.x !== player.x || sprite.y !== player.y)) {
            sprite.x = player.x;
            sprite.y = player.y;
            this.players[id].target.x = player.x;
            this.players[id].target.y = player.y;
          } else {
            // 평소에는 target만 갱신 (모든 플레이어)
            this.players[id].target.x = player.destX;
            this.players[id].target.y = player.destY;
          }
        }
      });
      // === 데스카운트 데이터 갱신 및 이벤트 디스패치 ===
      this.deathBoardData = (this.currentUsers || []).map(user => ({
        id: user.id,
        deathCount: this.players[user.id] ? this.players[user.id].deathCount : 0,
        character: user.character || null
      }));
      window.dispatchEvent(new CustomEvent('deathBoardUpdate', { detail: this.deathBoardData }));
    });
    // === 서버 deathBoardUpdate 소켓 이벤트 수신 ===
    socket.off('deathBoardUpdate');
    socket.on('deathBoardUpdate', ({ deathBoard }) => {
      // 서버 deathBoard 정보로 로컬 deathCount 갱신
      if (Array.isArray(deathBoard)) {
        deathBoard.forEach(({ id, deathCount }) => {
          if (this.players[id]) this.players[id].deathCount = deathCount;
        });
        window.dispatchEvent(new CustomEvent('deathBoardUpdate', { detail: deathBoard }));
      }
    });
    // === 서버 gameOver 소켓 이벤트 수신 ===
    socket.off('gameOver');
    socket.on('gameOver', () => {
      // 현재 deathBoardData를 등수로 정렬해서 결과 이벤트로 전달
      const sorted = [...(this.deathBoardData || [])].sort((a, b) => a.deathCount - b.deathCount);
      window.dispatchEvent(new CustomEvent('gameResult', { detail: sorted }));
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
    
    socket.emit('join_scene', { roomId: this.roomId, userId: this.myId, scene: 'MainMapScene', position: { ...this.initialPosition, character: this.character.sprite } });
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
    // === 데스카운트 UI 관련 Phaser 오브젝트 제거 ===
    this.deathBoardData = [];
    // === 왼쪽 위 데스카운트 UI 생성 ===
    // UI 그룹 및 엔트리 초기화 (create에서 1회만)
    // if (!this.deathBoardGroup) {
    //   this.deathBoardGroup = this.add.group();
    //   this.deathBoardBG = this.add.graphics();
    //   this.deathBoardBG.fillStyle(0x222222, 0.7);
    //   this.deathBoardBG.fillRoundedRect(10, 10, 220, 340, 16);
    //   this.deathBoardBG.setScrollFactor(0);
    //   this.deathBoardGroup.add(this.deathBoardBG);
    //   this.deathBoardEntries = [];
    //   for (let i = 0; i < 4; i++) {
    //     const y = 20 + i * 80;
    //     // 초상화: 스프라이트시트 1번 프레임을 drawImage로 대체(없으면 사각형)
    //     const portrait = this.add.rectangle(20 + 32, y + 32, 64, 64, 0x444444).setScrollFactor(0);
    //     const idText = this.add.text(100, y + 10, '', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
    //     const deathText = this.add.text(100, y + 40, '', { fontSize: '16px', fill: '#ff6666' }).setScrollFactor(0);
    //     this.deathBoardGroup.addMultiple([portrait, idText, deathText]);
    //     this.deathBoardEntries.push({ portrait, idText, deathText });
    //   }
    // }
    // water 레이어와 충돌 시 스폰 위치로 순간이동
    this.physics.add.overlap(this.players[this.myId].sprite, water, (playerSprite, tileLayer) => {
        if (this.isRespawning) return;
      
        // 플레이어의 현재 위치에 해당하는 타일 좌표 계산
        const tile = water.getTileAtWorldXY(playerSprite.x, playerSprite.y, true);
      
        // 타일이 실제로 존재하는 경우(즉, 물 타일 위에 있을 때)만 텔레포트
        if (tile && tile.index !== -1) {
          this.isRespawning = true;
          playerSprite.x = this.initialPosition.x;
          playerSprite.y = this.initialPosition.y;
          // 깜빡임 효과 추가
          if (this.myPlayer && this.myPlayer.showDeathBlinkEffect) {
            this.myPlayer.showDeathBlinkEffect();
          }
          socket.emit('teleport', {
            roomId: this.roomId,
            userId: this.myId,
            scene: this.scene.key,
            x: this.initialPosition.x,
            y: this.initialPosition.y
          });
          this.time.delayedCall(1000, () => { this.isRespawning = false; });
        }
      });
    // === deathBlink 신호 수신: 모든 유저가 해당 캐릭터 깜빡임 효과 ===
    socket.off('deathBlink');
    socket.on('deathBlink', ({ userId }) => {
      if (this.players[userId] && this.players[userId].showDeathBlinkEffect) {
        this.players[userId].showDeathBlinkEffect();
      }
    });
  }

  update() {
    const dx = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION['3to2Portal'].x;
    const dy = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION['3to2Portal'].y;
    if(Math.hypot(dx, dy) < 40 && this.aKeyDown) {
        // this.Portal1.moveWithinScene(); // This line was removed as Portal1 is removed
    }

    const hx = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION['2to1Portal'].x;
    const hy = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION['2to1Portal'].y;
    if(Math.hypot(hx, hy) < 40 && this.aKeyDown) {
        // this.Portal2.moveWithinScene(); // This line was removed as Portal2 is removed
    }
    const ex = this.myPlayer.sprite.x - MAIN_MAP_PORTAL_POSITION['1to2Portal'].x;
    const ey = this.myPlayer.sprite.y - MAIN_MAP_PORTAL_POSITION['1to2Portal'].y;
    if(Math.hypot(ex, ey) < 40 && this.aKeyDown) {
        // this.Portal3.moveWithinScene(); // This line was removed as Portal3 is removed
    }

    Object.values(this.players).forEach(player => player.update());

    // === 데스카운트 UI 위치/스케일 카메라에 맞게 보정 ===
    // if (this.deathBoardEntries && this.deathBoardBG) { // This block was removed as deathBoardGroup and BG are removed
    //   const cam = this.cameras.main;
    //   const baseX = cam.scrollX + 20 / cam.zoom;
    //   const baseY = cam.scrollY + 20 / cam.zoom;
    //   // 배경 위치/스케일
    //   this.deathBoardBG.setPosition(baseX - 10, baseY - 10);
    //   this.deathBoardBG.setScale(1 / cam.zoom);
    //   for (let i = 0; i < this.deathBoardEntries.length; i++) {
    //     const entry = this.deathBoardEntries[i];
    //     const y = baseY + i * 80 / cam.zoom;
    //     if (entry.portrait) {
    //       entry.portrait.setPosition(baseX + 32, y + 32);
    //       entry.portrait.setScale(1 / cam.zoom);
    //     }
    //     if (entry.portraitImage) {
    //       entry.portraitImage.setPosition(baseX + 32, y + 32);
    //       entry.portraitImage.setScale(64 / entry.portraitImage.width / cam.zoom);
    //     }
    //     entry.idText.setPosition(baseX + 100, y + 10);
    //     entry.idText.setFontSize(18 / cam.zoom);
    //     entry.deathText.setPosition(baseX + 100, y + 40);
    //     entry.deathText.setFontSize(16 / cam.zoom);
    //   }
    // }
  }
} 