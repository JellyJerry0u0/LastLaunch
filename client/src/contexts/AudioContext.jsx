import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // 오디오 객체 생성
    audioRef.current = new Audio('/audio/background-music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 1.0;

    // 오디오 로드 완료 시 이벤트
    audioRef.current.addEventListener('canplaythrough', () => {
      console.log('배경음악 로드 완료');
    });

    // 오디오 에러 처리
    audioRef.current.addEventListener('error', (e) => {
      console.error('배경음악 로드 실패:', e);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playMusic = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        setShouldPlay(true);
      }).catch((error) => {
        console.error('음악 재생 실패:', error);
      });
    }
  };

  const pauseMusic = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setShouldPlay(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const value = {
    isPlaying,
    isMuted,
    hasStarted,
    shouldPlay,
    playMusic,
    pauseMusic,
    stopMusic,
    toggleMute
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}; 