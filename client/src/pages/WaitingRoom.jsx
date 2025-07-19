import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import { useAudio } from '../contexts/AudioContext';
import './WaitingRoom.css';

// 빈 참가자 자리용 Loading 애니메이션 컴포넌트
const LoadingDots = () => {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <span className="participant-name empty">Loading{'.'.repeat(dotCount)}</span>;
};

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~";

// 참가자 이름 애니메이션 컴포넌트
const TypingName = ({ name }) => {
  const [phase, setPhase] = useState('glitch'); // glitch, typing, done
  const [display, setDisplay] = useState('');
  const glitchTimeout = useRef();
  const typingTimeout = useRef();

  useEffect(() => {
    // glitch phase: 0.3초간 랜덤 문자
    if (phase === 'glitch') {
      let count = 0;
      const glitchInterval = setInterval(() => {
        setDisplay(Array(name.length).fill().map(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join(''));
        count++;
        if (count > 4) { // 약 0.3초
          clearInterval(glitchInterval);
          setPhase('typing');
        }
      }, 60);
      return () => clearInterval(glitchInterval);
    }
    // typing phase: 한 글자씩 타이핑
    if (phase === 'typing') {
      let idx = 0;
      function typeNext() {
        setDisplay(name.slice(0, idx + 1));
        if (idx < name.length - 1) {
          typingTimeout.current = setTimeout(typeNext, 80);
        } else {
          setPhase('done');
        }
        idx++;
      }
      typeNext();
      return () => clearTimeout(typingTimeout.current);
    }
    // done phase: 이름 전체 표시
    if (phase === 'done') {
      setDisplay(name);
    }
  }, [phase, name]);

  useEffect(() => () => {
    clearTimeout(glitchTimeout.current);
    clearTimeout(typingTimeout.current);
  }, []);

  return <span className="participant-name">{display}</span>;
};

const WaitingRoom = () => {
  const params = useParams();
  const roomId = params.roomId;
  const myId = params.userId;
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const maxUsers = 4;
  const { isPlaying, hasStarted, playMusic } = useAudio();
  const firstFetch = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_SERVER_URL + `/api/rooms/${roomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.currentUsers || []);
      } else {
        console.error('방 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('방 정보 조회 실패:', error);
    }
  };

  useEffect(() => {
    firstFetch();
    console.log("joinRoom in client roomId : ", roomId);
    socket.emit('joinRoom', { roomId: roomId, userId: myId });
    
    // 음악이 시작되었지만 현재 재생 중이 아니라면 재생
    if (hasStarted && !isPlaying) {
      playMusic();
    }
    
    socket.on('joinRoomSuccess', (data) => {
      console.log('누군가 방에 입장했다. : ', data);
      setParticipants(data.currentUsers || []);
    });
    
    socket.on('roomJoinedFail', (data) => {
      console.log('방에 입장 실패. : ', data);
      navigate(`/lobby/${myId}`);
    });
    
    socket.on('leaveRoomSuccess', (data) => {
      console.log('누군가 방을 나갔다. : ', data);
      setParticipants(data.currentUsers || []);
    });

    socket.on('readyStateChanged', (data) => {
      console.log('준비 상태 변경됨: ', data);
      setParticipants(data.currentUsers || []);
    });

    socket.on('startGameSuccess', (data) => {
      console.log('게임 시작됨: ', data);
      navigate(`/maingame/${roomId}/${myId}`);
    });

    socket.on('startGameFail', (data) => {
      console.log('게임 시작 실패: ', data);
      alert(data.error || '게임 시작에 실패했습니다.');
    });

    return () => {
      socket.off('joinRoomSuccess');
      socket.off('roomJoinedFail');
      socket.off('leaveRoomSuccess');
      socket.off('readyStateChanged');
      socket.off('startGameSuccess');
      socket.off('startGameFail');
    };
  }, []);

  // 준비 상태 토글
  const handleToggleReady = () => {
    socket.emit('toggleReady', { roomId: roomId, userId: myId });
  };
  const handleStartGame = () => {
    socket.emit('startGame', { roomId: roomId, userId: myId });
  };

  return (
    <div className="waiting-room-container">
      <div className="cmd-window">
        <div className="cmd-header">
          <div className="cmd-title">Last-Launch Terminal</div>
          <div className="cmd-controls">
            <span className="cmd-control minimize">─</span>
            <span className="cmd-control maximize">□</span>
            <span className="cmd-control close">×</span>
          </div>
        </div>
        <div className="cmd-content">
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome, {myId} !</h1>
          </div>
          
          <div className="action-buttons">
            <button 
              className="leave-button"
              onClick={() => {
                socket.emit('leaveRoom', { roomId: roomId, userId: myId });
                navigate(`/lobby/${myId}`);
              }}
            >
              Leave
            </button>
            
            {myId === participants[0]?.id ? (
              <button
                className="start-game-button"
                onClick={handleStartGame}
              >
                Start
              </button>
            ) : (
              <button 
                className="ready-button"
                onClick={handleToggleReady}
              >
                Ready
              </button>
            )}
          </div>
          
          <div className="participants-container">
            <ul className="participants-list">
              {[...Array(maxUsers)].map((_, idx) => {
                const participant = participants[idx];
                const isHost = idx === 0;
                // 이름 타이핑 효과: 참가자가 처음 들어왔을 때만 TypingName 사용
                const [prevName, setPrevName] = useState('');
                useEffect(() => {
                  if (participant && participant.name !== prevName) {
                    setPrevName(participant.name);
                  }
                }, [participant]);
                return (
                  <li key={idx} className="participant-item">
                    <div className="participant-info">
                      {participant ? (
                        <TypingName key={participant.name + idx} name={participant.name} />
                      ) : (
                        <LoadingDots key={'empty'+idx} />
                      )}
                      {participant && isHost && (
                        <span className="master-badge">&gt;&gt;&gt;master</span>
                      )}
                      {participant && !isHost && participant.isReady && (
                        <span className="ready-badge">&gt;&gt;&gt;ready</span>
                      )}
                      {participant && !isHost && !participant.isReady && (
                        <span className="status-badge waiting">대기</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom; 