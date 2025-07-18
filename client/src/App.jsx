import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/lobby/:username" element={<LobbyPage />} />
        <Route path="/waiting/:roomId/:username" element={<WaitingRoom />} />
      </Routes>
    </Router>
  );
}
export default App;
