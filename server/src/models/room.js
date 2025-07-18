const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,        // 방 제목은 반드시 필요
    // unique: true,          // 중복 방 제목을 허용하지 않음
    trim: true,            // 앞뒤 공백 제거
  },
  currentUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  currentUserNumber: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },
  maxUsers: {
    type: Number,
    default: 4,
    min: 0,                // 최소 인원
    max: 4                 // 최대 인원 한도(비즈니스 로직에 따라 조정)
  },
  status: {
    type: String,
    enum: ['LOBBY', 'PLAYING', 'FINISHED'],
    default: 'LOBBY'
  }
}, {
  timestamps: true         // createdAt, updatedAt 자동 관리 → 수동 정의 불필요
});

// **인덱스 추가 예시**
// 빈 방을 빠르게 조회할 때 유용
roomSchema.index({ status: 1, currentUsers: 1 });

/** 
 * 예시: 인스턴스 메서드
 * 방 참가 처리 로직을 캡슐화
 */
roomSchema.methods.join = function(userId) {
  if (this.currentUsers.length >= this.maxUsers) {
    throw new Error('방이 가득 찼습니다.');
  }
  if (this.currentUsers.includes(userId)) return this;
  this.currentUsers.push(userId);
  return this.save();
};


module.exports = mongoose.model('GameRoom', roomSchema);
