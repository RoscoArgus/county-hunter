import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { ref, get, update, onValue } from 'firebase/database';
import Map from '../../components/Map/Map';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';
import styles from './GameView.module.css';
import { getDistanceInMeters } from '../../utils/calculations';
import Timer from '../../components/Timer/Timer';
import { endGame } from '../../utils/game';
import { useAuth } from '../../context/AuthContext';

const GameView = ({ isHost, lobbyData, gameCode, /*playerLocation,*/initGameOptions }) => {
  const [gameOptions, setGameOptions] = useState(initGameOptions);
  const [guessPrompt, setGuessPrompt] = useState(false);
  const [locationGuess, setLocationGuess] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [overlappingTargets, setOverlappingTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const { currentUser } = useAuth();

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
      updateSelectedTargets(gameOptions.targets, playerLocation);
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
    const targetIndex = gameOptions.targets.findIndex(target => target.id === selectedTargetId);

    if (targetIndex !== -1 && locationGuess && locationGuess.id === selectedTargetId) {
      guessedCorrectly = true;
      const updatedTargets = [...gameOptions.targets];
      updatedTargets.splice(targetIndex, 1);

      setGameOptions({ ...gameOptions, targets: updatedTargets });
      setLocationGuess(null);
    }

    setGuessResult(guessedCorrectly ? 'Correct Guess!' : 'Wrong Guess!');

    if (guessedCorrectly) {
      try {
        const playerRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
        await update(playerRef, {
          score: lobbyData.players[currentUser.uid].score + 100,
        });
        if (getTargetsInRange(gameOptions.targets, playerLocation).length === 0) {
          setGuessPrompt(false);
        }
      } catch (error) {
        console.error('Error updating player score:', error);
      }
    }
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

  const handleTimeLimitReached = () => {
    endGame(gameCode);
  };

  const handleTargetSelect = (event) => {
    setSelectedTargetId(event.target.value);
  };

  if (!gameOptions) {
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
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10000 }}>
        {endTime && <Timer targetTime={endTime} onTimeLimitReached={handleTimeLimitReached} />}
      </div>
      <Map
        circles={gameOptions.targets
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
      <div className={`${styles.prompt} ${guessPrompt ? '' : styles.hidden}`}>
        <h2>You are within the range!</h2>
        {overlappingTargets.length > 1 && (
          <div>
            <label>Select target to guess for:</label>
            <select onChange={handleTargetSelect} value={selectedTargetId || ''}>
              <option value="" disabled>Select target</option>
              {overlappingTargets.map(target => (
                <option key={target.id} value={target.id}>{target.id.slice(-4)}</option>
              ))}
            </select>
          </div>
        )}
        <PlacesAutocomplete
          type='target'
          handlePlaceChanged={handlePlaceChanged}
          bounds={bounds}
        />
        <button onClick={() => checkGuess()} disabled={!selectedTargetId}>Guess the location</button>
        <div>Hint: {gameOptions.targets.find(target => target.id === selectedTargetId)?.hint}</div>
        <div>Street: {gameOptions.targets.find(target => target.id === selectedTargetId)?.street}</div>
        <div>Types: {gameOptions.targets.find(target => target.id === selectedTargetId)?.types.map((type, index) => {
          return type + ' '
        })}</div>
        <div>Reviews: {gameOptions.targets.find(target => target.id === selectedTargetId)?.reviews?.map((review) => {
          return <div>Rating: {review.rating} Review: {review.text}</div>
        })}
        </div>
        
      </div>
      {guessResult && <div className={styles.result}>{guessResult}</div>}
    </div>
  );
};

export default GameView;