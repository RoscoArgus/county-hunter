import React, { useEffect, useState } from 'react';
import styles from './Create.module.css';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getImageUrl } from '../../utils/image';
import PresetSlider from '../../components/PresetSlider/PresetSlider';
import Map from '../../components/Map/Map';
import CustomPresetForm from '../../components/CustomPresetForm/CustomPresetForm';
import { useNavigate } from 'react-router-dom';

const Create = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultPresets, setDefaultPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [startingLocation, setStartingLocation] = useState(null);
  const [radius, setRadius] = useState(1000);
  const [targets, setTargets] = useState(Array(5).fill(null));
  const [showCustom, setShowCustom] = useState(false);

  const navigate = useNavigate();

  const custom = {
    id: 'custom',
    title: "Custom", 
    gamemode: "custom",
    thumbnail: getImageUrl('presets/custom.png'),
  }
 
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
            />
          </React.Fragment>
          : 
          <React.Fragment>
            <nav className={styles.nav}>
              <button onClick={() => navigate('/home')} className={styles.leftButton}>Home</button>
              <h2 className={styles.title}>Create Game</h2>
            </nav>
            <PresetSlider slides={defaultPresets} onPresetPress={handlePresetSelect} selectedId={selectedPreset}/>
            <form>
              <label htmlFor='timeLimit'>Time Limit:</label>
              <input type='number' id='timeLimit' name='timeLimit' min='1' max='60' />
              <label htmlFor='maxPlayers'>Max Players:</label>
              <input type='number' id='maxPlayers' name='maxPlayers' min='1' max='8' />
              <button type='submit'>Create Game</button>
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