import React, { useState } from 'react';
import styles from './Create.module.css';
import Map from '../../components/Map/Map';
import { useGeolocation } from '../../utils/player';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';

const Create = () => {
    const [gameSize, setGameSize] = useState('small');
    const [locations, setLocations] = useState(Array.from({ length: 5 }, () => ({ location: '', hint: '', isComplete: false })));
    const [maxDistance, setMaxDistance] = useState(1);
    const [currentPage, setCurrentPage] = useState(0);
    const [startingLocation, setStartingLocation] = useState(null);

    const handleGameSizeChange = (event) => {
        const size = event.target.value;
        setGameSize(size);
        let pairs = 5;
        if (size === 'medium') pairs = 10;
        else if (size === 'large') pairs = 15;

        setLocations(Array.from({ length: pairs }, () => ({ location: '', hint: '', isComplete: false })));
        setCurrentPage(0);
    };

    const handleLocationChange = (index, event) => {
        const newLocations = [...locations];
        newLocations[index][event.target.name] = event.target.value;
        newLocations[index].isComplete = newLocations[index].location && newLocations[index].hint;
        setLocations(newLocations);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = {
            startingLocation: event.target.startingLocation.value,
            gameSize,
            maxDistance,
            locations: locations.map(loc => ({ location: loc.location, hint: loc.hint })),
        };
        console.log(formData);
    };

    const handlePlaceChanged = (places) => {
        const [place] = places;
        setStartingLocation({latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng()});
    }

    return (
        <div className={styles.container}>
            <h1>Create Game</h1>
            <form onSubmit={handleSubmit}>
                <div className={styles['form-group']}>
                    <label htmlFor="startingLocation">Starting Location:</label>
                    <PlacesAutocomplete handlePlaceChanged={(places) => handlePlaceChanged(places)}>
                        <input type="text" id="startingLocation" name="startingLocation" placeholder='Enter Location'/>
                    </PlacesAutocomplete>
                </div>

                <div className={styles['form-group']}>
                    <label htmlFor="gameSize">Game Size:</label>
                    <select id="gameSize" name="gameSize" onChange={handleGameSizeChange} value={gameSize}>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
                
                <label htmlFor={'locations'}>Locations:</label>
                <div style={{width:'100%', height: '50vh'}}>
                    <Map circles={[]} playerLocation={startingLocation}/>
                </div>
                <div className={styles.pageButtons}>
                    {locations.map((pair, index) => (
                        <button
                            id='locations'
                            key={index}
                            type="button"
                            className={`${styles.pageButton} ${currentPage === index ? styles.selected : ''} ${pair.isComplete ? styles.complete : ''}`}
                            onClick={() => setCurrentPage(index)}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                <div className={styles['form-group']}>
                    <label htmlFor={`location-${currentPage}`}>Location {currentPage + 1}:</label>
                    <input
                        type="text"
                        id={`location-${currentPage}`}
                        name="location"
                        value={locations[currentPage].location}
                        onChange={(e) => handleLocationChange(currentPage, e)}
                    />
                    <label htmlFor={`hint-${currentPage}`}>Hint {currentPage + 1}:</label>
                    <input
                        type="text"
                        id={`hint-${currentPage}`}
                        name="hint"
                        value={locations[currentPage].hint}
                        onChange={(e) => handleLocationChange(currentPage, e)}
                    />
                </div>

                <div className={styles['form-group']}>
                    <label htmlFor="maxDistance">Maximum Distance from Starting Location:</label>
                    <input
                        type="range"
                        id="maxDistance"
                        name="maxDistance"
                        min="1"
                        max="5"
                        step="0.1"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(e.target.value)}
                    />
                    <span>{maxDistance} km</span>
                </div>

                <button type="submit" disabled={locations.filter((pair) => !pair.isComplete).length !== 0}>Create</button>
            </form>
        </div>
    );
};

export default Create;
