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
import { getRandomPointWithinRadius, getDistanceInMeters } from '../../utils/calculations';
import { MAX_PLAYERS, MAX_TIME, TARGET_RANGE } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { FaHome, FaAngleLeft, FaSave, FaMap, FaSlash } from 'react-icons/fa';

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
  const [showMap, setShowMap] = useState(true);

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

  const handleValueChange = (setter, value, min, max) => {
    console.log(value)
    const newValue = parseInt(value);
    if (newValue >= 1 && newValue <= max) {
      setter(newValue);
    }
    else if (newValue < 1) {
      setter(min);
    }
    else if (newValue > max) {
      setter(max);
    }
  };

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

  const handlePresetSave = async (creator) => {
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
      creator: creator,
      gameMode: gameMode,
      startingLocation,
      radius,
      targets: targetData,
    };

    try {
      const presetId = await createPreset(gameData);
      setSelectedPreset(presetId);
      setDefaultPresets([...defaultPresets, { id: presetId, ...gameData }]);
      alert("Preset saved successfully!");
      return presetId;
    } catch (e) {
      alert("Error creating preset. Please try again.");
      console.error("Error creating preset: ", e);
      return null;
    }
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

  const handleSubmit = async (event) => {
    setIsLoading(true);
    event.preventDefault();
    
    try {
      // if custom preset, create preset in DB
      let presetId = selectedPreset;
      if(selectedPreset === 'custom')
        presetId = await handlePresetSave('Temporary');
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

  const areTargetsInRange = () => {
    for (const target of targets) {
        if (!target) {
            return false;
        }
        if (getDistanceInMeters(
                startingLocation?.location.latitude, 
                startingLocation?.location.longitude, 
                target?.location.latitude, 
                target?.location.longitude
            ) > radius) 
        {
            return false;
        }
    }
    return true;
  }


  if(isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className={styles.Create}>
      <div className={styles.options}>
        {showCustom
          ? 
          <React.Fragment>
            <nav className={styles.nav}>
              <button onClick={() => setShowCustom(false)} className={styles.leftButton}>
                <FaAngleLeft className={`${styles.icon} ${styles.backIcon}`} />
                <h2>Back</h2>
              </button>
              <h2 className={styles.title}>Custom Preset</h2>
              <button 
                onClick={() => handlePresetSave(currentUser.displayName)} 
                disabled={isLoading || isMissingData() || !areTargetsInRange()}
                className={styles.rightButton}
              >
                <FaSave className={styles.icon} />
                <h2>Save</h2>
              </button>
            </nav>
            
            <CustomPresetForm 
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
              <button onClick={() => navigate('/home')} className={styles.leftButton}>
                <FaHome className={styles.icon}/>
                <h2>Home</h2>
              </button>
              <h2 className={styles.title}>Create Game</h2>
            </nav>
            <PresetSlider slides={defaultPresets} onPresetPress={handlePresetSelect} selectedId={selectedPreset}/>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputContainer}>
                <label htmlFor="timeLimit">Time Limit (max 60 minutes):</label>
                <div style={{display: "flex", flexDirection: "row"}}>
                  <button 
                    type="button" 
                    onClick={() => handleValueChange(setTimeLimit, timeLimit-1, 5, MAX_TIME)} 
                    className={styles.adjustButton}
                    disabled={timeLimit <= 5}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="timeLimit"
                    name="timeLimit"
                    min="1"
                    max={MAX_TIME}
                    value={timeLimit}
                    onChange={(e) => handleValueChange(setTimeLimit, e.target.value, 5, MAX_TIME)}
                    className={styles.inputField}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleValueChange(setTimeLimit, timeLimit+1, 5, MAX_TIME)} 
                    className={styles.adjustButton}
                    disabled={timeLimit >= MAX_TIME}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.inputContainer}>
                <label htmlFor="maxPlayers">Max Players:</label>
                <div style={{display: "flex", flexDirection: "row"}}>
                  <button 
                    type="button" 
                    onClick={() => handleValueChange(setMaxPlayers, maxPlayers-1, 2, MAX_PLAYERS)} 
                    className={styles.adjustButton}
                    disabled={maxPlayers <= 2}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="maxPlayers"
                    name="maxPlayers"
                    min="2"
                    max={MAX_PLAYERS}
                    value={maxPlayers}
                    onChange={(e) => handleValueChange(setMaxPlayers, e.target.value, 2, MAX_PLAYERS)}
                    className={styles.inputField}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleValueChange(setMaxPlayers, maxPlayers+1, 2, MAX_PLAYERS)} 
                    className={styles.adjustButton}
                    disabled={maxPlayers >= MAX_PLAYERS}
                  >
                    +
                  </button>
                </div>
              </div>
              {/*errors*/}
              {selectedPreset === 'custom' && isMissingData() &&
                <ul>
                  <h3>Requirements for Custom Game</h3>
                  {!title && <li>Title is required</li>}
                  {!startingLocation && <li>Starting location is required</li>}
                  {!targets.every(target => target) && <li>Targets are required</li>}
                  {hasDuplicates(targets) && <li>Targets must be unique</li>}
                  {!areTargetsInRange() && <li>All targets must be in range</li>}
                  {!hints.every(hint => hint) && <li>Hints are required</li>}
                  {!radius && <li>Radius is required</li>}
                  {!gameMode && <li>Game mode is required</li>}
                  {!timeLimit && <li>Time limit is required</li>}
                  {!maxPlayers && <li>Max players is required</li>}
                </ul>
              }

              <div className={styles.buttons}>
                <button 
                  className={styles.createButton}
                  disabled={
                    isLoading || 
                    ((isMissingData() && selectedPreset === 'custom') || 
                    !selectedPreset ||
                    !areTargetsInRange()
                  )}
                >
                  Create Game
                </button>
              </div>
            </form>
          </React.Fragment>
        }
      </div>
      <div className={`${styles.map} ${showMap ? styles.expanded : styles.contracted}`}>
        <button 
          onClick={() => setShowMap(!showMap)} 
          className={styles.mapButton}
        >
          <FaMap className={styles.icon} />
          {showMap && <FaSlash className={`${styles.icon} ${styles.slash}`}/>}

        </button>
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
