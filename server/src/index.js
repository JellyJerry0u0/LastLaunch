// server/src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const GameRoom = require('./models/room');

const User = require('./models/User');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());


async function createDefaultUserAndRoom() {
  // 유저 생성
  for(let i = 1; i <= 5; i++) {
    const exists = await User.findOne({ id: i });
    if(!exists) {
      await User.create({
        id: i,
        pw: i,
        name: i + "번 유저"
      });
    }
  }
  // 디폴트 방 생성
  const defaultRoom = await GameRoom.findOne({ title: '기본방' });
  if (!defaultRoom) {
    await GameRoom.create({
      title: '기본방',
      currentUsers: [],
      currentUserNumber: 0,
      maxUsers: 4,
      status: 'LOBBY'
    });
    console.log('기본방이 생성되었습니다.');
  }
}
// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // 개발 환경에서만 DB 전체 초기화
    if (process.env.NODE_ENV !== 'production') {
      await mongoose.connection.dropDatabase();
      console.log('DB 전체가 초기화되었습니다.');
    }
    await createDefaultUserAndRoom();
  })
  .catch((err) => console.error('MongoDB connection error:', err));


// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/rooms', async (req, res) => {
  try {
    console.log('방 목록 요청 받음');
    const rooms = await GameRoom.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: '방 목록을 불러오지 못했습니다.' });
  }
});



// Example routes (uncomment and implement as needed)
// const authRoutes = require('./routes/auth');
// app.use('/api/auth', authRoutes);
// const gameRoutes = require('./routes/games');
// app.use('/api/games', gameRoutes);

// User routes
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const room = await GameRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ error: '방을 찾을 수 없습니다.' });
    }
    res.json(room);
  } catch (error) {
    console.error('방 조회 에러:', error);
    res.status(500).json({ error: '방 정보를 불러올 수 없습니다.' });
  }
});
app.post('/api/makeRoom', async (req, res) => {  
  try {
    console.log('방 생성 요청 받음');
    const newRoom = new GameRoom(req.body);
    await newRoom.save();
    res.status(201).json(newRoom);
    io.emit('roomUpdated', newRoom);
    console.log("room in in (roomCreated) : ", newRoom._id);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: '방 생성에 실패했습니다.' });
  }
});

// --- 멀티플레이어 위치 관리용 메모리 ---
const roomPlayers = {};

