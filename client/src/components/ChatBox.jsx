import React, { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';
import './ChatBox.css';
import { useUser } from '../contexts/UserContext';

export default function ChatBox() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 채팅 메시지 수신
    socket.on('chat', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off('chat');
    };
  }, []);

  useEffect(() => {
    // 새 메시지 오면 스크롤 하단
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !user) return;
    const msg = {
      userName: user.name,
      text: input,
      time: new Date().toLocaleTimeString().slice(0,5)
    };
    socket.emit('chat', msg);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-messages">
        {messages.map((msg, i) => (
          <div key={i} className={user && msg.userName === user.name ? 'chatbox-msg self' : 'chatbox-msg'}>
            <span className="chatbox-user">{msg.userName}</span>
            <span className="chatbox-text">{msg.text}</span>
            <span className="chatbox-time">{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbox-input-area">
        <input
          className="chatbox-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
        />
        <button className="chatbox-send" onClick={sendMessage}>전송</button>
      </div>
    </div>
  );
} 