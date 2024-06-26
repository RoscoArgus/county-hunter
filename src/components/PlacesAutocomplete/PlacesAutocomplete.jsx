import React, { useRef } from 'react';
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';

const libraries = ["places"];

const PlacesAutocomplete = ({ type, handlePlaceChanged, bounds, value }) => {
    const inputRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    if (loadError) {
        return <div>Error Loading Maps</div>;
    }

    return (
        isLoaded ? (
            <StandaloneSearchBox
                onLoad={ref => (inputRef.current = ref)}
                onPlacesChanged={() => handlePlaceChanged(type, inputRef.current.getPlaces())}
                bounds={bounds}
            >
                <input 
                    type="text" 
                    placeholder="Enter a location"
                    value={value}
                />
            </StandaloneSearchBox>
        ) : (
            <div>Loading...</div>
        )
    );
}

export default PlacesAutocomplete;
