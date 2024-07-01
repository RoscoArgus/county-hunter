import React, { useState } from 'react'
import styles from './CustomPresetForm.module.css'
import gameModes from '../../data/gameModes';
import PlacesAutocomplete from '../PlacesAutocomplete/PlacesAutocomplete';
import { getDistanceInMeters } from '../../utils/calculations';
import { getRandomPointWithinRadius } from '../../utils/calculations';

const CustomPresetForm = ({ onSubmit, SLTools, radiusTools, targetsTools, gameModeTools }) => {
    const [bounds, setBounds] = useState(null); // TODO bounds should be player location initially
    const { startingLocation, setStartingLocation } = SLTools;
    const { radius, setRadius } = radiusTools;
    const { targets, setTargets } = targetsTools;
    const { gameMode, setGameMode } = gameModeTools;
    const [ currentTargetIndex, setCurrentTargetIndex ] = useState(0);
    const [hints, setHints] = useState(Array(5).fill(''));
    const [gameSize, setGameSize] = useState(5);

    const getStreetName = (place) => {
        for (let component of place.address_components) {
            if (component.types.includes('route')) {
                return component.long_name;
            }
        }
        return 'No Street Data Found';
    };
    
    const handlePlaceChanged = (type, places) => {
        if (places.length <= 0) return;
        const place = places[0];

        let target = {
            location: {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
            },
            types: place.types,
            street: getStreetName(place),
            id: place.place_id,
            locationName: place.name,
        };

        if (type === 'start') {
            setStartingLocation({ ...target, radius });
            console.log(target);

            // Set bounds so autocomplete shows most relevant results
            const sw = new window.google.maps.LatLng(
                target.location.latitude - 0.05, 
                target.location.longitude - 0.05
            );
            const ne = new window.google.maps.LatLng(
                target.location.latitude + 0.05, 
                target.location.longitude + 0.05
            );

            setBounds(new window.google.maps.LatLngBounds(sw, ne));
        } else if (type === 'target') {
            target = { ...target, randOffset: getRandomPointWithinRadius(place.geometry.location.lat(), place.geometry.location.lng(), 100) };
            const newTargets = [...targets];
            newTargets[currentTargetIndex] = target;
            setTargets(newTargets);
        }
    };

    const handleHintChanged = (event) => {
        let target = targets[currentTargetIndex];
        target = { ...target, hint: event.target.value }
        const newTargets = [...targets];
        newTargets[currentTargetIndex] = target;
        setTargets(newTargets);
        const newHints = [...hints];
        newHints[currentTargetIndex] = event.target.value;
        setHints(newHints);
    };    

    const handleGameSizeChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        if (newSize > gameSize) {
            setTargets([...targets, ...Array(newSize - gameSize).fill(null)]);
            setHints([...hints, ...Array(newSize - gameSize).fill('')]);
        } else {
            const truncatedTargets = targets.slice(0, newSize);
            setTargets(truncatedTargets);
            const truncatedHints = hints.slice(0, newSize);
            setHints([...hints, ...Array(newSize - gameSize).fill('')]);
        }
        setGameSize(newSize);
        setCurrentTargetIndex(0);
    };

    return (
        <form>
            {/* Gamemode */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Game Mode:</div>
                <div id='gameMode' className={styles.gameModes}>
                    {gameModes.map(mode => (
                        <label key={mode.id}>
                            <input
                                type="radio"
                                value={mode.id}
                                checked={gameMode === mode.id}
                                onChange={(e) => setGameMode(e.target.value)}
                            />
                            {mode.name}
                        </label>
                    ))}
                </div>
                <p>{gameModes.find((mode) => mode.id === gameMode).description}</p>
            </div>
            
            {/* Starting Location */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Starting Location:</div>
                <span className={styles.startingLocation}>
                    <PlacesAutocomplete
                        type='start'
                        handlePlaceChanged={handlePlaceChanged}
                        bounds={bounds}
                    />
                    <div className={styles.locationName}>{startingLocation ? startingLocation.locationName : 'No Location Selected'}</div>
                </span>
            </div>

            {/* Play Area Radius */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Game Radius: {radius/1000}KM</div>
                <input
                    type="range"
                    min="500"
                    max="5000"
                    step={100}
                    value={radius}
                    onChange={(e) => setRadius(e)}
                />
            </div>

            {/* Number of Targets */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Game Size:</div>
                <select value={gameSize} onChange={handleGameSizeChange}>
                    <option value={5}>Small (5 targets)</option>
                    <option value={10}>Medium (10 targets)</option>
                    <option value={15}>Large (15 targets)</option>
                </select>
            </div>

            {/* Target Locations */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Choose targets:</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, 1fr)` }}>
                    {Array.from({ length: gameSize }, (_, index) => (
                        <button
                            type="button"
                            key={index}
                            onClick={() => setCurrentTargetIndex(index)}
                            style={{ 
                                padding: '10px', 
                                margin: '5px', 
                                backgroundColor: targets[index] ? '#70ff2a' : '', 
                                border: currentTargetIndex === index ? '2px solid black' : '2px solid transparent',
                                outline: getDistanceInMeters (
                                            startingLocation?.location.latitude, 
                                            startingLocation?.location.longitude, 
                                            targets[index]?.location.latitude, 
                                            targets[index]?.location.longitude
                                        ) > radius ? '2px solid red' : '2px solid transparent',
                            }}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
                {targets.map((target, index) => {
                    return (
                        <div key={index} style={{ display: index === currentTargetIndex ? 'block' : 'none' }}>
                            <div className={styles.locationName}>{target ? target.locationName : 'No Location Selected'}</div>
                            <PlacesAutocomplete
                                type='target'
                                handlePlaceChanged={handlePlaceChanged}
                                bounds={bounds}
                            />
                           <div className={styles.locationName}>Personal Hint</div>
                           <input
                               placeholder='Enter your hint'
                               onChange={(e) => handleHintChanged(e)}
                               value={hints[index]}
                           />
                        </div>
                    );
                })}
            </div>
        </form>
    )
}

export default CustomPresetForm;