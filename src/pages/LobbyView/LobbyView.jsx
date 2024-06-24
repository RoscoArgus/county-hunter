import React from 'react';

const LobbyView = ({ gameCode, lobbyData, isHost, handleStartGame }) => {
  return (
    <div>
      <h1>Lobby Code: {gameCode}</h1>
      {lobbyData && (
        <div>
          <h3>Players:</h3>
          <ul>
            {Object.keys(lobbyData.players).map((userId) => (
              <li key={userId}>
                {
                    userId === lobbyData.host
                    ? <strong>{lobbyData.players[userId].username} - Host</strong>
                    : `${lobbyData.players[userId].username} - Score: ${lobbyData.players[userId].score}`
                }
              </li>
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
