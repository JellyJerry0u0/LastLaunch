import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import './AudioControl.css';

const AudioControl = () => {
  const { isPlaying, playMusic, pauseMusic } = useAudio();
  const location = useLocation();
  
  // 로비 페이지나 웨이팅룸에서만 표시
  const shouldShow = location.pathname.includes('/lobby/') || location.pathname.includes('/waiting/');
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="audio-control">
      <button 
        className={`audio-btn play-pause-btn ${isPlaying ? 'playing' : ''}`}
        onClick={isPlaying ? pauseMusic : playMusic}
        title={isPlaying ? '음악 정지' : '음악 재생'}
      >
        <span>{isPlaying ? '⏸' : '▶'}</span>
      </button>
    </div>
  );
};

export default AudioControl; 