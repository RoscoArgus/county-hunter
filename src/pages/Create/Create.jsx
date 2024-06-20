import React, { useState } from 'react';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';
import Map from '../../components/Map/Map';

/**
 * TODO
 * - Fix how starting location input is handled
 * - Fix error in console RE:controlled input being uncontrolled
 * - Fix how map zoom works when starting location selected
 * - Add Firebase submission
 * - Styling
 */

const Create = () => {
    const [startingLocation, setStartingLocation] = useState(null);
    const [radius, setRadius] = useState(1000); // Default radius
    const [gameSize, setGameSize] = useState(5); // Default game size
    const [locations, setLocations] = useState(Array(5).fill(null)); // Array to hold location objects
    const [locationInputs, setLocationInputs] = useState(Array(5).fill('')); // Array to hold input values
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
    const [bounds, setBounds] = useState(null); // State to hold search bounds

    const handlePlaceChanged = (places) => {
        if (places.length > 0) {
        const place = places[0];
        console.log(place);

        const location = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
        };

        if (currentLocationIndex === 0) {
            const newStartingLocation = { ...location, radius };
            setStartingLocation(newStartingLocation);
            // Set bounds based on the starting location
            const sw = new window.google.maps.LatLng(
                location.latitude - 0.05, location.longitude - 0.05);
            const ne = new window.google.maps.LatLng(
                location.latitude + 0.05, location.longitude + 0.05);
            setBounds(new window.google.maps.LatLngBounds(sw, ne));
        } else {
            const newLocations = [...locations];
            newLocations[currentLocationIndex - 1] = location;
            setLocations(newLocations);
        }

        // Persist input value after selection
        const newLocationInputs = [...locationInputs];
        newLocationInputs[currentLocationIndex] = place.formatted_address || '';
        setLocationInputs(newLocationInputs);
        }
    };

    const handleRadiusChange = (event) => {
        const newRadius = event.target.value;
        setRadius(newRadius);
        if (startingLocation) {
            setStartingLocation({ ...startingLocation, radius: newRadius });
            // Update bounds based on the new radius
            const sw = new window.google.maps.LatLng(
                startingLocation.latitude - 0.05, startingLocation.longitude - 0.05);
            const ne = new window.google.maps.LatLng(
                startingLocation.latitude + 0.05, startingLocation.longitude + 0.05);
            setBounds(new window.google.maps.LatLngBounds(sw, ne));
        }
    };

    const handleGameSizeChange = (event) => {
        const newSize = parseInt(event.target.value);
        if (newSize > gameSize) {
        // Expand the arrays by adding null values
        setLocations([...locations, ...Array(newSize - gameSize).fill(null)]);
        setLocationInputs([...locationInputs, ...Array(newSize - gameSize).fill('')]);
        } else {
        // Shrink the arrays and retain the first N elements
        const truncatedLocations = locations.slice(0, newSize);
        const truncatedLocationInputs = locationInputs.slice(0, newSize);
        setLocations(truncatedLocations);
        setLocationInputs(truncatedLocationInputs);
        }
        setGameSize(newSize);
        setCurrentLocationIndex(0); // Reset current location index
    };

    const handleLocationButtonClick = (index) => {
        setCurrentLocationIndex(index + 1);
    };

    const handleInputChange = (index, value) => {
        const newLocationInputs = [...locationInputs];
        newLocationInputs[index] = value;
        setLocationInputs(newLocationInputs);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const gameData = {
        startingLocation,
        radius,
        gameSize,
        locations
        };
        console.log("Submitting game data:", gameData);
        // Placeholder for Firebase submission
        // submitToFirebase(gameData);
    };    

    return (
        <div>
        <form onSubmit={handleSubmit}>
            <div>
            <label>Starting Location:</label>
            <PlacesAutocomplete
                handlePlaceChanged={handlePlaceChanged}
                value={locationInputs[0]}
                onChange={(e) => handleInputChange(0, e.target.value)}
            />
            </div>
            <div>
            <label>Radius: {radius} meters</label>
            <input
                type="range"
                min="100"
                max="5000"
                value={radius}
                onChange={handleRadiusChange}
            />
            </div>
            <div>
            <label>Game Size:</label>
            <select value={gameSize} onChange={handleGameSizeChange}>
                <option value="5">Small (5 locations)</option>
                <option value="10">Medium (10 locations)</option>
                <option value="15">Large (15 locations)</option>
            </select>
            </div>
            <div>
            <label>Choose Locations:</label>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, 1fr)` }}>
                {Array.from({ length: gameSize }, (_, index) => (
                <button
                    type="button"
                    key={index}
                    onClick={() => handleLocationButtonClick(index)}
                    style={{ padding: '10px', margin: '5px' }}
                >
                    {index + 1}
                </button>
                ))}
            </div>
            </div>
            <div>
            {currentLocationIndex > 0 && (
                <>
                <label>Choose Location {currentLocationIndex}:</label>
                <PlacesAutocomplete
                    handlePlaceChanged={handlePlaceChanged}
                    value={locationInputs[currentLocationIndex]}
                    onChange={(e) => handleInputChange(currentLocationIndex, e.target.value)}
                    bounds={bounds}
                />
                </>
            )}
            </div>
            <button type="submit">Submit</button>
        </form>
        <div style={{ height: '500px', marginTop: '20px' }}>
            <Map
            circles={locations.filter(loc => loc)}
            startingLocation={startingLocation}
            playerLocation={null} /* Replace null with actual player location data if available */
            gamemode='create'
            />
        </div>
        </div>
    );
};

export default Create;