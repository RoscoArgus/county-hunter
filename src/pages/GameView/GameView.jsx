import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../../config/firebase';
import { ref, update } from 'firebase/database'; // Import Firebase Realtime Database functions
import Map from '../../components/Map/Map';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';
import styles from './GameView.module.css';
import { useUsername } from '../../context/UsernameContext';

const GameView = ({ presetId, isHost, lobbyData, gameCode }) => {
  const [gameOptions, setGameOptions] = useState(null);
  const [playerLocation, setPlayerLocation] = useState(null);
  const [guessPrompt, setGuessPrompt] = useState(false);
  const [locationGuess, setLocationGuess] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [bounds, setBounds] = useState(null);
  const [guessResult, setGuessResult] = useState(null);

  const { username } = useUsername();

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
          setPlayerLocation(updatedGameOptions.startingLocation.location);
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
        const distance = getDistanceFromLatLonInMeters(
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

  const handlePlaceChanged = (places) => {
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

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      0.5 - Math.cos(dLat) / 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
  };

  const checkGuess = async () => {
    let guessedCorrectly = false;
    const updatedTargets = [...gameOptions.targets];

    gameOptions.targets.forEach((target, index) => {
      const distance = getDistanceFromLatLonInMeters(
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
          score: lobbyData.players[username].score + 100, // Update score in database
        });
      } catch (error) {
        console.error('Error updating player score:', error);
      }
    }
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
          handlePlaceChanged={handlePlaceChanged}
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          bounds={bounds}
        />
        <button onClick={() => { checkGuess(); setGuessPrompt(false); }}>Guess the location</button>
      </div>
      {guessResult && <div className={styles.result}>{guessResult}</div>}
    </div>
  );
};

export default GameView;
