import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainMapScene from '../game/scenes/MainMapScene';
import FarmScene from '../game/scenes/FarmScene';
import HouseScene from '../game/scenes/HouseScene';
import { useParams } from 'react-router-dom';

const MyGame = () => {
  const params = useParams();
  const roomId = params.roomId;
  const myId = params.userId;
  const gameRef = useRef(null);
  useEffect(() => {
    let game;
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#222222',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [MainMapScene, FarmScene, HouseScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };
    game = new Phaser.Game(config);
    // MainMapScene에 초기 데이터 전달
    game.scene.start('MainMapScene', { roomId: roomId, whoId: myId, directionFrom: 'StartingPoint' });
    const onResize = () => game.scale.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (game) game.destroy(true);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MyGame;


//1. 메인 게임에서는 처음에 페이저 게임 인스턴스를 만들어야한다. 이때 초기 설정이 이루어진다.
//2. 초기 설정이후 join_room을 통해 메인씬에 조인시키고 업데이트를 받는다.
