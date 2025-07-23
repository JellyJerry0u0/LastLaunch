import React, { useEffect, useState, useRef } from 'react';
import './SkillBar.css';

const keyLabels = ['A'];

export default function SkillBar({ skills = [null] }) {
  // 글러브 쿨타임 상태
  const [gloveCooldown, setGloveCooldown] = useState(0); // ms 단위
  const cooldownTimer = useRef();

  useEffect(() => {
    const onCooldown = (e) => {
      setGloveCooldown(e.detail.duration);
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      cooldownTimer.current = setInterval(() => {
        setGloveCooldown(prev => {
          if (prev <= 100) {
            clearInterval(cooldownTimer.current);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    };
    window.addEventListener('glove-cooldown', onCooldown);
    return () => {
      window.removeEventListener('glove-cooldown', onCooldown);
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);
  return (
    <div className="skillbar-root">
      <div className="skillbar-slot">
        {/* 스킬 아이콘 영역 (임시 색상) */}
        <div className="skillbar-icon" style={{ background: skills[0]?.color || '#444466' }} />
        {/* Punch.png 이미지 표시 및 쿨타임 */}
        <div style={{position:'relative', width:'40px', height:'40px'}}>
          <img src="/assets/Punch.png" alt="glove" className="skillbar-icon" />
          {gloveCooldown > 0 && (
            <div className="skillbar-cooldown-overlay">
              <span className="skillbar-cooldown-text">{(gloveCooldown/1000).toFixed(1)}</span>
            </div>
          )}
        </div>
        <span className="skillbar-key">A</span>
      </div>
    </div>
  );
}
