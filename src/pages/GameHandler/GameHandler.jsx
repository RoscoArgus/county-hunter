import { ref, onValue, onDisconnect, update, off, get, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LobbyView from '../LobbyView/LobbyView';
import GameView from '../GameView/GameView';
import { leaveGame, startGame } from '../../utils/game';
import useGeolocation from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { TARGET_RANGE } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { joinLobby } from '../../utils/game';

const GameHandler = () => {
  const { gameCode } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameOptions, setGameOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  const playerLocation = useGeolocation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameCode && joined) {
      const lobbyRef = ref(rtdb, `games/${gameCode}`);
      const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
      const connectedRef = ref(rtdb, '.info/connected');
  
      const handleDataChange = (snapshot) => {
        const data = snapshot.val();
        if (!snapshot.exists()) {
          navigate('/no-lobby');
        } else {
          setLobbyData(data);
          setIsHost(data.host === currentUser.uid);
          setGameStatus(data.status);
          setIsLoading(false);
  
          // Filter out the host by comparing with the host's document ID
          const allPlayersFinished = Object.entries(data.players || {})
            .filter(([playerId, player]) => playerId !== data.host)
            .every(([_, player]) => player.finished === true);
  
          if (allPlayersFinished && data.status !== 'waiting') {
            // Update the status to 'waiting' if all non-host players are finished
            update(lobbyRef, { status: 'waiting' })
              .catch((error) => console.error("Failed to update game status:", error));
          }
        }
      };
  
      // Check if the lobby exists first
      get(lobbyRef).then((snapshot) => {
        if (snapshot.exists()) {
          // Listen to the entire lobby data for any changes
          onValue(lobbyRef, handleDataChange);
  
          // Handle online presence
          onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
              // Mark user as online with location
              const location = playerLocation ?? { latitude: 0, longitude: 0 };
              update(playerRef, { 
                username: currentUser.displayName, 
                online: true, 
                lastActive: null, 
                location: location 
              });
  
              // Handle disconnection
              onDisconnect(playerRef).update({
                username: currentUser.displayName,
                online: false,
                lastActive: new Date().toISOString()
              });
            }
          });
        } else {
          // Lobby doesn't exist, navigate to a different page or handle the error
          console.log("Lobby doesn't exist, navigating to /no-lobby");
          navigate('/no-lobby');
        }
      }).catch((error) => {
        console.error("Error checking lobby existence: ", error);
      });
  
      // Cleanup function to remove the listener when component unmounts or effect re-runs
      return () => {
        off(lobbyRef, 'value', handleDataChange);
        off(connectedRef);
      };
    }
  }, [gameCode, currentUser.uid, playerLocation, navigate, joined]);

  useEffect(() => {
    // when page loads initially, joinGame is called
    const attemptJoin = async () => {
      try {
        await joinLobby(gameCode, currentUser);
        setJoined(true);
      } catch (error) {
        leaveGame(gameCode, currentUser);
        alert('There was an error joining the game. Redirecting home.');
        navigate('/');
      }
    };
    attemptJoin();
  }, []);
  
  
  // TODO: Monitor RTDB usage as this might use significant data.
  useEffect(() => {
    const handleUpdateLocation = () => {
      // Only update location if the lobby exists
      const lobbyRef = ref(rtdb, `games/${gameCode}`);
      get(lobbyRef).then((snapshot) => {
        if (joined && snapshot.exists() && playerLocation.latitude && playerLocation.longitude) {
          const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
          update(playerRef, { location: playerLocation });
        }
      }).catch((error) => {
        console.error("Error checking lobby existence for location update: ", error);
      });
    };
  
    if(joined) {
      handleUpdateLocation();
    }
  }, [playerLocation, gameCode]);
  

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

  if (isLoading) {
    return <LoadingScreen />;
  }

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
