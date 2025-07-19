import React, { useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';

const MainGame = () => {
  const { stopMusic } = useAudio();

  // 페이지 진입 시 음악 정지
  useEffect(() => {
    stopMusic();
  }, [stopMusic]);

  return (
    <div>
      <h1>MainGame</h1>
    </div>
  );
};

export default MainGame;