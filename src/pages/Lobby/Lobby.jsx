// pages/Lobby/Lobby.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { startGame, getLobbyData } from '../../utils/game';

const db = getDatabase();

const Lobby = ({ userId }) => {
  const { gameCode } = useParams();
  const [lobbyData, setLobbyData] = useState(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (gameCode) {
      const lobbyRef = ref(db, `lobbies/${gameCode}`);

      const handleDataChange = (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLobbyData(data);
          setIsHost(data.host === userId);
        }
      };

      // Attach listener
      onValue(lobbyRef, handleDataChange);

      // Clean up listener on unmount
      return () => {
        off(lobbyRef, 'value', handleDataChange);
      };
    }
  }, [gameCode, userId]);

  const handleStartGame = async () => {
    await startGame(gameCode);
  };

  return (
    <div>
      <h1>Lobby Code: {gameCode}</h1>
      {lobbyData && (
        <div>
          <h3>Players:</h3>
          <ul>
            {lobbyData.players.map((player, index) => (
              <li key={index}>{player}</li>
            ))}
          </ul>
          {isHost && (
            <button onClick={handleStartGame}>Start Game</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;
