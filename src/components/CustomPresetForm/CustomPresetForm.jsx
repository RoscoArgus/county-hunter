import React, { useState, useEffect } from 'react'
import styles from './CustomPresetForm.module.css'
import gameModes from '../../data/gameModes';
import PlacesAutocomplete from '../PlacesAutocomplete/PlacesAutocomplete';
import { getDistanceInMeters } from '../../utils/calculations';

const CustomPresetForm = ({ onSubmit, titleTools, SLTools, radiusTools, targetsTools, hintTools, gameModeTools, playerLocation }) => {
    const [bounds, setBounds] = useState(null);
    const { title, setTitle } = titleTools;
    const { startingLocation, setStartingLocation } = SLTools;
    const { radius, setRadius } = radiusTools;
    const { targets, setTargets } = targetsTools;
    const { hints, setHints } = hintTools;
    const { gameMode, setGameMode } = gameModeTools;
    const [ currentTargetIndex, setCurrentTargetIndex ] = useState(0);
    const [gameSize, setGameSize] = useState(5);

    useEffect(() => {
        if(bounds) return;
        if(playerLocation && playerLocation.latitude && playerLocation.longitude) {
            updateBounds(playerLocation);
        }
    }, [playerLocation])

    const getStreetName = (place) => {
        for (let component of place.address_components) {
            if (component.types.includes('route')) {
                return component.long_name;
            }
        }
        return 'No Street Data Found';
    };

    const updateBounds = (target) => {
        const tryUpdateBounds = () => {
            try {
                const sw = new window.google.maps.LatLng(
                    target.latitude - 0.05, 
                    target.longitude - 0.05
                );
                const ne = new window.google.maps.LatLng(
                    target.latitude + 0.05, 
                    target.longitude + 0.05
                );
                const bounds = new window.google.maps.LatLngBounds(sw, ne);
                setBounds(bounds);
                console.log('%c Success: Bounds updated successfully!', 'color: green; font-weight: bold;');
            } catch (error) {
                // This fixes an issue with maps not being fully loaded yet
                if (error instanceof TypeError && error.message.includes("window.google.maps.LatLng is not a constructor")) {
                    console.warn("Issue creating LatLng or LatLngBounds. Trying again in 200ms...", error);
                    setTimeout(tryUpdateBounds, 200); // Retry after 200 milliseconds
                } else {
                    console.error("Error updating bounds: ", error);
                }
            }
        };

        tryUpdateBounds();
    }
    
    // Remove any reference to place name from the review text
    const filterText = (text, name) => {
        const words = name.split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
        const filteredText = (text.slice(0,100)+'...').replace(regex, (match) => '*'.repeat(match.length));
        return filteredText;
    };
    
    const handlePlaceChanged = (type, places) => {
        if (places.length <= 0) return;
        const place = places[0];

        let target = {
            location: {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
            },
            id: place.place_id,
            locationName: place.name,
        };

        if (type === 'start') {
            setStartingLocation({ ...target, radius });
            updateBounds(target.location);
        } else if (type === 'target') {
            target = {
                ...target, 
                types: place.types,
                street: getStreetName(place),
                reviews: place.reviews.map(review => ({
                    rating: review.rating, 
                    text: filterText(review.text, place.name)
                })),
            }
            const distance = getDistanceInMeters(startingLocation.location.latitude, startingLocation.location.longitude, place.geometry.location.lat(), place.geometry.location.lng());
            if (distance > radius) {
                alert('Target is outside of the game radius');
                return;
            };
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
            setHints(truncatedHints);
        }
        setGameSize(newSize);
        setCurrentTargetIndex(0);
    };

    return (
        <form>
            {/* Title */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Preset Title</div>
                <input
                    id='title'
                    type="text"
                    placeholder="Enter title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            {/* Gamemode */}
            <div className={styles.section}>
                <div className={styles.sectionLabel}>Game Mode:</div>
                <div id='gameMode' className={styles.gameModes}>
                    {gameModes.map(mode => (
                        <label key={mode.id} style={{ color: mode.enabled ? 'black' : 'gray'}}>
                            <input
                                type="radio"
                                value={mode.id}
                                checked={gameMode === mode.id}
                                disabled={!mode.enabled}
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
                { startingLocation ? <>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, 1fr)` }}>
                    {Array.from({ length: gameSize }, (_, index) => (
                        <button
                            type="button"
                            key={index}
                            onClick={() => setCurrentTargetIndex(index)}
                            style={{ 
                                padding: '10px', 
                                margin: '5px', 
                                backgroundColor: targets[index] ? targets.filter(target => targets[index]?.id === target?.id).length > 1 ? 'yellow' : '#70ff2a' : '', 
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
                </> 
                : <div>Please select a starting location to choose targets</div>}
            </div>
        </form>
    )
}

export default CustomPresetForm;