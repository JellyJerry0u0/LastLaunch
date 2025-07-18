import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import { useNavigate, useParams } from 'react-router-dom';

const LobbyPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { username } = useParams();

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
    fetchRooms();
    if (!socket.connected) socket.connect();

    // 소켓 이벤트 핸들러
    const handleRoomCreated = (data) => {
      setRooms(prevRooms => {
        // 중복 방 추가 방지
        if (prevRooms.some(room => room._id === data._id)) return prevRooms;
        return [...prevRooms, data];
      });
    };
    const handleRoomUpdated = (data) => {
      console.log('방 정보가 업데이트되었다. : ', data);
      setRooms(prevRooms => {
        return prevRooms.map(room => room._id === data._id ? data : room);
      });
    };
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomUpdated', handleRoomUpdated);

    // return () => {
    //   socket.off('roomCreated', handleRoomCreated);
    //   if (socket.connected) socket.disconnect();
    // };
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      <h2>게임 로비 목록</h2>
      {rooms.length === 0 ? (
        <div>현재 생성된 방이 없습니다.</div>
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room._id}>
              <strong>{room.title}</strong> (인원: {room.currentUserNumber}/{room.maxUsers})
              <button style={{ marginLeft: '1em' }} onClick={() => navigate(`/waiting/${room._id}/${username}`)}>
                입장
              </button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={makeRoom}>
        방 만들기
      </button>
    </div>
  );
};

export default LobbyPage;