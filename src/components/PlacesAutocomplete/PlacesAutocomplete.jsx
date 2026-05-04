import React, { useEffect, useRef } from 'react';
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';

const libraries = ["places"];

const PlacesAutocomplete = ({ type, handlePlaceChanged, bounds, submittedTools, style }) => {
    const searchBoxRef = useRef(null);
    const inputElementRef = useRef(null); // New ref for the input element

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        if (submittedTools?.submitted) {
            // Clear the input value
            if (inputElementRef.current) {
                inputElementRef.current.value = '';
            }
            submittedTools?.setSubmitted(false);
        }
    }, [submittedTools]);

    if (loadError) {
        return <div>Error Loading Maps</div>;
    }

    return (
        isLoaded ? (
            <StandaloneSearchBox
                onLoad={ref => (searchBoxRef.current = ref)}
                onPlacesChanged={() => handlePlaceChanged(type, searchBoxRef.current.getPlaces())}
                bounds={bounds}
            >
                <input 
                    type="text" 
                    placeholder="Enter a location"
                    ref={inputElementRef} // Set the ref to the input element
                    style={style}
                />
            </StandaloneSearchBox>
        ) : (
            <div>Loading...</div>
        )
    );
}

export default PlacesAutocomplete;