io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // Join room
  socket.on('joinRoom', async ({ roomId, userId }) => {
    console.log("joinRoom in server");
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    
    const room = await GameRoom.findById(roomId);
    console.log("room id in server (joinRoom) : ", roomId);
    if(!room) {
      socket.emit('joinRoomFail', { error: '방을 찾을 수 없습니다.' });
      return;
    }
    
    // User DB에서 사용자 정보 조회
    const user = await User.findOne({ id: userId });
    if(!user) {
      socket.emit('joinRoomFail', { error: '사용자를 찾을 수 없습니다.' });
      return;
    }
    
    // currentUserNumber 증가 및 저장
    if(room.currentUsers.some(user => user.id === userId)) {
      socket.emit('joinRoomFail', { error: '이미 방에 있습니다.' });
      return;
    }
    if(room.currentUserNumber >= room.maxUsers) {
      socket.emit('joinRoomFail', { error: '방이 꽉 찼습니다.' });
      return;
    }
    // --- 멀티플레이어 위치 관리용: joinRoom에서는 아무것도 하지 않음 ---
    // --- 기존 코드 계속 ---
    room.currentUsers.push({
      id: userId,
      name: user.name, // User DB에서 가져온 실제 이름
      isReady: false
    });
    room.currentUserNumber = room.currentUsers.length;
    await room.save();
    io.emit('roomUpdated', room);
    
    console.log("room.currentUsers in server (joinRoom) : ", room.currentUsers);
    socket.join(roomId);
    io.to(roomId).emit('joinRoomSuccess', {currentUsers : room.currentUsers});
  });

  socket.on('leaveRoom', async ({ roomId , userId}) => {
    console.log("leaveRoom in server, roomId : ", roomId, "userId : ", userId);
    const room = await GameRoom.findById(roomId);
    if(!room) {
      socket.emit('leaveRoomFail', { error: '방을 찾을 수 없습니다.' });
      return;
    }
    if(!room.currentUsers.some(user => user.id === userId)) {
      socket.emit('leaveRoomFail', { error: '방에 있지 않습니다.' });
      return;
    }
    console.log("room.currentUsers in server (leaveRoom) : ", room.currentUsers);
    room.currentUsers = room.currentUsers.filter(user => user.id !== userId);
    room.currentUserNumber = room.currentUsers.length;
    await room.save();
    io.emit('roomUpdated', room);
    socket.leave(roomId);
    io.to(roomId).emit('leaveRoomSuccess', {currentUsers : room.currentUsers});
  });

  // 준비 상태 토글
  socket.on('toggleReady', async ({ roomId, userId }) => {
    console.log("toggleReady in server, roomId : ", roomId, "userId : ", userId);
    const room = await GameRoom.findById(roomId);
    if(!room) {
      socket.emit('toggleReadyFail', { error: '방을 찾을 수 없습니다.' });
      return;
    }
    
    const userIndex = room.currentUsers.findIndex(user => user.id === userId);
    if(userIndex === -1) {
      socket.emit('toggleReadyFail', { error: '방에 있지 않습니다.' });
      return;
    }
    
    // 준비 상태 토글
    room.currentUsers[userIndex].isReady = !room.currentUsers[userIndex].isReady;
    await room.save();
    
    console.log("준비 상태 변경: ", room.currentUsers[userIndex]);
    io.to(roomId).emit('readyStateChanged', { currentUsers: room.currentUsers });
  });

  socket.on('startGame', async ({ roomId, userId }) => {
    console.log("startGame in server, roomId : ", roomId, "userId : ", userId);
    const room = await GameRoom.findById(roomId);
    if(!room) {
      socket.emit('startGameFail', { error: '방을 찾을 수 없습니다.' });
      return;
    }
    // 방장 권한 확인 (첫 번째 참가자가 방장)
    if(room.currentUsers.length === 0 || room.currentUsers[0].id !== userId) {
      socket.emit('startGameFail', { error: '방장만 게임을 시작할 수 있습니다.' });
      return;
    }
    // 2번째부터 4번째 참가자(인덱스 1~3)가 모두 준비 상태인지 확인
    const nonHostParticipants = room.currentUsers.slice(1);
    const allReady = nonHostParticipants.every(participant => participant && participant.isReady);
    if(room.currentUsers.length !== room.maxUsers) {
      socket.emit('startGameFail', { error: '참가자 수가 부족합니다.' });
      return;
    }
    if(!allReady) {
      socket.emit('startGameFail', { error: '아직 준비하지 않은 참가자가 있습니다.' });
      return;
    }
    // 1. status를 PLAYING으로 변경
    room.status = 'PLAYING';
    await room.save();
    // 2. roomPlayers에 네 구석의 고정 위치 할당
    const GAME_WIDTH = 2000;
    const GAME_HEIGHT = 3000;
    const startPositions = [
      { x: GAME_WIDTH/2-100, y: GAME_HEIGHT/2-100 },
      { x: GAME_WIDTH/2+100, y: GAME_HEIGHT/2-100 },
      { x: GAME_WIDTH/2+100, y: GAME_HEIGHT/2+100 },
      { x: GAME_WIDTH/2-200, y: GAME_HEIGHT/2+100 }
    ];
    roomPlayers[roomId] = {};
    room.currentUsers.forEach((user, idx) => {
      const pos = startPositions[idx % startPositions.length];
      roomPlayers[roomId][user.id] = { x: pos.x, y: pos.y, destX: pos.x, destY: pos.y };
    });
    console.log("roomPlayers[roomId] in server (startGame) : ", roomPlayers[roomId]);
    console.log("roomPlayers in server (startGame) : ", roomPlayers);
    // 3. 초기 위치 등 필요한 정보 startGameSuccess로 전달
    io.to(roomId).emit('startGameSuccess', {
      message: '게임이 시작됩니다!',
      roomId,
      initialPlayers: roomPlayers[roomId]
    });
  });
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });

  // 클라이언트에서 이동 명령을 받으면 목표 좌표 갱신
  socket.on('move', ({ roomId, userId, x, y }) => {
    console.log("move in server, roomId : ", roomId, "userId : ", userId, "x : ", x, "y : ", y);
    if (roomPlayers[roomId] && roomPlayers[roomId][userId]) {
      roomPlayers[roomId][userId].destX = x;
      roomPlayers[roomId][userId].destY = y;
    }
  });
});

// 모든 방의 플레이어 위치를 주기적으로 broadcast (status가 PLAYING인 방만)
setInterval(async () => {
  try {
    const playingRooms = await GameRoom.find({ status: 'PLAYING' });
    for (const room of playingRooms) {
      const roomId = room._id.toString();
      if (roomPlayers[roomId]) {
        // 위치 보간: x, y를 destX, destY로 이동
        Object.values(roomPlayers[roomId]).forEach(p => {
          const dx = p.destX - p.x;
          const dy = p.destY - p.y;
          const dist = Math.hypot(dx, dy);
          const speed = 12; // 서버에서 이동 속도
          if (dist > speed) {
            p.x += (dx / dist) * speed;
            p.y += (dy / dist) * speed;
          } else {
            p.x = p.destX;
            p.y = p.destY;
          }
        });
        io.to(roomId).emit('playersUpdate', { players: roomPlayers[roomId] });
      }
    }
  } catch (err) {
    console.error('PLAYING 방 위치 브로드캐스트 에러:', err);
  }
}, 60); // 약 16fps

// roomPlayers의 초기 위치 정보를 반환하는 API
app.get('/api/roomPlayers/:roomId', (req, res) => {
  const { roomId } = req.params;
  if (!roomPlayers[roomId]) {
    return res.status(404).json({ error: '해당 방의 플레이어 정보가 없습니다.' });
  }
  console.log("roomPlayers[roomId] in server GET REQUEST: ", roomPlayers[roomId]);
  res.json({ players: roomPlayers[roomId] });
});

// Start server

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});