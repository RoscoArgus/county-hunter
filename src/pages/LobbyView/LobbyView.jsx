import React, { useState, useEffect } from 'react';
import styles from './LobbyView.module.css';
import Map from '../../components/Map/Map';

const LobbyView = ({ gameCode, lobbyData, isHost, handleStartGame, gameOptions, /*playerLocation*/}) => {
  // TODO TEMPORARY - REMOVE
  const [playerLocation, setPlayerLocation] = useState({latitude: 53.35031835767131, longitude: -6.257572173189157});

  useEffect(() => {
    const handleKeyDown = (event) => {
      const moveDistance = 0.0001;

      switch (event.key) {
        case 'u':
          setPlayerLocation(prevLocation => ({
            ...prevLocation,
            latitude: prevLocation.latitude + moveDistance
          }));
          break;
        case 'j':
          setPlayerLocation(prevLocation => ({
            ...prevLocation,
            latitude: prevLocation.latitude - moveDistance
          }));
          break;
        case 'h':
          setPlayerLocation(prevLocation => ({
            ...prevLocation,
            longitude: prevLocation.longitude - moveDistance
          }));
          break;
        case 'k':
          setPlayerLocation(prevLocation => ({
            ...prevLocation,
            longitude: prevLocation.longitude + moveDistance
          }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // END TEMPORARY

  return (
    <div className={styles.LobbyView}>
      <h1>Lobby Code: {gameCode}</h1>
      {lobbyData && (
        <div className={styles.players}>
          <h3>Players:</h3>
          <ul>
            {Object.keys(lobbyData.players).map((userId) => (
              <li key={userId}>
                {
                    userId === lobbyData.host
                    ? <strong>{lobbyData.players[userId].username} - Host</strong>
                    : lobbyData.players[userId].username
                }
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.map}>
        <Map
          playerLocation={playerLocation}
          startingLocation={gameOptions?.startingLocation}
          gameMode='lobby'
        />
      </div>
    </div>
  );
};

export default LobbyView;
