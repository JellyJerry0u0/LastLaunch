import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import { useEffect } from 'react';


const WaitingRoom = () => {
  const { roomId, username } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    console.log("joinRoom in client roomId : ", roomId);
    socket.emit('joinRoom', {roomId : roomId, userName: username});
    socket.on('roomJoinedSuccess', (data) => {
      console.log('방에 입장했다. : ', data);
    });
    socket.on('roomJoinedFail', (data) => {
      console.log('방에 입장 실패. : ', data);
    });
  }, []);
  return (
    <div>
      <h2>대기방</h2>
      <p>방 ID: {roomId}</p>
      <button onClick={() => {
        socket.emit('leaveRoom', roomId);
        navigate(`/lobby/${username}`);
      }}>
        방 나가기
      </button>
      <p>유저 이름: {username}</p>
      {/* 방 정보, 참가자 목록, 게임 시작 버튼 등 추가 가능 */}
    </div>
  );
};

export default WaitingRoom; 