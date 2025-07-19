import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';
import MainGame from './pages/MainGame';
import './App.css';
import TitleScreen from './pages/TitleScreen';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { AudioProvider } from './contexts/AudioContext';
import AudioControl from './components/AudioControl';

function App() {
  return (
    <AudioProvider>
      <Router>
        <AudioControl />
        <Routes>
          <Route path="/lobby/:userId" element={<LobbyPage />} />
          <Route path="/waiting/:roomId/:userId" element={<WaitingRoom />} />
          <Route path="/" element={<TitleScreen />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/maingame" element={<MainGame />} />
        </Routes>
      </Router>
    </AudioProvider>
  );
}
export default App;
