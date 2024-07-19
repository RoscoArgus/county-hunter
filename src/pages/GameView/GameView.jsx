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

const GameView = ({ isHost, lobbyData, gameCode, initGameOptions }) => {
  const [gameOptions, setGameOptions] = useState(initGameOptions);
  const [guessPrompt, setGuessPrompt] = useState(false);
  const [locationGuess, setLocationGuess] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [overlappingTargets, setOverlappingTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const { currentUser } = useAuth();
  const [remainingTargets, setRemainingTargets] = useState(null); // State for remaining targets

  // TODO TEMP REMOVE
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
  // END TEMP

  const getTargetsInRange = (targets, playerLocation) => {
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

  const updateSelectedTargets = (targets, playerLocation) => {
    if (targets && playerLocation) {
      const targetsInRange = getTargetsInRange(targets, playerLocation);

      setOverlappingTargets(targetsInRange);
      setGuessPrompt(targetsInRange.length > 0);

      // Keep the selected target if it's still in range
      if (!targetsInRange.find(target => target.id === selectedTargetId)) {
        setSelectedTargetId(targetsInRange.length === 1 ? targetsInRange[0].id : null);
      }
    }
  }

  useEffect(() => {
    setGameOptions(initGameOptions);
  }, [initGameOptions]);

  useEffect(() => {
    if(gameOptions && playerLocation)
      updateSelectedTargets(remainingTargets, playerLocation);
  }, [playerLocation, gameOptions, selectedTargetId]);

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

    if (targetIndex !== -1 && locationGuess && locationGuess.id === selectedTargetId) {
      guessedCorrectly = true;
      const updatedTargets = [...remainingTargets];
      updatedTargets.splice(targetIndex, 1);

      setRemainingTargets(updatedTargets); // Update state
      setLocationGuess(null);

      try {
        // Update RTDB with new remaining targets
        const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
        await update(playerRef, { 
          remainingTargets: updatedTargets,
          score: lobbyData.players[currentUser.uid].score + 100
        });

        if (getTargetsInRange(updatedTargets, playerLocation).length === 0) {
          setGuessPrompt(false);
        }
      } catch (error) {
        console.error('Error updating player data:', error);
      }
    }

    setGuessResult(guessedCorrectly ? 'Correct Guess!' : 'Wrong Guess!');
    setTimeout(() => setGuessResult(null), 2000);
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

  if (!gameOptions || !remainingTargets) {
    return <div>Loading...</div>;
  }

  if (isHost) {
    return (
      <ul>
        {Object.keys(lobbyData.players).map((userId) => (
          <li key={userId}>
            {lobbyData.players[userId].username} - Score: {lobbyData.players[userId].score}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh'}}>
      <div className={styles.timer}>
        {endTime && <Timer targetTime={endTime} onTimeLimitReached={handleTimeLimitReached} />}
      </div>
      <Map
        circles={remainingTargets
          .map(target => ({
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
        bounds={bounds}
      />
      {guessResult && <div className={styles.result}>{guessResult}</div>}
    </div>
  );
};

export default GameView;
