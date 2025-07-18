const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { id, pw, name } = req.body;
    if (!id || !pw || !name) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }
    // 중복 체크
    const exists = await User.findOne({ id });
    if (exists) {
      return res.status(409).json({ message: '이미 존재하는 ID입니다.' });
    }
    // 저장
    const user = new User({ id, pw, name });
    await user.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { id, pw } = req.body;
    if (!id || !pw) {
      return res.status(400).json({ success: false, message: 'ID와 PW를 모두 입력하세요.' });
    }
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(401).json({ success: false, message: '존재하지 않는 ID입니다.' });
    }
    if (user.pw !== pw) {
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, name: user.name },
      'secret-key', // 실제 서비스에서는 환경변수 사용
      { expiresIn: '1h' }
    );
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 오류', error: err.message });
  }
});

module.exports = router; 