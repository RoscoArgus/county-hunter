import React, { useState, useEffect } from 'react';
import styles from './LobbyView.module.css';
import Map from '../../components/Map/Map';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getDistanceInMeters } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';
import { STARTING_RANGE } from '../../constants';
import { updatePlayer, startGame, leaveGame, deleteLobby } from '../../utils/game';
import RoundStatistics from '../../components/RoundStatistics/RoundStatistics';
import { useNavigate } from 'react-router-dom';
import { FaInfo, FaChartBar, FaUsers } from 'react-icons/fa';
import { FaCopy } from 'react-icons/fa6';

const LobbyView = ({ gameCode, lobbyData, isHost, gameOptions, playerLocation }) => {
  const [sortedPlayers, setSortedPlayers] = useState([]);
  const [mapPlayers, setMapPlayers] = useState([]);
  const [infoToDisplay, setInfoToDisplay] = useState('players');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isWithinRange = (playerLocation, targetLocation, range) => {
    if(!playerLocation || !targetLocation || !range) return false;

    const distance = getDistanceInMeters(
      playerLocation.latitude, 
      playerLocation.longitude, 
      targetLocation.latitude, 
      targetLocation.longitude
    );
    
    return distance <= range;
  };

  const handleLeaveGame = () => {
    const confirmed = window.confirm(`${isHost ? 'Leaving will close this lobby.' : ''} Are you sure you want to leave?`);
    if(!confirmed) return;
    leaveGame(gameCode, currentUser);
    if(isHost) 
      deleteLobby(gameCode);
    navigate('/');
  };

  const copyCurrentUrlToClipboard = () => {
    const currentUrl = window.location.href; // Get the current URL
    navigator.clipboard.writeText(currentUrl) // Copy the URL to the clipboard
      .then(() => {
          console.log('URL copied to clipboard!');
      })
      .catch(err => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy the URL.');
      });
  }


  const allPlayersInRange = () => {
    // if there are less than 2 players in the lobby, return false
    if(Object.keys(lobbyData.players).length < 2) return false;
    return Object.values(lobbyData.players).every(player => player.inRange);
  };

  useEffect(() => {
    if (!gameOptions) return;

    if (isWithinRange(playerLocation, gameOptions.startingLocation.location, STARTING_RANGE) && !lobbyData.players[currentUser.uid].inRange) {
      updatePlayer('inRange', true, gameCode, currentUser);
    }
    else if (!isWithinRange(playerLocation, gameOptions.startingLocation.location, STARTING_RANGE) && lobbyData.players[currentUser.uid].inRange) {
      updatePlayer('inRange', false, gameCode, currentUser);
    }
  }, [playerLocation]);

  useEffect(() => {
    if(lobbyData) {
      setSortedPlayers(Object.entries(lobbyData.players).sort(([key1, player1], [key2, player2]) => {
        if (key1 === lobbyData.host) return -1;
        if (key2 === lobbyData.host) return 1;
        return 0;
      }));
    }
  }, [lobbyData]);

  useEffect(() => {
    if (!lobbyData) return;
    const fetchPlayerData = async () => {
        const players = lobbyData.players;
        const newPlayers = await Promise.all(
            Object.keys(players)
                .filter(playerId => playerId !== currentUser.uid)
                .map(async (playerId) => {
                    const playerDoc = await getDoc(doc(db, 'users', playerId));
                    const playerData = playerDoc.data();

                    return {
                        displayName: players[playerId].username,
                        location: players[playerId].location,
                        photoURL: playerData?.photoURL || null
                    };
                })
        );

        setMapPlayers(newPlayers);
    };

    fetchPlayerData();
  }, [lobbyData?.players, currentUser.uid]);

  return (
    <div className={styles.LobbyView}>
      <div className={styles.lobbyLeft}>
        <div className={styles.lobbyCode}>
          <h1>Lobby Code: {gameCode}</h1>
          <FaCopy className={styles.icon} onClick={copyCurrentUrlToClipboard}/>
        </div>
        {lobbyData && (
          <div className={styles.playerInfo}>
            <div className={styles.players}>
              <h3>Players:</h3>
              <ul>
                {sortedPlayers.map(([userId, player]) => (
                  <li key={userId}>
                    {
                      userId === lobbyData.host
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
        <div className={styles.stats}>
          <RoundStatistics players={sortedPlayers.slice(1)} label={'Previous Round:'}/>
        </div>
        <div className={styles.mobileInfo}>
          <span className={styles.infoButtons}>
            <button className={`${styles.players} ${infoToDisplay==='players' ? styles.selected : ''}`} onClick={() => setInfoToDisplay('players')}><FaUsers className={styles.icon} /></button>
            <button className={`${styles.scores} ${infoToDisplay==='scores' ? styles.selected : ''}`} onClick={() => setInfoToDisplay('scores')}><FaChartBar className={styles.icon} /></button>
            <button className={`${styles.info} ${infoToDisplay==='details' ? styles.selected : ''}`} onClick={() => setInfoToDisplay('details')}><FaInfo className={styles.icon} /></button>
          </span>
          { infoToDisplay === 'players' && lobbyData && 
            <div className={styles.playerInfo}>
              <div className={styles.players}>
                <h3>Players:</h3>
                <ul>
                  {sortedPlayers.map(([userId, player]) => (
                    <li key={userId}>
                      {
                        userId === lobbyData.host
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
          }
          { infoToDisplay === 'scores' && <RoundStatistics players={sortedPlayers.slice(1)} label={'Previous Round:'}/> }
          { infoToDisplay === 'details' && 
            <div className={styles.gameDetails}>
              <h2>Game Details:</h2>
              <div><strong>Title:</strong> {gameOptions?.title}</div>
              <div><strong>Creator:</strong> {gameOptions?.creator}</div>
              <div><strong>Game Mode:</strong> {gameOptions?.gameMode.charAt(0).toUpperCase().concat(gameOptions?.gameMode.slice(1))}</div>
              <div><strong>Starting Location:</strong> {gameOptions?.startingLocation.locationName}</div>
              <div><strong>Targets:</strong> {gameOptions?.targets.length}</div>
              <div><strong>Time Limit:</strong> {lobbyData?.timeLimit} minutes</div>
              <div><strong>Max Players:</strong> {lobbyData?.maxPlayers}</div>
            </div>
          }
        </div>
      </div>
      <div className={styles.lobbyRight}>
        <div className={styles.map}>
          <Map
            playerLocation={playerLocation}
            startingLocation={gameOptions?.startingLocation}
            circles={isHost ? gameOptions?.targets?.map(target => ({
              ...target,
              latitude: target.location.latitude,
              longitude: target.location.longitude,
              location: null
            }))
            .sort((a, b) => a.isSelected - b.isSelected) // Sort to ensure selected circle is rendered on top
            : []}
            gameMode='lobby'
            players={mapPlayers}
          />
        </div>
        <div className={styles.gameDetails}>
          <h3>Game Details:</h3>
          <div><strong>Title:</strong> {gameOptions?.title}</div>
          <div><strong>Creator:</strong> {gameOptions?.creator}</div>
          <div><strong>Game Mode:</strong> {gameOptions?.gameMode.charAt(0).toUpperCase().concat(gameOptions?.gameMode.slice(1))}</div>
          <div><strong>Starting Location:</strong> {gameOptions?.startingLocation.locationName}</div>
          <div><strong>Targets:</strong> {gameOptions?.targets.length}</div>
          <div><strong>Time Limit:</strong> {lobbyData?.timeLimit} minutes</div>
          <div><strong>Max Players:</strong> {lobbyData?.maxPlayers}</div>
        </div>
        <div className={styles.buttons}>
          {isHost && (
            <button 
              className={styles.startButton}
              onClick={() => startGame(gameCode, gameOptions.targets)}
              disabled={!allPlayersInRange()}
            >
              <h2>Start Game</h2>
            </button>
          )}
          <button 
            className={styles.leaveButton}
            onClick={() => handleLeaveGame()}
          >
            <h2>{isHost ? 'Close Lobby' : 'Leave Game'}</h2>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbyView;
