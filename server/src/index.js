// server/src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));



// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
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

/*
// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

i o.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // Join room
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
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
*/
// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
