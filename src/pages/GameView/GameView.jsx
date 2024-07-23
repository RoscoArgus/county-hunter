import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { ref, get, update, onValue } from 'firebase/database';
import Map from '../../components/Map/Map';
import styles from './GameView.module.css';
import { getDistanceInMeters } from '../../utils/calculations';
import Timer from '../../components/Timer/Timer';
import { endGame } from '../../utils/game';
import { useAuth } from '../../context/AuthContext';
import GuessPrompt from '../../components/GuessPrompt/GuessPrompt';
import { STARTING_RANGE } from '../../constants';

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

  /* TODO TEMP REMOVE
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
      if(distance < STARTING_RANGE) {
        const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
        update(playerRef, { finished: true });
        return [];
      };
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
      setGuessPrompt(targetsInRange?.length > 0);

      // Keep the selected target if it's still in range
      if (!targetsInRange?.find(target => target.id === selectedTargetId)) {
        setSelectedTargetId(targetsInRange?.length === 1 ? targetsInRange[0]?.id : null);
      }
    }
  }

  const useHint = async (type, value, selectedId) => {
    const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
    let updatedTargets = [...remainingTargets];
    const targetIndex = updatedTargets.findIndex(target => target.id === selectedId);
    console.log(type);

    if((type==='reviews' && updatedTargets[targetIndex][type].isUsed !== -1) || 
        updatedTargets[targetIndex][type].isUsed === true) return;

    updatedTargets[targetIndex].value -= (type==='reviews' ? 20 : 10);
    if(updatedTargets[targetIndex].value < 20) // minimum score for a location is 20
      updatedTargets[targetIndex].value = 20;

    updatedTargets[targetIndex][type].isUsed = value;
    console.log(updatedTargets[targetIndex]);
    await update(playerRef, { 
        remainingTargets: updatedTargets
    });
  }

  useEffect(() => {
    setGameOptions(initGameOptions);
  }, [initGameOptions]);

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
    const targetIndex = remainingTargets.findIndex(target => target.id === selectedTargetId);
    const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);

    if (targetIndex !== -1 && locationGuess && locationGuess.id === selectedTargetId) {
      guessedCorrectly = true;
      const value = remainingTargets[targetIndex].value;
      const updatedTargets = [...remainingTargets];
      updatedTargets.splice(targetIndex, 1); // Remove target from remaining targets

      setRemainingTargets(updatedTargets); // Update state
      updateSelectedTargets(updatedTargets, playerLocation);

      try {
        // Update RTDB with new remaining targets
        await update(playerRef, { 
          remainingTargets: updatedTargets,
          score: lobbyData.players[currentUser.uid].score + value
        });

        if (getTargetsInRange(updatedTargets, playerLocation)?.length === 0) {
          setGuessPrompt(false);
        }
      } catch (error) {
        console.error('Error updating player data:', error);
      }
    }
    else {
      if(remainingTargets[targetIndex].value > 20)
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
    }

    setLocationGuess(null);
    setGuessResult(guessedCorrectly ? 'Correct Guess!' : 'Wrong Guess!');
    setShowResult(true);
    setTimeout(() => setShowResult(false), 2000);
    setTimeout(() => setGuessResult(null), 5000);
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

  if (!gameOptions || remainingTargets === null) {
    return <div>Loading...</div>;
  }

  if (isHost || finished) {
    return (
      <>
        <ul>
          {Object.keys(lobbyData.players).map((userId) => (
            <li key={userId}>
              {lobbyData.players[userId].username} - Score: {lobbyData.players[userId].score}
            </li>
          ))}
        </ul>
        {isHost && <button onClick={() => endGame(gameCode)}>End Game</button>}
      </>
    );
  }

  return (
    <div className={styles.GameView}>
      <div className={styles.timer}>
        {!remainingTargets && <div>Get Back to the Start!</div>}
        {endTime && <Timer targetTime={endTime} onTimeLimitReached={handleTimeLimitReached} />}
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
      />
      <div className={`${styles.result} ${showResult ? styles.shown : ''}`}>{guessResult}</div>
    </div>
  );
};

export default GameView;
