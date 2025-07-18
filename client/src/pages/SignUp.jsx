import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TYPING_SPEED = 70; // ms per character
const TV_ON_DURATION = 700; // ms
const TV_OFF_DURATION = 700; // ms
const MSG_TYPING_SPEED = 80;
const MSGS = ["안녕하세용", "저는바보입니당"];
const LABELS = [
  { key: 'id', text: 'ID' },
  { key: 'pw', text: 'PW' },
  { key: 'name', text: 'Name' },
  { key: 'btn', text: 'Sign Up' },
];

const SignUp = () => {
  const [form, setForm] = useState({ id: '', pw: '', name: '' });
  const [typedLabels, setTypedLabels] = useState(['', '', '', '']);
  const [focus, setFocus] = useState({ id: false, pw: false, name: false });
  const [tvOn, setTvOn] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tvOff, setTvOff] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [msgTyped, setMsgTyped] = useState(["", ""]);
  const [canClick, setCanClick] = useState(false);
  const navigate = useNavigate();

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
    let newTyped = ['', '', '', ''];
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

  // 회원가입 성공 시 TV OFF → 메시지 타이핑 → 클릭 대기
  useEffect(() => {
    if (message !== 'sign up complete') return;
    setTimeout(() => setTvOff(true), 400); // 약간의 딜레이 후 TV OFF
  }, [message]);

  // TV OFF 끝나면 메시지 타이핑 시작
  useEffect(() => {
    if (!tvOff) return;
    const timeout = setTimeout(() => setShowMessage(true), TV_OFF_DURATION);
    return () => clearTimeout(timeout);
  }, [tvOff]);

  // 메시지 타이핑 애니메이션 (끝나면 클릭 대기)
  useEffect(() => {
    if (!showMessage) return;
    let idx = 0;
    let charIdx = 0;
    let typing = true;
    let newMsgTyped = ["", ""];
    function typeMsg() {
      if (!typing) return;
      if (idx >= MSGS.length) {
        setTimeout(() => setCanClick(true), 400);
        return;
      }
      if (charIdx < MSGS[idx].length) {
        newMsgTyped[idx] = MSGS[idx].slice(0, charIdx + 1);
        setMsgTyped([...newMsgTyped]);
        charIdx++;
        setTimeout(typeMsg, MSG_TYPING_SPEED);
      } else {
        idx++;
        charIdx = 0;
        setTimeout(typeMsg, MSG_TYPING_SPEED * 4);
      }
    }
    typeMsg();
    return () => { typing = false; };
  }, [showMessage]);

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
    setLoading(true);
    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('sign up complete');
        setForm({ id: '', pw: '', name: '' });
      } else {
        setMessage(data.message || 'sign up failed');
      }
    } catch (err) {
      setMessage('server error');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 타이핑이 끝난 후 클릭 시 sign in 이동
  const handleTyperClick = () => {
    if (canClick) {
      navigate('/signin');
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
        .tv-off-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          z-index: 9999;
          pointer-events: all;
          animation: tv-off-anim 0.7s cubic-bezier(.4,2,.6,1) forwards;
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
        @keyframes tv-off-anim {
          0% {
            transform: scaleY(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            transform: scaleY(0.04);
            opacity: 1;
          }
          100% {
            transform: scaleY(0);
            opacity: 1;
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
        .signup-typer {
          color: #fff;
          font-family: 'Fira Mono', Consolas, Menlo, Monaco, monospace;
          font-size: 1.3rem;
          text-align: center;
          margin-top: 12vh;
          letter-spacing: 0.04em;
          line-height: 2.2;
          cursor: pointer;
          user-select: none;
        }
        .signup-typer.dim {
          opacity: 0.5;
          cursor: default;
        }
      `}</style>
      {tvOn && <div className="tv-on-overlay" />}
      {tvOff && <div className="tv-off-overlay" />}
      {showMessage ? (
        <div className={`signup-typer${canClick ? '' : ' dim'}`} onClick={handleTyperClick}>
          <div>{msgTyped[0]}</div>
          <div>{msgTyped[1]}</div>
          {canClick && <div style={{fontSize:'0.9rem',marginTop:'2.5em',opacity:0.7}}>(클릭하면 로그인 화면으로 이동)</div>}
        </div>
      ) : !tvOn && !tvOff ? (
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
              <input className="signup-input" id="pw" name="pw" type="password" autoComplete="new-password" value={form.pw} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <div className="signup-row">
            <label className="signup-label" htmlFor="name">{typedLabels[2]}</label>
            <span className={`signup-input-wrap${focus.name ? ' focused' : ''}`}>
              <input className="signup-input" id="name" name="name" value={form.name} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} required />
            </span>
          </div>
          <button type="submit" className="signup-btn" disabled={loading}>
            {typedLabels[3]}
          </button>
          <div className="signup-message">{message}</div>
        </form>
      ) : null}
    </div>
  );
};

export default SignUp; 