// src/pages/GameHandler/GameHandler.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { startGame } from '../../utils/game';
import { useUsername } from '../../context/UsernameContext';
import LobbyView from '../LobbyView/LobbyView';
import GameView from '../GameView/GameView';

const db = getDatabase();

const GameHandler = () => {
  const { gameCode } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting' or 'in-progress'
  const { username } = useUsername();

  useEffect(() => {
    if (gameCode) {
      const lobbyRef = ref(db, `games/${gameCode}`);
      const handleDataChange = (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLobbyData(data);
          setIsHost(data.creator === username);
          setGameStatus(data.status); // assuming 'status' field tracks game status
        }
      };
      // Attach listener
      onValue(lobbyRef, handleDataChange);

      // Clean up listener on unmount
      return () => {
        off(lobbyRef, 'value', handleDataChange);
      };
    }
  }, [gameCode, username]);

  const handleStartGame = async () => {
    await startGame(gameCode);
  };

  if (gameStatus === 'in-progress') {
    return <GameView presetId={lobbyData.presetId} />;
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