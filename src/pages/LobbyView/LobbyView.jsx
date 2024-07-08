import React, { useState, useEffect } from 'react';
import styles from './LobbyView.module.css';
import Map from '../../components/Map/Map';
import { getDistanceInMeters } from '../../utils/calculations';
import { startingRange } from '../../constants';
import { updatePlayer } from '../../utils/game';
import { useUsername } from '../../context/UserContext';

const LobbyView = ({ gameCode, lobbyData, isHost, handleStartGame, gameOptions, playerLocation }) => {
  const { username } = useUsername();
  const [sortedPlayers, setSortedPlayers] = useState([]);

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

  const isWithinRange = (playerLocation, targetLocation, range) => {
    const distance = getDistanceInMeters(
      playerLocation.latitude, 
      playerLocation.longitude, 
      targetLocation.latitude, 
      targetLocation.longitude
    );

    console.log(distance, range);

    return distance <= range;
  };

  useEffect(() => {
    if (!gameOptions) return;

    if (isWithinRange(playerLocation, gameOptions.startingLocation.location, startingRange) && !lobbyData.players[username].inRange) {
      updatePlayer('inRange', true, gameCode, username);
    }
    else if (!isWithinRange(playerLocation, gameOptions.startingLocation.location, startingRange) && lobbyData.players[username].inRange) {
      updatePlayer('inRange', false, gameCode, username);
    }
  }, [playerLocation]);

  useEffect(() => {
    if(lobbyData) {
      setSortedPlayers(Object.entries(lobbyData.players).sort(([key1, player1], [key2, player2]) => {
        if (player1.username === lobbyData.host) return -1;
        if (player2.username === lobbyData.host) return 1;
        return 0;
      }));
    }
  }, [lobbyData]);

  return (
    <div className={styles.LobbyView}>
      <div className={styles.lobbyLeft}>
        <h1>Lobby Code: {gameCode}</h1>
        {lobbyData && (
          <div className={styles.playerInfo}>
            <div className={styles.players}>
              <h3>Players:</h3>
              <ul>
                {sortedPlayers.map(([userId, player]) => (
                  <li key={userId}>
                    {
                      player.username === lobbyData.host
                        ? <strong>{player.username} (Host)</strong>
                        : player.username
                    }
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.inRange}>
              <ul>
                {sortedPlayers.map(([userId, player]) => (
                  <li key={userId}>
                    {
                      player.online
                      ? player.inRange
                        ? <div style={{ color: 'green' }}>In Range</div>
                        : <div style={{ color: 'red' }}>Out of Range</div>
                      : <div style={{ color: 'gray' }}>Away</div>
                    }
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className={styles.lobbyRight}>
        <div className={styles.map}>
          <Map
            playerLocation={playerLocation}
            startingLocation={gameOptions?.startingLocation}
            gameMode='lobby'
          />
        </div>
        <h3>Game Details</h3>
        <div><strong>Starting Location:</strong> {gameOptions?.startingLocation.locationName}</div>
        <div><strong>Targets:</strong> {gameOptions?.gameSize}</div>
        <div><strong>Time Limit:</strong> {lobbyData?.timeLimit}</div>
        <div><strong>Max Players:</strong> {lobbyData?.maxPlayers}</div>
      </div>
    </div>
  );
};

export default LobbyView;