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
  //내일하자
  const [readyState, setReadyState] = useState({});
  

  useEffect(() => {
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

    return () => {
      socket.off('roomJoinedSuccess');
      socket.off('roomJoinedFail');
      socket.off('updateParticipants');
    };
  }, []);

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
          {[...Array(maxUsers)].map((_, idx) => (
            <li key={idx} style={{ border: '1px solid #ccc', margin: '0.5em 0', padding: '0.5em' }}>
              {participants[idx] ? participants[idx] : '비어있음'}
            </li>
          ))}
        </ul>
      </div>
      {/* 방 정보, 참가자 목록, 게임 시작 버튼 등 추가 가능 */}
      <button onClick={() => {
        socket.emit('startGame', { roomId: roomId, userId: myId });
      }}>
        게임 준비
      </button>
    </div>
  );
};

export default WaitingRoom; 