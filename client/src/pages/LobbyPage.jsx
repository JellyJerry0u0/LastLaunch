import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import { useNavigate, useParams } from 'react-router-dom';
import './LobbyPage.css';

// 타이핑 효과 컴포넌트
const TypingRoomItem = ({ room, isTyping, onJoin }) => {
  const [typedTitle, setTypedTitle] = useState('');
  const [typedPlayers, setTypedPlayers] = useState('');
  
  useEffect(() => {
    if (isTyping) {
      // 제목 타이핑
      let titleIndex = 0;
      const titleInterval = setInterval(() => {
        if (titleIndex < room.title.length) {
          setTypedTitle(room.title.slice(0, titleIndex + 1));
          titleIndex++;
        } else {
          clearInterval(titleInterval);
          // 인원 수 타이핑
          let playersIndex = 0;
          const playersText = `인원: ${room.currentUserNumber}/${room.maxUsers}`;
          const playersInterval = setInterval(() => {
            if (playersIndex < playersText.length) {
              setTypedPlayers(playersText.slice(0, playersIndex + 1));
              playersIndex++;
            } else {
              clearInterval(playersInterval);
            }
          }, 50);
        }
      }, 100);
    } else {
      setTypedTitle(room.title);
      setTypedPlayers(`인원: ${room.currentUserNumber}/${room.maxUsers}`);
    }
  }, [room, isTyping]);

  return (
    <li className="room-item">
      <div className="room-info">
        <div className="room-title">{typedTitle}</div>
        <div className="room-players">{typedPlayers}</div>
      </div>
      <button 
        className="join-button" 
        onClick={() => onJoin(room._id)}
        style={{ opacity: isTyping ? 0.5 : 1 }}
        disabled={isTyping}
      >
        join
      </button>
    </li>
  );
};

const LobbyPage = () => {
  const params = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExtract, setShowExtract] = useState(true);
  const [extractProgress, setExtractProgress] = useState(0);
  const [typingRooms, setTypingRooms] = useState(new Set());
  const navigate = useNavigate();
  const myId = params.userId;

  // 방 생성 요청
  const makeRoom = async () => {
    try {
      setLoading(true);
      const response = await fetch(import.meta.env.VITE_SERVER_URL + '/api/makeRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '새 방 ' + Date.now(), // 중복 방지용
        }),
      });
      if (!response.ok) throw new Error('방 생성에 실패했습니다.');
      // 방 목록 갱신은 소켓 이벤트로만 처리
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 방 목록 불러오기
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(import.meta.env.VITE_SERVER_URL + '/rooms');
      if (!response.ok) throw new Error('방 목록을 불러오지 못했습니다.');
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 압축 해제 애니메이션 시작
    let progress = 0;
    const extractInterval = setInterval(() => {
      progress += 2;
      setExtractProgress(progress);
      
      if (progress >= 100) {
        clearInterval(extractInterval);
        // 압축 해제 완료 후 로비 표시
        setTimeout(() => {
          setShowExtract(false);
          fetchRooms();
          if (!socket.connected) socket.connect();
        }, 500);
      }
    }, 60); // 3초 동안 100%까지

    // 소켓 이벤트 핸들러
    const handleRoomUpdated = (data) => {
        setRooms(prevRooms => {
          // 이미 있으면 갱신, 없으면 추가
          const exists = prevRooms.some(room => room._id === data._id);
          if (exists) {
            return prevRooms.map(room => room._id === data._id ? data : room);
          } else {
            // 새 방이 추가되면 타이핑 효과 시작
            setTypingRooms(prev => new Set([...prev, data._id]));
            setTimeout(() => {
              setTypingRooms(prev => {
                const newSet = new Set(prev);
                newSet.delete(data._id);
                return newSet;
              });
            }, 2000);
            return [...prevRooms, data];
          }
        });
      };
    socket.on('roomUpdated', handleRoomUpdated);

    return () => {
      clearInterval(extractInterval);
      socket.off('roomUpdated', handleRoomUpdated);
    };
  }, []);

  return (
    <div className="lobby-container">
      {showExtract && (
        <div className="extract-overlay">
          <div className="extract-text">Last-Launch.zip 압축 푸는 중...</div>
          <div className="extract-progress">
            <div 
              className="extract-progress-bar" 
              style={{ width: `${extractProgress}%` }}
            ></div>
          </div>
          <div className="extract-percentage">{extractProgress}%</div>
        </div>
      )}
      
      <h1 className="lobby-title">Last-Launch</h1>
      
      <div className="rooms-container">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : error ? (
          <div className="error">에러: {error}</div>
        ) : (
          <>
            {rooms.length === 0 ? (
              <div className="no-rooms">현재 생성된 방이 없습니다.</div>
            ) : (
              <ul className="room-list">
                {rooms.map((room) => (
                  <TypingRoomItem
                    key={room._id}
                    room={room}
                    isTyping={typingRooms.has(room._id)}
                    onJoin={(roomId) => navigate(`/waiting/${roomId}/${myId}`)}
                  />
                ))}
              </ul>
            )}
            <button 
              className="create-room-button" 
              onClick={makeRoom}
              disabled={loading}
            >
              Create Room
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;