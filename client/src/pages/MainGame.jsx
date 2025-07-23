import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainMapScene from '../game/scenes/MainMapScene';
import FarmScene from '../game/scenes/FarmScene';
import HouseScene from '../game/scenes/HouseScene';
// import LoadingScene from '../game/scenes/LoadingScene';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { STARTING_POINT } from '../game/constants';

// DeathBoard 컴포넌트
function SpritePortrait({ character }) {
  const ref = React.useRef();
  React.useEffect(() => {
    if (!character) return;
    const img = new window.Image();
    img.src = `/assets/${character}`;
    img.onload = () => {
      const ctx = ref.current.getContext('2d');
      ctx.clearRect(0, 0, 48, 48);
      // 1번 프레임: (32, 0, 32, 32)
      ctx.drawImage(img, 32, 0, 32, 32, 0, 0, 48, 48);
    };
  }, [character]);
  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      style={{
        background: '#888',
        borderRadius: 8,
        marginRight: 12,
        border: '1px solid #333'
      }}
    />
  );
}

function DeathBoard({ players, myId }) {
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: 20,
      background: 'rgba(34,34,34,0.7)',
      borderRadius: 16,
      padding: 12,
      // width: 240, // 고정폭 제거
      display: 'inline-block', // 내용에 맞게 크기 조정
      zIndex: 99999
    }}>
      {players.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          {p.character ? (
            <SpritePortrait character={p.character} />
          ) : (
            <div style={{
              width: 48, height: 48, background: '#888', borderRadius: 8, marginRight: 12,
              border: p.id === myId ? '2px solid #ff0' : 'none'
            }} />
          )}
          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{p.id}</div>
            <div style={{ color: '#ff6666', whiteSpace: 'nowrap' }}>Death: {p.deathCount}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// TimerBoard 컴포넌트
function TimerBoard({ seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(34,34,34,0.85)',
      borderRadius: 12,
      padding: '8px 24px',
      color: '#fff',
      fontSize: 28,
      fontWeight: 'bold',
      zIndex: 99998,
      letterSpacing: 2
    }}>
      제한시간 {mm}:{ss}
    </div>
  );
}

const MyGame = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const roomId = params.roomId;
  const myId = params.userId;
  const character = location.state?.character;
  const currentUsers = location.state?.currentUsers;
  const gameRef = useRef(null);
  const [deathBoard, setDeathBoard] = useState([]);
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(10);
  const [timerActive, setTimerActive] = useState(true);

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
    // 데스보드 이벤트 리스너
    const handleDeathBoard = e => setDeathBoard(e.detail);
    window.addEventListener('deathBoardUpdate', handleDeathBoard);
    // 게임 결과 이벤트 리스너
    const handleResult = e => setResult(e.detail);
    window.addEventListener('gameResult', handleResult);
    // 타이머 이벤트 리스너
    const handleTimer = e => setTimer(e.detail);
    window.addEventListener('gameTimer', handleTimer);
    // 타이머 시작
    let timerInterval = null;
    setTimer(120);
    setTimerActive(true);
    let t = 120;
    timerInterval = setInterval(() => {
      t -= 1;
      if (t < 0) t = 0;
      window.dispatchEvent(new CustomEvent('gameTimer', { detail: t }));
      if (t === 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('deathBoardUpdate', handleDeathBoard);
      window.removeEventListener('gameResult', handleResult);
      window.removeEventListener('gameTimer', handleTimer);
      if (timerInterval) clearInterval(timerInterval);
      if (game) game.destroy(true);
    };
  }, [roomId, myId, character, currentUsers]);

  // 게임 종료 시 타이머 중지
  useEffect(() => {
    if (result) setTimerActive(false);
  }, [result]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
      <DeathBoard players={deathBoard} myId={myId} />
      {timerActive && <TimerBoard seconds={timer} />}
      {result && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#222', borderRadius: 16, padding: 32, color: '#fff', minWidth: 320 }}>
            <h2 style={{ textAlign: 'center' }}>게임 종료</h2>
            <ol>
              {result.map((p, i) => (
                <li key={p.id} style={{ margin: 8, fontWeight: i === 0 ? 'bold' : 'normal' }}>
                  {i + 1}등: {p.id} (Death: {p.deathCount})
                </li>
              ))}
            </ol>
            <button
              style={{ marginTop: 24, width: '100%', padding: 12, fontSize: 18, borderRadius: 8, background: '#444', color: '#fff', border: 'none', cursor: 'pointer' }}
              onClick={() => navigate(`/lobby/${myId}`)}
            >
              로비로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGame;


//1. 메인 게임에서는 처음에 페이저 게임 인스턴스를 만들어야한다. 이때 초기 설정이 이루어진다.
//2. 초기 설정이후 join_room을 통해 메인씬에 조인시키고 업데이트를 받는다.
