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


async function createDefaultUser() {
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
    await createDefaultUser();
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
    
    // 새로운 구조로 유저 추가 (실제 이름 사용)
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
    
    // 게임 시작 성공
    console.log("게임 시작됨: ", roomId);
    io.to(roomId).emit('startGameSuccess', { 
      message: '게임이 시작됩니다!',
      roomId: roomId 
    });
  });
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});
// Start server

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});