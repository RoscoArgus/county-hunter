import React, { useState, useEffect } from 'react';
import styles from './Game.module.css';
import useGeolocation from '../../hooks/useGeolocation';
import Map from '../../components/Map/Map';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';

/*
Possible Gamemodes:
Classic: Player has to guess the location in N circles, top-score wins (points deducted for incorrect guesses)
Time Trial: Most done in time limit wins
Walking Tour: Player has to visit N locations in order
*/

const Game = () => {
    const gameOptions = {
        mode: 'classic',
        circles: [
            { //clockwork door
                latitude: 53.3460086,
                longitude: -6.262603499999999,
                id: "ChIJCV3aR4MOZ0gR0CKVuX5jU2s"
            },
            { //trinity
                latitude: 53.3437935,
                longitude: -6.2545716,
                id: "ChIJ3Y7HLZsOZ0gRZ2FxjA3-ACc"
            },
            { //cineworld
                latitude: 53.35022180000001,
                longitude: -6.2676763,
                id: "ChIJrRGxGIIOZ0gRhuM6V5yGYIQ"
            },
            { //garden of remembrance
                latitude: 53.3509656,
                longitude: -6.2500268,
                id: "ChIJh7sPTXIPZ0gRk2G86s2Yn6Q"
            },
            { //connolly station
                latitude: 53.3538817,
                longitude: -6.264142800000001,
                id: "ChIJCYaC2YYOZ0gRxFEZhvKYbOs"
            }
        ],
        range: 100,
        startingLocation: { latitude: 53.34983, longitude: -6.26026, radius: 1000 },
        radius: 1000
    };

    const [playerLocation, setPlayerLocation] = useState(gameOptions.startingLocation);
    const [randomPoints, setRandomPoints] = useState([]);
    const [guessPrompt, setGuessPrompt] = useState(false);
    const [locationGuess, setLocationGuess] = useState(null);
    const [locationInput, setLocationInput] = useState('');
    const [bounds, setBounds] = useState(null);
    const [guessResult, setGuessResult] = useState(null);

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

    useEffect(() => {
        const temp = gameOptions.circles.map(circle => getRandomPointWithinRadius(circle.latitude, circle.longitude, 100));
        setRandomPoints(temp);
    }, []);

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
        let withinRange = false;
        randomPoints.forEach(point => {
            const distance = getDistanceFromLatLonInMeters(
                playerLocation.latitude,
                playerLocation.longitude,
                point.latitude,
                point.longitude
            );
            if (distance <= gameOptions.range) {
                withinRange = true;
            }
        });
        setGuessPrompt(withinRange);
    }, [playerLocation, randomPoints, gameOptions.range]);

    useEffect(() => {
        updateBounds(playerLocation);
    }, [playerLocation]);

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

    const checkGuess = () => {
        let guessedCorrectly = false;
        const updatedRandomPoints = [...randomPoints];
    
        randomPoints.forEach((point, index) => {
            const distance = getDistanceFromLatLonInMeters(
                playerLocation.latitude,
                playerLocation.longitude,
                point.latitude,
                point.longitude
            );
            if (distance <= gameOptions.range) {
                const targetCircle = gameOptions.circles.find(circle => circle.id === locationGuess.id);
                if (targetCircle && locationGuess.id === targetCircle.id) {
                    guessedCorrectly = true;
                    // Remove the guessed circle from updatedRandomPoints
                    updatedRandomPoints.splice(index, 1);
                }
            }
        });
    
        setGuessResult(guessedCorrectly ? 'Correct Guess!' : 'Wrong Guess!');
        setRandomPoints(updatedRandomPoints);
        setLocationGuess(null); // Clear locationGuess after checking
        setLocationInput('');
    };

    return (
        <div style={{ width: '100%', height: '100vh'}}>
            <Map
                circles={randomPoints}
                playerLocation={playerLocation}
                startingLocation={gameOptions.startingLocation}
                gamemode={gameOptions.mode}
                locationGuess={locationGuess} // Pass locationGuess to Map
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

export default Game;
