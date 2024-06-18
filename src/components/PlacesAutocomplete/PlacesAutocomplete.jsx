import React, { useRef } from 'react'
import { LoadScript, StandaloneSearchBox } from '@react-google-maps/api';

const PlacesAutocomplete = ({ handlePlaceChanged, children }) => {

    const inputRef = useRef(null);

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={["places"]}
        >
            <StandaloneSearchBox
                onLoad={ref => (inputRef.current = ref)}
                onPlacesChanged={() => handlePlaceChanged(inputRef.current.getPlaces())}
            >
                {children}
            </StandaloneSearchBox>
        </LoadScript>
    )
}

export default PlacesAutocomplete