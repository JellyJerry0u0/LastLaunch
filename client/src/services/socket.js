import { io } from 'socket.io-client';
const socket = io("localhost:4000"); // 서버 주소는 필요에 따라 변경

export default socket; 
