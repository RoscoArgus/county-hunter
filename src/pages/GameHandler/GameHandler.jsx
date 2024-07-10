import { ref, onValue, onDisconnect, set, off } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LobbyView from '../LobbyView/LobbyView';
import GameView from '../GameView/GameView';
import { startGame } from '../../utils/game';
import useGeolocation from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';

const GameHandler = () => {
  const { gameCode } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameOptions, setGameOptions] = useState(null);

  const playerLocation = useGeolocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (gameCode) {
      const lobbyRef = ref(rtdb, `games/${gameCode}`);
      const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);

      const handleDataChange = (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLobbyData(data);
          setIsHost(data.host === currentUser.uid);
          setGameStatus(data.status);
        } else {
          alert("This game does not exist");
        }
      };

      onValue(lobbyRef, handleDataChange);

      // Handle online presence
      const connectedRef = ref(rtdb, '.info/connected');
      onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Mark user as online
          set(playerRef, { username: currentUser.displayName, score: 0, online: true, inRange: false });

          // Handle disconnection
          onDisconnect(playerRef).set({
            username: currentUser.displayName,
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
  }, [gameCode]);

  useEffect(() => {
    const fetchGameOptions = async () => {
      if (lobbyData?.presetId) {
        const gameDocRef = doc(db, 'presets', lobbyData.presetId);
        const gameDoc = await getDoc(gameDocRef);

        if (gameDoc.exists()) {
          const gameData = gameDoc.data();
          const updatedGameOptions = {
            ...gameData,
            mode: 'classic',
            range: 100,
          };
          setGameOptions(updatedGameOptions);
        } else {
          console.error("No such document!");
        }
      }
    };

    fetchGameOptions();
  }, [lobbyData]);

  const handleStartGame = async () => {
    await startGame(gameCode);
  };

  if (gameStatus === 'in-progress') {
    return (
      <GameView 
        presetId={lobbyData.presetId} 
        isHost={isHost} 
        lobbyData={lobbyData} 
        gameCode={gameCode}
        initGameOptions={gameOptions}
        playerLocation={playerLocation}
      />
    );
  }

  return (
    <LobbyView
      gameCode={gameCode}
      lobbyData={lobbyData}
      isHost={isHost}
      handleStartGame={handleStartGame}
      gameOptions={gameOptions}
      playerLocation={playerLocation}
    />
  );
};

export default GameHandler;
