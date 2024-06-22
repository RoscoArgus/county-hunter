import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinLobby, createLobby } from '../../utils/game'; // Assuming createLobby function exists

const Join = ({ userId }) => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinLobby = async () => {
    //TODO REMOVE
    const userId = 'roscoargus2';
    setError('');
    try {
      await joinLobby(gameCode, userId);
      navigate(`/lobby/${gameCode}`);
    } catch (error) {
        console.error(error);
      setError(error.message);
    }
  };

  const handleCreateLobby = async () => {
    //TODO REMOVE
    const userId = 'roscoargus';
    setError('');
    try {
      const newGameCode = await createLobby(userId); // Assuming createLobby returns a new game code
      navigate(`/lobby/${newGameCode}`);
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
        <button onClick={handleJoinLobby}>Join Lobby</button>
        <button onClick={handleCreateLobby}>Create New Lobby</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Join;
