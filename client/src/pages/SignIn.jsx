import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "../contexts/AudioContext";
import { useUser } from '../contexts/UserContext';

const TYPING_SPEED = 70; // ms per character
const TV_ON_DURATION = 700; // ms
const LABELS = [
  { key: 'id', text: 'ID' },
  { key: 'pw', text: 'PW' },
  { key: 'btn', text: 'Sign In' },
];

const SignIn = () => {
  const [form, setForm] = useState({ id: '', pw: '' });
  const [typedLabels, setTypedLabels] = useState(['', '', '']);
  const [focus, setFocus] = useState({ id: false, pw: false });
  const [tvOn, setTvOn] = useState(true);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { stopMusic } = useAudio();
  const { login } = useUser();

  // 페이지 진입 시 음악 정지
  useEffect(() => {
    stopMusic();
  }, [stopMusic]);

  // TV ON 애니메이션 후 폼 표시
  useEffect(() => {
    const timeout = setTimeout(() => setTvOn(false), TV_ON_DURATION);
    return () => clearTimeout(timeout);
  }, []);

  // 타이핑 애니메이션 (순차적으로)
  useEffect(() => {
    if (tvOn) return;
    let idx = 0;
    let charIdx = 0;
    let typing = true;
    let newTyped = ['', '', ''];
    function typeNext() {
      if (!typing) return;
      if (idx >= LABELS.length) return;
      if (charIdx < LABELS[idx].text.length) {
        newTyped[idx] = LABELS[idx].text.slice(0, charIdx + 1);
        setTypedLabels([...newTyped]);
        charIdx++;
        setTimeout(typeNext, TYPING_SPEED);
      } else {
        idx++;
        charIdx = 0;
        setTimeout(typeNext, TYPING_SPEED * 2);
      }
    }
    typeNext();
    return () => { typing = false; };
  }, [tvOn]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = e => {
    setFocus(f => ({ ...f, [e.target.name]: true }));
  };
  const handleBlur = e => {
    setFocus(f => ({ ...f, [e.target.name]: false }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    setToken("");
    setLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id, pw: form.pw })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('로그인 성공!');
        setToken(data.token);
        if (data.name) {
          login(form.id, data.name); // 전역 상태 갱신
        }
        navigate(`/lobby/${form.id}`);
      } else {
        setMessage(data.message || '로그인 실패');
      }
    } catch (err) {
      setMessage('서버 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-bg">
      <style>{`
        .signup-bg {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0; left: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .tv-on-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          z-index: 9999;
          pointer-events: all;
          animation: tv-on-anim 0.7s cubic-bezier(.4,2,.6,1) forwards;
        }
        @keyframes tv-on-anim {
          0% {
            transform: scaleY(0);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          80% {
            transform: scaleY(0.04);
            opacity: 1;
          }
          100% {
            transform: scaleY(1);
            opacity: 0;
          }
        }
        .signup-form {
          min-width: 320px;
          padding: 32px;
          border-radius: 12px;
          background: rgba(0,0,0,0.7);
          box-shadow: 0 0 32px #000;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .signup-label {
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.1rem;
          margin: 0 0 4px 0;
          text-align: left;
          display: inline-block;
          min-width: 90px;
          letter-spacing: 0.04em;
        }
        .signup-input-wrap {
          display: inline-block;
          position: relative;
          width: 180px;
          margin-left: 4px;
        }
        .signup-input {
          width: 100%;
          padding: 6px 0 6px 0;
          font-size: 1.1rem;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          background: transparent;
          color: #fff;
          border: none;
          outline: none;
          box-sizing: border-box;
          text-align: center;
        }
        .signup-input-wrap:after {
          content: '';
          display: block;
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 2px;
          background: #fff;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s cubic-bezier(.4,2,.6,1);
        }
        .signup-input-wrap.focused:after {
          transform: scaleX(1);
        }
        .signup-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .signup-btn {
          background: none;
          border: none;
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.1rem;
          cursor: pointer;
          margin: 24px 0 0 0;
          padding: 0;
          font-weight: 700;
          transition: text-shadow 0.2s;
          letter-spacing: 0.04em;
        }
        .signup-btn:hover {
          text-shadow: 0 0 12px #fff, 0 0 8px #fff;
        }
        .signup-message {
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1rem;
          margin-top: 16px;
          min-height: 1.2em;
        }
        .signin-token {
          color: #0ff;
          font-size: 0.95rem;
          margin-top: 8px;
          word-break: break-all;
        }
      `}</style>
      {tvOn && <div className="tv-on-overlay" />}
      {!tvOn ? (
        <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="signup-row">
            <label className="signup-label" htmlFor="id">{typedLabels[0]}</label>
            <span className={`signup-input-wrap${focus.id ? ' focused' : ''}`}>
              <input className="signup-input" id="id" name="id" autoComplete="username" value={form.id} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <div className="signup-row">
            <label className="signup-label" htmlFor="pw">{typedLabels[1]}</label>
            <span className={`signup-input-wrap${focus.pw ? ' focused' : ''}`}>
              <input className="signup-input" id="pw" name="pw" type="password" autoComplete="current-password" value={form.pw} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <button type="submit" className="signup-btn" disabled={loading}>
            {typedLabels[2]}
          </button>
          <div className="signup-message">{message}</div>
          {token && <div className="signin-token">token: {token}</div>}
        </form>
      ) : null}
    </div>
  );
};

export default SignIn; 