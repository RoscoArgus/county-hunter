// src/pages/LobbyGame/LobbyView.jsx
import React from 'react';

const LobbyView = ({ gameCode, lobbyData, isHost, handleStartGame }) => {
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

export default LobbyView;