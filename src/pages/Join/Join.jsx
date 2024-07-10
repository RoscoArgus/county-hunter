import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinLobby, createLobby } from '../../utils/game';

const Join = () => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinLobby = async () => {
    //TODO REMOVE
    setError('');
    try {
      //await joinLobby(gameCode, username);
      navigate(`/game/${gameCode}`);
    } catch (error) {
        console.error(error);
      setError(error.message);
    }
  };

  const handleCreateLobby = async () => {
    //TODO REMOVE
    setError('');
    try {
      //const newGameCode = await createLobby(username); // Assuming createLobby returns a new game code
      navigate(`/game/${newGameCode}`);
    } catch (error) {
        console.error(error);
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Join or Create a Lobby</h1>
      <div>
        <input
          type="text"
          placeholder="Enter Game Code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />
        <button onClick={handleJoinLobby}>Join Game</button>
        <button onClick={handleCreateLobby}>Create New Game</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Join;
