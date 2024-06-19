import React, { useRef } from 'react';
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';

const libraries = ["places"];

const PlacesAutocomplete = ({ handlePlaceChanged, value, onChange, bounds }) => {
    const inputRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    if (loadError) {
        return <div>Error loading maps</div>;
    }

    return (
        isLoaded ? (
            <StandaloneSearchBox
                onLoad={ref => (inputRef.current = ref)}
                onPlacesChanged={() => handlePlaceChanged(inputRef.current.getPlaces())}
                bounds={bounds}
            >
                <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enter a location"
                    value={value}
                    onChange={onChange}
                />
            </StandaloneSearchBox>
        ) : (
            <div>Loading...</div>
        )
    );
}

export default PlacesAutocomplete;
