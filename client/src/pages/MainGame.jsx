import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainMapScene from '../game/scenes/MainMapScene';
import FarmScene from '../game/scenes/FarmScene';
import HouseScene from '../game/scenes/HouseScene';
// import LoadingScene from '../game/scenes/LoadingScene';
import { useParams, useLocation } from 'react-router-dom';
import { STARTING_POINT } from '../game/constants';

const MyGame = () => {
  const params = useParams();
  const location = useLocation();
  const roomId = params.roomId;
  const myId = params.userId;
  const character = location.state?.character;
  const currentUsers = location.state?.currentUsers;
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
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      dom : {
        createContainer: true
      }
    };
    game = new Phaser.Game(config);
    console.log(STARTING_POINT[character]);
    console.log(character);
    // MainMapScene에 초기 데이터 전달 (캐릭터 정보 포함)
    game.scene.start('MainMapScene', { roomId: roomId, whoId: myId, directionFrom: character.key, character, currentUsers });
    // MainMapScene은 LoadingScene에서 start
    const onResize = () => game.scale.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (game) game.destroy(true);
    };
  }, [roomId, myId, character, currentUsers]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MyGame;


//1. 메인 게임에서는 처음에 페이저 게임 인스턴스를 만들어야한다. 이때 초기 설정이 이루어진다.
//2. 초기 설정이후 join_room을 통해 메인씬에 조인시키고 업데이트를 받는다.
