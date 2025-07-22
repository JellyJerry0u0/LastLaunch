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
  for(let i = 1; i <= 8; i++) {
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
  const defaultRoom = await GameRoom.findOne({ title: '경리방' });
  if (!defaultRoom) {
    await GameRoom.create({
      title: '경리방',
      currentUsers: [],
      currentUserNumber: 0,
      maxUsers: 4,
      status: 'LOBBY'
    });
    console.log('경리방이 생성되었습니다.');
  }
  const defaultRoomj = await GameRoom.findOne({ title: '재민방' });
  if (!defaultRoomj) {
    await GameRoom.create({
      title: '재민방',
      currentUsers: [],
      currentUserNumber: 0,
      maxUsers: 4,
      status: 'LOBBY'
    });
    console.log('재민방이 생성되었습니다.');
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

app.get('/api/rooms', async (req, res) => {
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
const roomOres = {};
const roomItems = {};
const roomPortals = {};

io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // 전체 채팅 메시지 브로드캐스트
  socket.on('chat', (msg) => {
    io.emit('chat', msg);
  });

  socket.on("disablePortal", ({ roomId, portalId, scene }) => {
    if(roomPortals[roomId] === undefined) {
      roomPortals[roomId] = {};
    }
    if(roomPortals[roomId][scene] === undefined) {
      roomPortals[roomId][scene] = {};
    }
    console.log("disablePortal in server, roomId : ", roomId, "portalId : ", portalId);
    roomPortals[roomId][scene][portalId] = false;
    io.to(roomId + "_" + scene).emit('portalStatus', { portals: roomPortals[roomId][scene] });
  });
  
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
    
    // 3. 초기 위치 등 필요한 정보 startGameSuccess로 전달
    io.to(roomId).emit('startGameSuccess', {
      message: '게임이 시작됩니다!',
      roomId,
    });
  });
  socket.on('join_scene', ({ roomId : roomId, userId : userId, scene : scene, position : position }) => {
    if(roomPlayers[roomId] === undefined) {
      roomPlayers[roomId] = {};
    }
    if(roomPlayers[roomId][scene] === undefined) {
      roomPlayers[roomId][scene] = {};
    }
    if(roomOres[roomId] === undefined) {
      roomOres[roomId] = {};
    }
    if(roomOres[roomId][scene] === undefined) {
      // === FarmScene에 처음 진입하면 10개의 광석 생성 ===
      if (scene === 'FarmScene') {
        roomOres[roomId][scene] = [];
        for (let i = 0; i < 10; i++) {
          console.log("ore-${Date.now()}-${Math.random()} : ", `ore-${Date.now()}-${Math.random()}`);
          roomOres[roomId][scene].push({
            id: `ore-${Date.now()}-${Math.random()}`,
            x: Math.floor(Math.random() * 900 + 100),
            y: Math.floor(Math.random() * 500 + 100),
            hp: 3,
            type: 'iron'
          });
        }
        socket.emit('roomOresGet', roomOres[roomId][scene]);
      } else {
        roomOres[roomId][scene] = [];
      }
    } else {
      socket.emit('roomOresGet', roomOres[roomId][scene]);
    }
    socket.join(roomId + "_" + scene);
    if(userId === undefined) {
      console.log("userId is undefined in server (join_scene)");
    }
    roomPlayers[roomId][scene][userId] = { x: position.x, y: position.y, destX: position.x, destY: position.y};
    // console.log("roomPlayers[roomId][scene][userId] in server (join_scene) : ", roomPlayers[roomId][scene][userId]);
  });
  socket.on('itemPick', ({ roomId, scene, itemId }) => {
    if (roomItems[roomId] && roomItems[roomId][scene]) {
      const itemsArr = roomItems[roomId][scene];
      const idx = itemsArr.findIndex(item => item.id === itemId);
      if (idx !== -1) {
        const pickedItem = itemsArr[idx];
        itemsArr.splice(idx, 1); // 배열에서 제거
        // 아이템 업데이트 브로드캐스트
        io.to(roomId + "_" + scene).emit('itemsUpdate', itemsArr);
        // 인벤토리 추가 이벤트(oreCollected와 동일하게)
        io.to(socket.id).emit('oreCollected', {
          type: pickedItem.type,
          name: pickedItem.type,
          imageKey: pickedItem.type
        });
      }
    }
  });
  socket.on('oreHit', ({ roomId, scene, oreId, damage }) => {
    if (
      roomOres[roomId] &&
      roomOres[roomId][scene]
    ) {
      const oresArr = roomOres[roomId][scene];
      const ore = oresArr.find(o => o.id === oreId);
      if (ore) {
        ore.hp -= damage;
        if (ore.hp <= 0) {
          // 배열에서 제거
          const idx = oresArr.findIndex(o => o.id === oreId);
          if (idx !== -1) oresArr.splice(idx, 1);
          // === 아이템 생성 ===
          if (!roomItems[roomId]) roomItems[roomId] = {};
          if (!roomItems[roomId][scene]) roomItems[roomId][scene] = [];
          roomItems[roomId][scene].push({
            id: `item-${Date.now()}-${Math.random()}`,
            x: ore.x,
            y: ore.y,
            type: ore.type,
            amount: 1
          });
          io.to(roomId + "_" + scene).emit('itemsUpdate', roomItems[roomId][scene]);
        }
        // oresUpdate emit
        io.to(roomId + "_" + scene).emit('oresUpdate', oresArr);
        if (oresArr.length === 0) {
          setTimeout(() => {
            for (let i = 0; i < 3; i++) {
              oresArr.push({
                id: `ore-${Date.now()}-${Math.random()}`,
                x: Math.floor(Math.random() * 900 + 100),
                y: Math.floor(Math.random() * 500 + 100),
                hp: 3,
                type: 'iron'
              });
            }
            io.to(roomId + "_" + scene).emit('oresUpdate', oresArr);
          }, 5000); // 5초 후 리젠 (원하는 시간으로 조정)
        }
      }
    }
  });
  socket.on('leave_scene', ({ roomId, userId, scene }) => {
    console.log("leave_scene in server, roomId : ", roomId, "userId : ", userId, "scene : ", scene);
    if(roomPlayers[roomId] && roomPlayers[roomId][scene] && roomPlayers[roomId][scene][userId]) {
      delete roomPlayers[roomId][scene][userId];
      console.log("socket.leave!!!")
      socket.leave(roomId + "_" + scene);
      io.to(roomId + "_" + scene).emit('playersUpdate', { players: roomPlayers[roomId][scene] });
    }
  });
  socket.on('move', ({ roomId, userId, scene, x, y }) => {
    console.log("move in server, roomId : ", roomId, "userId : ", userId, "scene : ", scene, "x : ", x, "y : ", y);
    if(roomPlayers[roomId] && roomPlayers[roomId][scene] && roomPlayers[roomId][scene][userId]) {
      roomPlayers[roomId][scene][userId].destX = x;
      roomPlayers[roomId][scene][userId].destY = y;
    }
  });
  socket.on('teleport', ({ roomId, userId, scene, x, y }) => {
    if (
      roomPlayers[roomId] &&
      roomPlayers[roomId][scene] &&
      roomPlayers[roomId][scene][userId]
    ) {
      // 즉시 위치를 바꾼다
      roomPlayers[roomId][scene][userId].x = x;
      roomPlayers[roomId][scene][userId].y = y;
      roomPlayers[roomId][scene][userId].destX = x;
      roomPlayers[roomId][scene][userId].destY = y;
      // 즉시 동기화
      io.to(roomId + "_" + scene).emit('playersUpdate', { players: roomPlayers[roomId][scene], isTeleport: true });
    }
  });
  // 글러브 스킬(밀어내기) 처리
  socket.on('gloveSkill', ({ roomId, scene, fromId, toId, direction }) => {
    if (
      roomPlayers[roomId] &&
      roomPlayers[roomId][scene] &&
      roomPlayers[roomId][scene][toId]
    ) {
      const player = roomPlayers[roomId][scene][toId];
      const pushPower = 400; // 훨씬 더 멀리 밀어냄
      let dx = 0, dy = 0;
      switch (direction) {
        case 'down': dy = pushPower; break;
        case 'up': dy = -pushPower; break;
        case 'left': dx = -pushPower; break;
        case 'right': dx = pushPower; break;
      }
      player.destX += dx;
      player.destY += dy;
      player.x += dx;
      player.y += dy;
      // playersUpdate는 setInterval에서 자동 emit됨
    }
  });
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });

  // 클라이언트에서 이동 명령을 받으면 목표 좌표 갱신


  // 씬 이동 이벤트 처리

});

// 모든 방의 플레이어 위치를 주기적으로 broadcast (status가 PLAYING인 방만)
setInterval(async () => {
  try {
    // roomPlayers = { roomId: { scene: { userId: { ... } } } }
    Object.entries(roomPlayers).forEach(([roomId, scenesObj]) => {
      Object.entries(scenesObj).forEach(([scene, usersObj]) => {
        const userIds = Object.keys(usersObj);
        if (userIds.length > 0) {
          // 위치 보간
          userIds.forEach(userId => {
            const p = usersObj[userId];
            const dx = p.destX - p.x;
            const dy = p.destY - p.y;
            const dist = Math.hypot(dx, dy);
            const speed = 6;
            if (dist > speed) {
              p.x += (dx / dist) * speed;
              p.y += (dy / dist) * speed;
            } else {
              p.x = p.destX;
              p.y = p.destY;
            }
          });
          // emit to roomId_scene
          io.to(roomId + "_" + scene).emit('playersUpdate', { players: usersObj });
        }
      });
    });
  } catch (err) {
    console.error('PLAYING 방 위치 브로드캐스트 에러:', err);
  }
}, 60);

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