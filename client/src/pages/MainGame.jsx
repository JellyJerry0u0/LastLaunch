import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import socket from '../services/socket';
import { useParams } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';

import GameMap from '../game/Map';
import House from '../game/House';
import Mine from '../game/Mine';
import Farm from '../game/Farm';
import Inventory from '../game/Inventory';

import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, HOUSE_SIZE, MINE_SIZE, HOUSE_COLOR, MINE_COLOR } from '../game/constants';


const PLAYER_SIZE = 40;

const MyGame = () => {
  const { stopMusic } = useAudio();
  const gameRef = useRef(null);
  const params = useParams();
  const roomId = params.roomId;
  const myId = params.userId;
  const [players, setPlayers] = useState(null); // { id: {x, y, destX, destY} }
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  useEffect(() => {
    stopMusic();
  }, [stopMusic]);
  // 1. players를 받아오는 useEffect
  useEffect(() => {
    const fetchInitialPlayers = async () => {
      try {
        const response = await fetch(`/api/roomPlayers/${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.players);
          setIsPlayerLoaded(true); // players 데이터를 받은 후에 true로 설정
        }
      } catch (err) {
        console.error('초기 위치 정보 불러오기 실패:', err);
      }
    };
    fetchInitialPlayers();
  }, [roomId]);

  // 2. players가 준비된 후에 Phaser 게임 생성 (한 번만)
  useEffect(() => {
    console.log("players in client useEffect, players:", players, "isPlayerLoaded:", isPlayerLoaded);
    if (!players || !gameRef.current || !isPlayerLoaded) return;
    let game;
    let scene;

    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: 'MainScene' });
        this.players = {};
        this.playerSprites = {};
        this.target = players[myId]
          ? { x: players[myId].x, y: players[myId].y }
          : { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
      }
      preload() {}
      create() {
        this.map = new GameMap(this);
        this.house = new House(this, 100, 100);
        this.house2 = new House(this, 300, 100);
        this.house3 = new House(this, 500, 100);
        this.house4 = new House(this, 700, 100);

        this.mine = new Mine(this, GAME_WIDTH/2-MINE_SIZE/2, 0);
        this.mine2 = new Mine(this, GAME_WIDTH/2-MINE_SIZE/2, GAME_HEIGHT-MINE_SIZE);
        this.mine3 = new Mine(this, 0, GAME_HEIGHT/2-MINE_SIZE/2);
        this.mine4 = new Mine(this, GAME_WIDTH-MINE_SIZE, GAME_HEIGHT/2-MINE_SIZE/2);
        
        console.log('광산 위치들:');
        console.log('광산1 (상단):', GAME_WIDTH/2-MINE_SIZE/2, 0);
        console.log('광산2 (하단):', GAME_WIDTH/2-MINE_SIZE/2, GAME_HEIGHT-MINE_SIZE);
        console.log('광산3 (좌측):', 0, GAME_HEIGHT/2-MINE_SIZE/2);
        console.log('광산4 (우측):', GAME_WIDTH-MINE_SIZE, GAME_HEIGHT/2-MINE_SIZE/2);

        // 농장 생성 (3000, 0 위치, 크기 600)
        this.farm = new Farm(this, 3000, 0, 600);
        this.currentLocation = 'main'; // 'main' 또는 'farm'

        this.inventory = new Inventory(this);
        // 배경
        const g = this.add.graphics();
        // for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
        //   for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
        //     const isEven = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
        //     g.fillStyle(isEven ? 0x333333 : 0x555555, 1);
        //     g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        //   }
        // }
        // 물리 바운드 (농장까지 포함)
        this.physics.world.setBounds(0, 0, 3500, GAME_HEIGHT);
        // 카메라
        const cam = this.cameras.main;
        cam.setBounds(0, 0, 3500, GAME_HEIGHT);
        this.scale.on('resize', () => {
          cam.setBounds(0, 0, 3500, GAME_HEIGHT);
        });
        // 입력
        this.input.on('pointerdown', (pointer) => {
          const wx = Phaser.Math.Clamp(pointer.worldX, 0, 3500);
          const wy = Phaser.Math.Clamp(pointer.worldY, 0, GAME_HEIGHT);
          if (this.playerSprites[myId]) {
            this.target = { x: wx, y: wy };
            socket.emit('move', { roomId:roomId, userId: myId, x: wx, y: wy });
          }
        });
        this.input.mouse.disableContextMenu();
        // players를 바로 반영
        this.players = players;
        this.createSprites();
        // socket events
        socket.on('playersUpdate', ({ players }) => {
          console.log("playersUpdate in client, players : ", players);
          this.players = players;
          // 플레이어 스프라이트 위치 업데이트
          Object.entries(players).forEach(([id, p]) => {
            if (this.playerSprites[id]) {
              // 다른 플레이어들의 위치만 업데이트 (내 플레이어는 target으로 이동)
              if (id !== myId) {
                this.playerSprites[id].x = p.x;
                this.playerSprites[id].y = p.y;
              }
            }
          });
        });
        // 방 참가 요청
        socket.emit('joinRoom', { roomId, userId: myId });
      }
      createSprites() {
        Object.entries(this.players).forEach(([id, p]) => {
          const color = id === myId ? 0x00ffcc : 0xffcc00;
          const spr = this.add.rectangle(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, color);
          this.physics.add.existing(spr);
          spr.body.setCollideWorldBounds(true);
          this.playerSprites[id] = spr;
          if (id === myId) {
            this.cameras.main.startFollow(spr, true, 0.1, 0.1);
          }
        });
      }
      update() {
        Object.entries(this.players).forEach(([id, p]) => {
          const spr = this.playerSprites[id];
          if (!spr) return;
          if (id === myId) {
            const dx = this.target.x - spr.x;
            const dy = this.target.y - spr.y;
            const dist = Math.hypot(dx, dy);
            const speed = 6;
            if (dist > speed) {
              spr.x += (dx / dist) * speed;
              spr.y += (dy / dist) * speed;
            } else {
              spr.x = this.target.x;
              spr.y = this.target.y;
            }

            // 메인맵 → 농장 포탈
            if (this.currentLocation === 'main') {
              const inMine1 = this.mine.isPlayerInRange(spr.x, spr.y);
              const inMine2 = this.mine2.isPlayerInRange(spr.x, spr.y);
              const inMine3 = this.mine3.isPlayerInRange(spr.x, spr.y);
              const inMine4 = this.mine4.isPlayerInRange(spr.x, spr.y);
              if (inMine1 || inMine2 || inMine3 || inMine4) {
                this.transitionToFarm();
              }
            }
            // 농장 → 메인맵 포탈
            else if (this.currentLocation === 'farm') {
              if (this.farm.isPlayerInPortal(spr.x, spr.y)) {
                this.transitionToMain();
              }
            }
          } else {
            const dx = p.x - spr.x;
            const dy = p.y - spr.y;
            const dist = Math.hypot(dx, dy);
            const speed = 6;
            if (dist > speed) {
              spr.x += (dx / dist) * speed;
              spr.y += (dy / dist) * speed;
            } else {
              spr.x = p.x;
              spr.y = p.y;
            }
          }
        });
      }

      transitionToFarm() {
        console.log('농장으로 전환 시작!');
        this.currentLocation = 'farm';
        // 농장 활성화
        this.farm.activate();
        
        // 플레이어를 농장으로 이동
        const farmCenterX = this.farm.x + this.farm.size / 2;
        const farmCenterY = this.farm.y + this.farm.size / 2;
        
        console.log('농장 중심 위치:', farmCenterX, farmCenterY);
        
        if (this.playerSprites[myId]) {
          this.playerSprites[myId].x = farmCenterX;
          this.playerSprites[myId].y = farmCenterY;
          this.target = { x: farmCenterX, y: farmCenterY };
          console.log('플레이어를 농장으로 이동 완료');
        }
        
        // 인벤토리에 광물 추가
        const emptySlot = this.inventory.findEmptySlot();
        if (emptySlot !== -1) {
          this.inventory.addItem(emptySlot, { name: '광물', color: 0x696969 });
          console.log('광물을 인벤토리에 추가');
        }
        
        // // 광산들 비활성화
        // this.mine.deactivate();
        // this.mine2.deactivate();
        // this.mine3.deactivate();
        // this.mine4.deactivate();
        console.log('농장 전환 완료!');
      }

      transitionToMain() {
        this.currentLocation = 'main';
        // 플레이어를 메인맵 중앙(혹은 원하는 위치)으로 이동
        const mainX = GAME_WIDTH / 2;
        const mainY = GAME_HEIGHT / 2;
        if (this.playerSprites[myId]) {
          this.playerSprites[myId].x = mainX;
          this.playerSprites[myId].y = mainY;
          this.target = { x: mainX, y: mainY };
        }
        // 농장 비활성화
        this.farm.deactivate();
        // 필요시 광산들 다시 활성화
        // this.mine.activate();
        // this.mine2.activate();
        // this.mine3.activate();
        // this.mine4.activate();
        console.log('메인 맵으로 복귀!');
      }
    }

    // Phaser 초기화
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#222222',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: MainScene,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    game = new Phaser.Game(config);
    scene = game.scene.keys['MainScene'];

    const onResize = () => game.scale.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      socket.off('playersUpdate');
      socket.off('joinRoom');
      if (game) {
        game.destroy(true);
      }
    };
  }, [roomId, myId, isPlayerLoaded]); // players 의존성 제거


  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MyGame;
