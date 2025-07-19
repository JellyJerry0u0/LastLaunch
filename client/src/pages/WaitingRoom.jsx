import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../services/socket';

const WaitingRoom = () => {
  const params = useParams();
  const roomId = params.roomId;
  const myId = params.userId;
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const maxUsers = 4;
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
      navigate(`/maingame`);
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
    <div>
      <h2>대기방</h2>
      <p>방 ID: {roomId}</p>
      <button onClick={() => {
        socket.emit('leaveRoom', { roomId: roomId, userId: myId });
        navigate(`/lobby/${myId}`);
      }}>
        방 나가기
      </button>
      <p>유저 이름: {myId}</p>
      <div style={{ marginTop: '2em' }}>
        <h3>참가자 목록</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {[...Array(maxUsers)].map((_, idx) => {
            const participant = participants[idx];
            const isHost = idx === 0;
            return (
              <li key={idx} style={{ border: '1px solid #ccc', margin: '0.5em 0', padding: '0.5em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {participant ? (
                    <>
                      {participant.name}
                      {idx === 0 && <span style={{ marginLeft: 8 }}>👑</span>}
                    </>
                  ) : '비어있음'}
                </span>
                {participant && (
                  <span style={{ 
                    padding: '0.2em 0.5em', 
                    borderRadius: '4px', 
                    fontSize: '0.8em',
                    backgroundColor: participant.isReady ? '#4CAF50' : '#FF9800',
                    color: 'white'
                  }}>
                    {isHost ? '방장' : participant.isReady ? '준비' : '대기'}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* 준비/시작 버튼 */}
      <div style={{ marginTop: '2em' }}>
        {myId === participants[0]?.id ? (
          <button
            style={{
              padding: '1em 2em',
              fontSize: '1.2em',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={handleStartGame} // 추후 게임 시작 기능 연결
          >
            게임 시작
          </button>
        ) : (
          <button 
            onClick={handleToggleReady}
            style={{
              padding: '1em 2em',
              fontSize: '1.2em',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            준비하기
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom; 