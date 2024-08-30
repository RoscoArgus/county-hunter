import React, { useState, useEffect } from 'react';
import { rtdb, db } from '../../config/firebase';
import { ref, update, onValue, get } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import Map from '../../components/Map/Map';
import styles from './GameView.module.css';
import { getDistanceInMeters } from '../../utils/calculations';
import Timer from '../../components/Timer/Timer';
import { endGame } from '../../utils/game';
import { useAuth } from '../../context/AuthContext';
import GuessPrompt from '../../components/GuessPrompt/GuessPrompt';
import { STARTING_RANGE } from '../../constants';
import RoundStatistics from '../../components/RoundStatistics/RoundStatistics';

const GameView = ({ isHost, lobbyData, gameCode, initGameOptions, finished, playerLocation }) => {
  const [gameOptions, setGameOptions] = useState(initGameOptions);
  const [guessPrompt, setGuessPrompt] = useState(false);
  const [locationGuess, setLocationGuess] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [overlappingTargets, setOverlappingTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const { currentUser } = useAuth();
  const [remainingTargets, setRemainingTargets] = useState(null); // State for remaining targets
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [sortedPlayers, setSortedPlayers] = useState([]);

  /*TODO TEMP REMOVE
  const [playerLocation, setPlayerLocation] = useState(null);

  useEffect(() => {
    if (gameOptions?.startingLocation?.location) {
      setPlayerLocation(gameOptions.startingLocation.location);
    }
  }, [gameOptions]);

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
  // END TEMP*/

  const getTargetsInRange = (targets, playerLocation) => {
    if(!playerLocation) return [];
    else if(!targets || targets.length === 0) {
      const distance = getDistanceInMeters(
        playerLocation.latitude,
        playerLocation.longitude,
        gameOptions.startingLocation.location.latitude,
        gameOptions.startingLocation.location.longitude
      );
      setGuessPrompt(!isHost && distance < STARTING_RANGE);
    }
    else {
      return targets.filter(target => {
        const distance = getDistanceInMeters(
          playerLocation.latitude,
          playerLocation.longitude,
          target.randOffset.latitude,
          target.randOffset.longitude
        );
        return distance <= gameOptions.range;
      });
    }
  }

  const updateSelectedTargets = (targets, playerLocation) => {
    if(!targets || targets===undefined || targets?.length === 0) {
      getTargetsInRange(targets, playerLocation);
    }
    if (targets && playerLocation) {
      const targetsInRange = getTargetsInRange(targets, playerLocation);

      setOverlappingTargets(targetsInRange);
      setGuessPrompt(!isHost && targetsInRange?.length > 0);

      // Keep the selected target if it's still in range
      if (!targetsInRange?.find(target => target.id === selectedTargetId)) {
        setSelectedTargetId(targetsInRange?.length === 1 ? targetsInRange[0]?.id : null);
      }
    }
  }

  const useHint = async (type, usedValue, hintValue, selectedId) => {
    const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
    let updatedTargets = [...remainingTargets];
    const targetIndex = updatedTargets.findIndex(target => target.id === selectedId);

    if((type==='reviews' && updatedTargets[targetIndex][type].isUsed !== -1) || 
        updatedTargets[targetIndex][type].isUsed === true) return;

    updatedTargets[targetIndex].value -= hintValue;
    if(updatedTargets[targetIndex].value < 20) // minimum score for a location is 20
      updatedTargets[targetIndex].value = 20;

    updatedTargets[targetIndex][type].isUsed = usedValue;
    await update(playerRef, { 
        remainingTargets: updatedTargets
    });
  }

  useEffect(() => {
    setGameOptions(initGameOptions);
  }, [initGameOptions]);

  useEffect(() => {
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

        setOtherPlayers(newPlayers);
    };

    fetchPlayerData();
    if(lobbyData) {
      setSortedPlayers(Object.entries(lobbyData.players).sort(([key1, player1], [key2, player2]) => {
        if (key1 === lobbyData.host) return -1;
        if (key2 === lobbyData.host) return 1;
        return 0;
      }));
    }
  }, [lobbyData.players, currentUser.uid]);

  useEffect(() => {
    if(gameOptions && playerLocation)
      updateSelectedTargets(remainingTargets, playerLocation);
  }, [playerLocation, gameOptions, selectedTargetId, remainingTargets]);

  const updateBounds = (location) => {
    if (location && window.google && window.google.maps && window.google.maps.LatLng) {
      const sw = new window.google.maps.LatLng(
        location.latitude - 0.05, location.longitude - 0.05);
      const ne = new window.google.maps.LatLng(
        location.latitude + 0.05, location.longitude + 0.05);
      setBounds(new window.google.maps.LatLngBounds(sw, ne));
    }
  };

  useEffect(() => {
    if (playerLocation) {
      updateBounds(playerLocation);
    }
  }, [playerLocation]);

  const handlePlaceChanged = (_, places) => {
    if (places.length != 1) {
      alert('Please select a specific location.');
      return;
    }
    if (places.length > 0) {
      const place = places[0];
      const location = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        id: place.place_id,
        name: place.name
      };

      setLocationGuess(location);
    }
    updateBounds(playerLocation);
  };

  const checkGuess = async () => {
    let guessedCorrectly = false;
    let bonusEligible = true;
    const targetIndex = remainingTargets.findIndex(target => target.id === selectedTargetId);
    const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);

    if (targetIndex !== -1 && locationGuess && locationGuess.id === selectedTargetId) {
        guessedCorrectly = true;
        let value = remainingTargets[targetIndex].value;
        const updatedTargets = [...remainingTargets];
        updatedTargets.splice(targetIndex, 1); // Remove target from remaining targets

        setRemainingTargets(updatedTargets); // Update state
        updateSelectedTargets(updatedTargets, playerLocation);

        // Check if any other player still has this target in their remainingTargets
        for (const playerId in lobbyData.players) {
            if (playerId !== currentUser.uid) { // Skip the current player
                const otherPlayerTargets = lobbyData.players[playerId].remainingTargets || [];
                if (!otherPlayerTargets.some(target => target.id === selectedTargetId)) {
                    bonusEligible = false;
                    break;
                }
            }
        }

        try {
            // Update RTDB with new remaining targets and score
            await update(playerRef, { 
                remainingTargets: updatedTargets,
                score: lobbyData.players[currentUser.uid].score + value + (bonusEligible ? 20 : 0),
            });

            if (getTargetsInRange(updatedTargets, playerLocation)?.length === 0) {
                setGuessPrompt(false);
            }
        } catch (error) {
            console.error('Error updating player data:', error);
        }
        setGuessResult(<pre>{`Correct Guess!\n+${value}` + (bonusEligible ? '\n+20 First-Find Bonus' : '')}</pre>);
    } else {
        if (remainingTargets[targetIndex].value > 20)
            remainingTargets[targetIndex].value -= 5;
        const updatedTargets = [...remainingTargets];

        try {
            // Update RTDB with new remaining targets
            await update(playerRef, { 
                remainingTargets: updatedTargets,
            });
        } catch (error) {
            console.error('Error updating player data:', error);
        }
        setGuessResult('Wrong Guess!');
    }

    setLocationGuess(null);
    setShowResult(true);
    setTimeout(() => setShowResult(false), 5000);
    setTimeout(() => setGuessResult(null), 8000);
  };

  const handleEndGame = async () => {
    // Reference to the player's data
    const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
    
    // Fetch the lobby data to check player statuses
    const lobbyRef = ref(rtdb, `games/${gameCode}/players`);
    const snapshot = await get(lobbyRef);

    let isFirstToFinish = true;

    if (snapshot.exists()) {
        // Check if there's any player who is already finished
        const players = snapshot.val();
        for (const playerId in players) {
            if (playerId !== currentUser.uid && players[playerId].finished) {
                isFirstToFinish = false;
                break;
            }
        }
    }

    // Update player's finish status and completion time
    const updates = {
        finished: true,
        completionTime: lobbyData?.timeLimit * 60 * 1000 - (endTime - Date.now())
    };

    // Add bonus if the player is the first to finish
    if (isFirstToFinish) {
        // award 50 points for being the first to finish
        updates.score = (lobbyData?.players[currentUser.uid]?.score || 0) + 50;
        alert('Congratulations! You are the first to finish! 50 bonus points awarded!');
    } else {
        // award 20 points for finishing at all
        updates.score = (lobbyData?.players[currentUser.uid]?.score || 0) + 20;
        alert('Well done for finishing! 20 bonus points awarded!');
    }

    await update(playerRef, updates);
};


  useEffect(() => {
    const lobbyRef = ref(rtdb, `games/${gameCode}/endTime`);
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      if (snapshot.exists()) {
        setEndTime(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  useEffect(() => {
    setRemainingTargets(lobbyData.players[currentUser.uid].remainingTargets);
  }, [lobbyData]);

  const handleTimeLimitReached = () => {
    endGame(gameCode);
  };

  const handleEarlyEndGame = () => {
    const confirmed = window.confirm('Are you sure you want to end the game early?');
    if(!confirmed) return;
    endGame(gameCode);
  };

  if (!gameOptions || remainingTargets === null) {
    return <div>Loading...</div>;
  }

  if (isHost || finished) {
    return (
      <div className={styles.GameView}>
        <div className={styles.finished}>
          <RoundStatistics players={sortedPlayers.slice(1)} label={'Scores:'}/>  
          {isHost && <button onClick={handleEarlyEndGame} className={styles.endButton}><h2>End Game</h2></button>}
          <div className={styles.map}>
            <div className={styles.timer}>
              {endTime && 
                <Timer 
                  targetTime={endTime} 
                  onTimeLimitReached={handleTimeLimitReached} 
                  finished={!remainingTargets}
                />
              }
            </div>
            <Map
              circles={remainingTargets?.map(target => ({
                  ...target.randOffset,
                  isSelected: target.id === selectedTargetId
                }))
                .sort((a, b) => a.isSelected - b.isSelected) // Sort to ensure selected circle is rendered on top
              }
              playerLocation={playerLocation}
              startingLocation={gameOptions.startingLocation}
              gameMode={gameOptions.mode}
              locationGuess={locationGuess}
              players={otherPlayers}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.GameView}>
      <div className={styles.timer}>
        {endTime && <>
            <Timer 
              targetTime={endTime} 
              onTimeLimitReached={handleTimeLimitReached} 
              score={lobbyData.players[currentUser.uid].score}
            />

            <div className={styles.finishedMessage} style={{opacity: (!remainingTargets) ? 1 : 0}}>
              <div className={styles.message}>
                Now get back to the start!
              </div>
            </div>
          </>
        }
      </div>
      <Map
        circles={remainingTargets?.map(target => ({
            ...target.randOffset,
            isSelected: target.id === selectedTargetId
          }))
          .sort((a, b) => a.isSelected - b.isSelected) // Sort to ensure selected circle is rendered on top
        }
        playerLocation={playerLocation}
        startingLocation={gameOptions.startingLocation}
        gameMode={gameOptions.mode}
        locationGuess={locationGuess}
      />
      <GuessPrompt 
        shown={guessPrompt} 
        guess={checkGuess} 
        selectedTargetTools={{ selectedTargetId, setSelectedTargetId }}
        targets={overlappingTargets}
        handlePlaceChanged={handlePlaceChanged}
        currentGuess={locationGuess}
        onHint={useHint}
        bounds={bounds}
        startingLocation={gameOptions.startingLocation}
        endGame={handleEndGame}
        score={lobbyData.players[currentUser.uid].score}
      />
      <div className={`${styles.result} ${showResult ? styles.shown : ''}`}>{guessResult}</div>
    </div>
  );
};

export default GameView;
