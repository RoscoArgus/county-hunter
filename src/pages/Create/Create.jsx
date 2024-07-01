import React, { useEffect, useState } from 'react';
import styles from './Create.module.css';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getImageUrl } from '../../utils/image';
import PresetSlider from '../../components/PresetSlider/PresetSlider';
import Map from '../../components/Map/Map';
import CustomPresetForm from '../../components/CustomPresetForm/CustomPresetForm';
import { createLobby, createPreset } from '../../utils/game';
import { useNavigate } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';

const Create = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultPresets, setDefaultPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [startingLocation, setStartingLocation] = useState(null);
  const [radius, setRadius] = useState(1000);
  const [targets, setTargets] = useState(Array(5).fill(null));
  const [gameMode, setGameMode] = useState('classic');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [showCustom, setShowCustom] = useState(false);

  const navigate = useNavigate();
  const { username } = useUsername();

  const custom = {
    id: 'custom',
    title: "Custom", 
    gamemode: "custom",
    thumbnail: getImageUrl('presets/custom.png'),
  }

  useEffect(() => {
    console.log(targets)
  }, targets)
 
  useEffect(() => {
    const fetchDefaultPresets = async () => {
      setIsLoading(true);
      const presetsQuery = query(collection(db, 'presets'), where('creator', '==', 'County Hunter'));
      const querySnapshot = await getDocs(presetsQuery);
      const presets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDefaultPresets((prev) => [custom, ...presets]);
      setIsLoading(false);
    };
    fetchDefaultPresets();
  }, []);

  const handlePresetSelect = (preset) => {
    if(preset.gamemode === 'custom') {
      // Remove targets when custom not already selected
      if(selectedPreset !== 'custom') {
        setStartingLocation(null);
        setTargets(Array(5).fill(null));
      }
      setSelectedPreset(preset.id);
      setShowCustom(true);
      return;
    }
    setStartingLocation(preset.startingLocation);
    setTargets(preset.targets.map(target => ({ location: target.location, radius: target.radius })));
    setSelectedPreset(preset.id);
  }

  const handleRadiusChanged = (event) => {
    const newRadius = event.target.value;
    setRadius(newRadius);
    if (startingLocation)
      setStartingLocation({ ...startingLocation, radius: newRadius });
  };

  const decreaseValue = (setter, value, min) => {
    if (value > min) {
      setter(value - 1);
    }
  };

  const increaseValue = (setter, value, max) => {
    if (value < max) {
      setter(value + 1);
    }
  };

  const handleSubmit = async (event) => {
    setIsLoading(true);
    event.preventDefault();
    const gameData = {
      title: 'Test Game',
      creator: 'County Hunter',
      gameMode: gameMode,
      startingLocation,
      radius,
      targets,
    };

    try {
      // if custom preset, create preset in DB
      let presetId = selectedPreset;
      if(selectedPreset === 'custom')
        presetId = await createPreset(gameData);
      const gameCode = await createLobby(username, presetId, timeLimit, maxPlayers);
      navigate(`/game/${gameCode}`);
    } catch (e) {
      console.error("Error creating game: ", e);
    }
    setIsLoading(false);
  };

  const isMissingData = () => {
    return (
      !startingLocation || 
      !targets.every(target => target) ||
      !radius ||
      !gameMode ||
      !timeLimit ||
      !maxPlayers
    );
  };

  if(isLoading) {
    return <h1>Loading...</h1>
  }

  return (
    <div className={styles.Create}>
      <div className={styles.options}>
        {showCustom
          ? 
          <React.Fragment>
            <nav className={styles.nav}>
              <button onClick={() => setShowCustom(false)} className={styles.leftButton}>Cancel</button>
              <h2 className={styles.title}>Custom Preset</h2>
              {/* TODO show when logged in, allow player to save under their handle */}
              <button onClick={() => console.log("TODO save preset")} className={styles.rightButton}>Save to Profile</button>
            </nav>
            
            <CustomPresetForm 
              onSubmit={handlePresetSelect}
              SLTools={{startingLocation, setStartingLocation}}
              radiusTools={{radius, setRadius: handleRadiusChanged}}
              targetsTools={{targets, setTargets}}
              gameModeTools={{gameMode, setGameMode}}
            />
          </React.Fragment>
          : 
          <React.Fragment>
            <nav className={styles.nav}>
              <button onClick={() => navigate('/home')} className={styles.leftButton}>Home</button>
              <h2 className={styles.title}>Create Game</h2>
            </nav>
            <PresetSlider slides={defaultPresets} onPresetPress={handlePresetSelect} selectedId={selectedPreset}/>
            <form onSubmit={handleSubmit}>
              <div className="input-container">
                <label htmlFor="timeLimit">Time Limit (max 60 minutes):</label>
                <button type="button" onClick={() => decreaseValue(setTimeLimit, timeLimit, 5)}>-</button>
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  min="1"
                  max="60"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                />
                <button type="button" onClick={() => increaseValue(setTimeLimit, timeLimit, 120)}>+</button>
              </div>
              <div className="input-container">
                <label htmlFor="maxPlayers">Max Players:</label>
                <button type="button" onClick={() => decreaseValue(setMaxPlayers, maxPlayers, 2)}>-</button>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  min="2"
                  max="8"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                />
                <button type="button" onClick={() => increaseValue(setMaxPlayers, maxPlayers, 8)}>+</button>
              </div>
              <div className={styles.buttons}>
                <button 
                  className={styles.createButton}
                  disabled={isLoading || isMissingData()}
                >
                  Create Game
                </button>
              </div>
            </form>
          </React.Fragment>
        }
      </div>
      <div className={styles.map}>
        <Map
          circles={targets.filter(loc => loc).map(loc => loc.location)}
          startingLocation={startingLocation}
          playerLocation={null}
          gamemode='create'
        />
      </div>
    </div>
  );
};

export default Create;