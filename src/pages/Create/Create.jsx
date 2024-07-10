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
import useGeolocation from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { getRandomPointWithinRadius } from '../../utils/calculations';
import { TARGET_RANGE } from '../../constants';

const Create = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultPresets, setDefaultPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [title, setTitle] = useState('');
  const [startingLocation, setStartingLocation] = useState(null);
  const [radius, setRadius] = useState(1000);
  const [targets, setTargets] = useState(Array(5).fill(null));
  const [hints, setHints] = useState(Array(5).fill(''));
  const [gameMode, setGameMode] = useState('classic');
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [showCustom, setShowCustom] = useState(false);

  const navigate = useNavigate();
  const playerLocation = useGeolocation();
  const { currentUser } = useAuth();

  const custom = {
    id: 'custom',
    title: "Custom", 
    gamemode: "custom",
    thumbnail: getImageUrl('presets/custom.png'),
  };
 
  useEffect(() => {
    const fetchDefaultPresets = async () => {
      setIsLoading(true);
      const presetsQuery = query(collection(db, 'presets'), where('creator', 'in', ['County Hunter', currentUser.displayName]));
      const querySnapshot = await getDocs(presetsQuery);
      const presets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDefaultPresets((prev) => [custom, ...presets]);
      setIsLoading(false);
    };
    fetchDefaultPresets();
  }, []);

  useEffect(() => {
    if(currentUser) {
      setTitle(currentUser.displayName + "'s Preset")
    }
  }, [currentUser])

  const hasDuplicates = (array) => {
    const ids = new Set();
    return array.some(item => {
        if (ids.has(item?.id)) {
            return true;
        }
        ids.add(item?.id);
        return false;
    });
};

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
    setRadius(parseInt(newRadius));
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
    const targetData = targets.map((target, index) => { 
      return { 
        ...target, 
        randOffset: getRandomPointWithinRadius(
          target.location.latitude, 
          target.location.longitude, 
          TARGET_RANGE, 
          startingLocation.location.latitude, 
          startingLocation.location.longitude, 
          startingLocation.radius
        ),
        hint: hints[index] 
      } 
    });
    const gameData = {
      title: title,
      creator: currentUser.displayName,
      gameMode: gameMode,
      startingLocation,
      radius,
      targets: targetData,
    };

    try {
      // if custom preset, create preset in DB
      let presetId = selectedPreset;
      if(selectedPreset === 'custom')
        presetId = await createPreset(gameData);
        const gameCode = await createLobby(currentUser, presetId, timeLimit, maxPlayers);
      navigate(`/game/${gameCode}`);
    } catch (e) {
      console.error("Error creating game: ", e);
    }
    setIsLoading(false);
  };

  const isMissingData = () => {
    return (
      !title ||
      !startingLocation || 
      !targets.every(target => target) ||
      hasDuplicates(targets) ||
      !hints.every(hint => hint) ||
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
              <button onClick={() => setShowCustom(false)} className={styles.leftButton}>Back</button>
              <h2 className={styles.title}>Custom Preset</h2>
              {/* TODO show when logged in, allow player to save under their handle */}
              <button onClick={() => console.log("TODO save preset")} className={styles.rightButton}>Save to Profile</button>
            </nav>
            
            <CustomPresetForm 
              onSubmit={handlePresetSelect}
              titleTools={{title, setTitle}}
              SLTools={{startingLocation, setStartingLocation}}
              radiusTools={{radius, setRadius: handleRadiusChanged}}
              targetsTools={{targets, setTargets}}
              hintTools={{hints, setHints}}
              gameModeTools={{gameMode, setGameMode}}
              playerLocation={playerLocation}
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
                  disabled={isLoading || (isMissingData() && selectedPreset === 'custom')}
                >
                  Create Game
                </button>
              </div>
              {/*errors*/}
              {selectedPreset === 'custom' && 
                <ul>
                  <h3>Requirements for Custom Game</h3>
                  {!title && <li>Title is required</li>}
                  {!startingLocation && <li>Starting location is required</li>}
                  {!targets.every(target => target) && <li>Targets are required</li>}
                  {hasDuplicates(targets) && <li>Targets must be unique</li>}
                  {!hints.every(hint => hint) && <li>Hints are required</li>}
                  {!radius && <li>Radius is required</li>}
                  {!gameMode && <li>Game mode is required</li>}
                  {!timeLimit && <li>Time limit is required</li>}
                  {!maxPlayers && <li>Max players is required</li>}
                </ul>
              }
            </form>
          </React.Fragment>
        }
      </div>
      <div className={styles.map}>
        <Map
          circles={targets.filter(loc => loc).map(loc => loc.location)}
          startingLocation={startingLocation}
          playerLocation={playerLocation}
          gameMode='create'
        />
      </div>
    </div>
  );
};

export default Create;