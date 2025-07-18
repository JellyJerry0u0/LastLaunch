// server/src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const GameRoom = require('./models/room');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());



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
app.post('/api/makeRoom', async (req, res) => {  
  try {
    console.log('방 생성 요청 받음');
    const newRoom = new GameRoom(req.body);
    await newRoom.save();
    res.status(201).json(newRoom);
    io.emit('roomCreated', newRoom);
    console.log("room in in (roomCreated) : ", newRoom._id);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: '방 생성에 실패했습니다.' });
  }
});
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // Join room
  socket.on('joinRoom', async ({ roomId, userName }) => {
    console.log("joinRoom in server");
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    const room = await GameRoom.findById(roomId);
    console.log("room id in server (joinRoom) : ", roomId);
    if(!room) {
      socket.emit('roomJoinedFail', { error: '방을 찾을 수 없습니다.' });
      return;
    }
    // currentUserNumber 증가 및 저장
    room.currentUserNumber++;
    await room.save();
    // 모든 클라이언트에 방 정보 브로드캐스트
    io.emit('roomUpdated', room);
  });

  // Broadcast messages
  socket.on('message', (data) => {
    io.to(data.roomId).emit('message', data);
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
