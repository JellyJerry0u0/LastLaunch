import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import socket from '../services/socket';
import { useParams } from 'react-router-dom';

// 맵 및 플레이어 설정
const GAME_WIDTH = 2000;
const GAME_HEIGHT = 3000;
const TILE_SIZE = 80;
const PLAYER_SIZE = 40;

const MyGame = () => {
  const gameRef = useRef(null);
  const params = useParams();
  const roomId = params.roomId;
  const myId = params.userId;
  const [players, setPlayers] = useState(null); // { id: {x, y, destX, destY} }

  // 1. players를 받아오는 useEffect
  useEffect(() => {
    const fetchInitialPlayers = async () => {
      try {
        const response = await fetch(`/api/roomPlayers/${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.players);
        }
      } catch (err) {
        console.error('초기 위치 정보 불러오기 실패:', err);
      }
    };
    fetchInitialPlayers();
  }, [roomId]);

  // 2. players가 준비된 후에 Phaser 게임 생성
  useEffect(() => {
    console.log("players in client useEffect");
    if (!players || !gameRef.current) return;
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
        // 배경
        const g = this.add.graphics();
        for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
          for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
            const isEven = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
            g.fillStyle(isEven ? 0x333333 : 0x555555, 1);
            g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          }
        }
        // 물리 바운드
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // 카메라
        const cam = this.cameras.main;
        cam.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.scale.on('resize', () => {
          cam.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        });
        // 입력
        this.input.on('pointerdown', (pointer) => {
          const wx = Phaser.Math.Clamp(pointer.worldX, 0, GAME_WIDTH);
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
            // spr.x += (p.x - spr.x) * 1;
            // spr.y += (p.y - spr.y) * 1;
          }
        });
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
      game.destroy(true);
    };
  }, [players, roomId, myId]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MyGame;
