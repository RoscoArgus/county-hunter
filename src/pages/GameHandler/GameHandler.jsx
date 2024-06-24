import { getDatabase, ref, onValue, onDisconnect, set, off } from 'firebase/database';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';
import LobbyView from '../LobbyView/LobbyView';
import GameView from '../GameView/GameView';
import { startGame } from '../../utils/game';

const GameHandler = () => {
  const { gameCode } = useParams();
  const { username } = useUsername();
  const db = getDatabase();
  const [lobbyData, setLobbyData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');

  useEffect(() => {
    if (gameCode) {
      const lobbyRef = ref(db, `games/${gameCode}`);
      const playerRef = ref(db, `games/${gameCode}/players/${username}`);

      const handleDataChange = (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLobbyData(data);
          setIsHost(data.creator === username);
          setGameStatus(data.status);
        } else {
          alert("This game does not exist");
        }
      };

      onValue(lobbyRef, handleDataChange);

      // Handle online presence
      const connectedRef = ref(db, '.info/connected');
      onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Mark user as online
          set(playerRef, { username, score: 0, online: true });

          // Handle disconnection
          onDisconnect(playerRef).set({
            username,
            score: 0,
            online: false,
            lastActive: new Date().toISOString()
          });
        }
      });

      return () => {
        off(lobbyRef, 'value', handleDataChange);
      };
    }
  }, [gameCode, username]);

  const handleStartGame = async () => {
    await startGame(gameCode);
  };

  if (gameStatus === 'in-progress') {
    return <GameView presetId={lobbyData.presetId} isHost={isHost} lobbyData={lobbyData} gameCode={gameCode}/>;
  }

  return (
    <LobbyView
      gameCode={gameCode}
      lobbyData={lobbyData}
      isHost={isHost}
      handleStartGame={handleStartGame}
    />
  );
};

export default GameHandler;
