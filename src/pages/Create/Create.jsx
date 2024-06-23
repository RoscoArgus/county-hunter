import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPreset, createLobby } from '../../utils/game';
import { useUsername } from '../../context/UsernameContext';
import PlacesAutocomplete from '../../components/PlacesAutocomplete/PlacesAutocomplete';
import Map from '../../components/Map/Map';

const Create = () => {
  const [startingLocation, setStartingLocation] = useState(null);
  const [radius, setRadius] = useState(1000);
  const [gameSize, setGameSize] = useState(5);
  const [targets, setTargets] = useState(Array(5).fill(null));
  const [locationInputs, setLocationInputs] = useState(Array(5).fill(''));
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [bounds, setBounds] = useState(null);

  const navigate = useNavigate();
  const { username } = useUsername();

  const getStreetName = (place) => {
    for (let component of place.address_components) {
      if (component.types.includes('route')) {
        return component.long_name;
      }
    }
    return 'No Street Data Found';
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

  const handlePlaceChanged = (places) => {
    if (places.length <= 0) return;

    const range = 100;

    const place = places[0];

    let target = {
      location: {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      },
      types: place.types,
      street: getStreetName(place),
      id: place.place_id,
      locationName: place.name
    };

    if (currentLocationIndex === 0) {
      const newStartingLocation = { ...target, radius };
      setStartingLocation(newStartingLocation);
      const sw = new window.google.maps.LatLng(
        target.location.latitude - 0.05, target.location.longitude - 0.05);
      const ne = new window.google.maps.LatLng(
        target.location.latitude + 0.05, target.location.longitude + 0.05);
      setBounds(new window.google.maps.LatLngBounds(sw, ne));
    } else {
      target = { ...target, randOffset: getRandomPointWithinRadius(place.geometry.location.lat(), place.geometry.location.lng(), range) };
      const newTargets = [...targets];
      newTargets[currentLocationIndex - 1] = target;
      setTargets(newTargets);
    }

    const newLocationInputs = [...locationInputs];
    newLocationInputs[currentLocationIndex] = place.formatted_address || '';
    setLocationInputs(newLocationInputs);
  };

  const handleRadiusChange = (event) => {
    const newRadius = event.target.value;
    setRadius(newRadius);
    if (startingLocation) {
      setStartingLocation({ ...startingLocation, radius: newRadius });
      const sw = new window.google.maps.LatLng(
        startingLocation.location.latitude - 0.05, startingLocation.location.longitude - 0.05);
      const ne = new window.google.maps.LatLng(
        startingLocation.location.latitude + 0.05, startingLocation.location.longitude + 0.05);
      setBounds(new window.google.maps.LatLngBounds(sw, ne));
    }
  };

  const handleGameSizeChange = (event) => {
    const newSize = parseInt(event.target.value);
    if (newSize > gameSize) {
      setTargets([...targets, ...Array(newSize - gameSize).fill(null)]);
      setLocationInputs([...locationInputs, ...Array(newSize - gameSize).fill('')]);
    } else {
      const truncatedTargets = targets.slice(0, newSize);
      const truncatedLocationInputs = locationInputs.slice(0, newSize);
      setTargets(truncatedTargets);
      setLocationInputs(truncatedLocationInputs);
    }
    setGameSize(newSize);
    setCurrentLocationIndex(0);
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
      creator: username,
      startingLocation,
      radius,
      gameSize,
      targets
    };

    try {
      const presetId = await createPreset(gameData);
      const gameCode = await createLobby(username, presetId);
      navigate(`/game/${gameCode}`);
    } catch (e) {
      console.error("Error creating game: ", e);
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
      <div style={{ height: '500px', marginTop: '20px' }}>
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