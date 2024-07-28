import { ref, onValue, onDisconnect, update, off } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LobbyView from '../LobbyView/LobbyView';
import GameView from '../GameView/GameView';
import { startGame } from '../../utils/game';
import useGeolocation from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { TARGET_RANGE } from '../../constants';

const GameHandler = () => {
  const { gameCode } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameOptions, setGameOptions] = useState(null);

  const playerLocation = useGeolocation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
          navigate('/no-lobby');
        }
      };

      onValue(lobbyRef, handleDataChange);

      // Handle online presence
      const connectedRef = ref(rtdb, '.info/connected');
      onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Mark user as online
          const location = playerLocation ?? { latitude: 0, longitude: 0 };
          update(playerRef, { username: currentUser.displayName, online: true, inRange: false, lastActive: null, location: location});
          // Handle disconnection
          onDisconnect(playerRef).update({
            username: currentUser.displayName,
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

  //TODO I'm concerned this will use a lot of data for the RTDB. Monitor usage.
  useEffect(() => {
    const handleUpdateLocation = () => {
      const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
      if(playerLocation.latitude && playerLocation.longitude)
        update(playerRef, {location: playerLocation});
    };

    handleUpdateLocation();
  }, [playerLocation])

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
            range: TARGET_RANGE,
          };
          setGameOptions(updatedGameOptions);
        } else {
          console.error("No such document!");
        }
      }
    };

    fetchGameOptions();
  }, [lobbyData?.presetId]);

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
        finished={lobbyData.players[currentUser.uid].finished}
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
