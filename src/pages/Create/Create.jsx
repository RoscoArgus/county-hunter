import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
    const [targets, settargets] = useState(Array(5).fill(null)); // Array to hold location objects
    const [locationInputs, setLocationInputs] = useState(Array(5).fill('')); // Array to hold input values
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
    const [bounds, setBounds] = useState(null); // State to hold search bounds

    const getStreetName = (place) => {
        for (let component of place.address_components) {
            if (component.types.includes('route')) {
                return component.long_name;
            }
        }
        return 'No Street Data Found';
    }

    const getRandomPointWithinRadius = (lat, lng, radius) => {
        const radiusInDegrees = radius / 111320;
        const minDistanceInDegrees = 10 / 111320;

        let distance, angle;

        do {
            distance = Math.random() * radiusInDegrees;
        } while (distance < minDistanceInDegrees);

        angle = Math.random() * 2 * Math.PI;

        const offsetLat = distance * Math.cos(angle);
        const offsetLng = distance * Math.sin(angle);

        const newLat = lat + offsetLat;
        const newLng = lng + offsetLng / Math.cos(lat * Math.PI / 180);

        return {
            latitude: newLat,
            longitude: newLng
        };
    };

    const handlePlaceChanged = (places) => {
        // Early exit
        if(places.length<=0) 
            return;
        
        const range = 100; // Default range, TODO make this dynamic

        const place = places[0];
        console.log(place);

        /** 
         * TODO right now the center of the circle within which the location lies is 
         * randomised only once at creation. This should be randomised every time a new
         * game is started with this preset to ensure variety. Consider doing this per session?
        */
        let target = {
            location: {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
            },
            types: place.types,
            street: getStreetName(place),
            id: place.place_id,
            locataionName: place.name
        };

        if (currentLocationIndex === 0) {
            const newStartingLocation = { ...target, radius };
            setStartingLocation(newStartingLocation);
            // Set bounds based on the starting location
            const sw = new window.google.maps.LatLng(
                target.location.latitude - 0.05, target.location.longitude - 0.05);
            const ne = new window.google.maps.LatLng(
                target.location.latitude + 0.05, target.location.longitude + 0.05);
            setBounds(new window.google.maps.LatLngBounds(sw, ne));
        } else {
            target = {...target, randOffset: getRandomPointWithinRadius(place.geometry.location.lat(), place.geometry.location.lng(), range)}
            const newtargets = [...targets];
            newtargets[currentLocationIndex - 1] = target;
            settargets(newtargets);
        }

        // Persist input value after selection
        const newLocationInputs = [...locationInputs];
        newLocationInputs[currentLocationIndex] = place.formatted_address || '';
        setLocationInputs(newLocationInputs);
    };

    const handleRadiusChange = (event) => {
        const newRadius = event.target.value;
        setRadius(newRadius);
        if (startingLocation) {
            setStartingLocation({ ...startingLocation, radius: newRadius });
            // Update bounds based on the new radius
            const sw = new window.google.maps.LatLng(
                startingLocation.location.latitude - 0.05, startingLocation.longitude - 0.05);
            const ne = new window.google.maps.LatLng(
                startingLocation.location.latitude + 0.05, startingLocation.longitude + 0.05);
            setBounds(new window.google.maps.LatLngBounds(sw, ne));
        }
    };

    const handleGameSizeChange = (event) => {
        const newSize = parseInt(event.target.value);
        if (newSize > gameSize) {
        // Expand the arrays by adding null values
        settargets([...targets, ...Array(newSize - gameSize).fill(null)]);
        setLocationInputs([...locationInputs, ...Array(newSize - gameSize).fill('')]);
        } else {
        // Shrink the arrays and retain the first N elements
        const truncatedtargets = targets.slice(0, newSize);
        const truncatedLocationInputs = locationInputs.slice(0, newSize);
        settargets(truncatedtargets);
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        const gameData = {
            title: 'Test Game',
            creator: 'roscoargus',
            startingLocation,
            radius,          
            gameSize,       
            targets        
        };
        console.log("Submitting game data:", gameData);
        try {
            // Add a new document with a generated id.
            const docRef = await addDoc(collection(db, "presets"), gameData);
            console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
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
                <option value="5">Small (5 targets)</option>
                <option value="10">Medium (10 targets)</option>
                <option value="15">Large (15 targets)</option>
            </select>
            </div>
            <div>
            <label>Choose targets:</label>
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
        {console.log(startingLocation)}
        <div style={{ height: '500px', marginTop: '20px' }}>
            <Map
                circles={targets.filter(loc => loc)}
                startingLocation={startingLocation}
                playerLocation={null} /* Replace null with actual player location data if available */
                gamemode='create'
            />
        </div>
        </div>
    );
};

export default Create;