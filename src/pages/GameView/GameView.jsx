import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { ref, get, update, onValue } from 'firebase/database';
import Map from '../../components/Map/Map';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';
import styles from './GameView.module.css';
import { useUsername } from '../../context/UsernameContext';
import { getDistanceInMeters } from '../../utils/calculations';
import Timer from '../../components/Timer/Timer';
import { endGame } from '../../utils/game';
import useGeolocation from '../../hooks/useGeolocation';

const GameView = ({ presetId, isHost, lobbyData, gameCode }) => {
  const [gameOptions, setGameOptions] = useState(null);
  //const [playerLocation, setPlayerLocation] = useState(null);
  const [guessPrompt, setGuessPrompt] = useState(false);
  const [locationGuess, setLocationGuess] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [bounds, setBounds] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const { username } = useUsername();
  const playerLocation = useGeolocation();

  useEffect(() => {
    const fetchGameOptions = async () => {
      if (presetId) {
        const gameDocRef = doc(db, 'presets', presetId);
        const gameDoc = await getDoc(gameDocRef);

        if (gameDoc.exists()) {
          const gameData = gameDoc.data();
          const updatedGameOptions = {
            ...gameData,
            mode: 'classic',
            range: 100,
          };
          setGameOptions(updatedGameOptions);
          //setPlayerLocation(updatedGameOptions.startingLocation.location);
        } else {
          console.error("No such document!");
        }
      }
    };

    fetchGameOptions();
  }, [presetId]);

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

  useEffect(() => {
    if (gameOptions) {
      let withinRange = false;
      gameOptions.targets.forEach(target => {
        const distance = getDistanceInMeters(
          playerLocation.latitude,
          playerLocation.longitude,
          target.randOffset.latitude,
          target.randOffset.longitude
        );
        if (distance <= gameOptions.range) {
          withinRange = true;
        }
      });
      setGuessPrompt(withinRange);
    }
  }, [playerLocation, gameOptions]);

  useEffect(() => {
    if (playerLocation) {
      updateBounds(playerLocation);
    }
  }, [playerLocation]);

  const updateBounds = (location) => {
    if (location && window.google && window.google.maps && window.google.maps.LatLng) {
      const sw = new window.google.maps.LatLng(
        location.latitude - 0.05, location.longitude - 0.05);
      const ne = new window.google.maps.LatLng(
        location.latitude + 0.05, location.longitude + 0.05);
      setBounds(new window.google.maps.LatLngBounds(sw, ne));
    }
  };

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
    const updatedTargets = [...gameOptions.targets];

    gameOptions.targets.forEach((target, index) => {
      const distance = getDistanceInMeters(
        playerLocation.latitude,
        playerLocation.longitude,
        target.randOffset.latitude,
        target.randOffset.longitude
      );
      if (distance <= gameOptions.range) {
        if (locationGuess && locationGuess.id === target.id) {
          guessedCorrectly = true;
          updatedTargets.splice(index, 1);
        }
      }
    });

    setGuessResult(guessedCorrectly ? 'Correct Guess!' : 'Wrong Guess!');
    setGameOptions({ ...gameOptions, targets: updatedTargets });
    setLocationGuess(null);
    setLocationInput('');

    if (guessedCorrectly) {
      try {
        const playerRef = ref(rtdb, `games/${gameCode}/players/${username}`);
        await update(playerRef, {
          score: lobbyData.players[username].score + 100,
        });
        setGuessPrompt(false);
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

  if (!gameOptions || !presetId) {
    return <div>Loading...</div>;
  }

  if(isHost) {
    return (
        <ul>
            {Object.keys(lobbyData.players).map((userId) => (
              <li key={userId}>
                {lobbyData.players[userId].username} - Score: {lobbyData.players[userId].score}
              </li>
            ))}
        </ul>
    )
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{position: 'absolute', top: 0, left: 0, zIndex: 10000}}>
        {endTime && <Timer targetTime={endTime} onTimeLimitReached={handleTimeLimitReached}/>}
      </div>
      <Map
        circles={gameOptions.targets.map(target => target.randOffset)}
        playerLocation={playerLocation}
        startingLocation={gameOptions.startingLocation}
        gamemode={gameOptions.mode}
        locationGuess={locationGuess}
      />
      <div className={`${styles.prompt} ${guessPrompt ? '' : styles.hidden}`}>
        <h2>You are within the range!</h2>
        <PlacesAutocomplete
          type='target'
          handlePlaceChanged={handlePlaceChanged}
          bounds={bounds}
        />
        <button onClick={() => checkGuess()}>Guess the location</button>
      </div>
      {guessResult && <div className={styles.result}>{guessResult}</div>}
    </div>
  );
};

export default GameView;