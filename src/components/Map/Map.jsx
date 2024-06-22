import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const tileLayerUrls = {
    openStreetMap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    cartoDBVoyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    cartoDBDarkMatter: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    esriWorldStreetMap: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    esriWorldImagery: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    esriWorldTopoMap: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
};

const playAreaOptions = { fillColor: 'transparent', fillOpacity: 1.0 };
const locationOptions = { fillColor: 'blue', fillOpacity: 0.2 };

const mapBounds = [[-180, -180], [180, 180]];

const Map = ({ circles, playerLocation, startingLocation, gamemode, locationGuess }) => {
    const [mapCenter, setMapCenter] = useState(playerLocation ? playerLocation : { latitude: 0, longitude: 0 });
    const [mapZoom, setMapZoom] = useState(playerLocation ? 15 : 0);

    useEffect(() => {
        if (playerLocation) {
            setMapCenter(playerLocation);
            setMapZoom(15);
        }
    }, [playerLocation]); 

    return (
        <MapContainer
            center={[mapCenter.latitude, mapCenter.longitude]}
            zoom={mapZoom}
            minZoom={3}
            style={{ height: '100%', width: '100%' }}
            worldCopyJump={true}
            maxBounds={mapBounds}
            maxBoundsViscosity={1}
            attributionControl={false}
        >
            <TileLayer
                url={tileLayerUrls.cartoDBVoyager}
                attribution='<a href="https://leafletjs.com/">Leaflet</a> | &copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy;<a href="https://carto.com/attributions">CARTO</a>'
            />
            <AttributionControl position="bottomright" prefix={false} />
            {startingLocation && (
                <Circle
                    center={[startingLocation.location.latitude, startingLocation.location.longitude]}
                    radius={startingLocation.radius}
                    pathOptions={playAreaOptions}
                />
            )}
            {gamemode === 'create' && circles.map((circle, index) => {
                return <Marker key={index} position={[circle.latitude, circle.longitude]} />
})}
            {gamemode === 'classic' && circles.map((circle, index) => {
                return <Circle
                    key={index}
                    center={[circle.latitude, circle.longitude]}
                    radius={100}
                    pathOptions={locationOptions}
                />
            })}
            {locationGuess && (
                <Marker position={[locationGuess.latitude, locationGuess.longitude]} />
            )}
            {playerLocation && <Marker position={[playerLocation.latitude, playerLocation.longitude]} />}
        </MapContainer>
    );
};

export default Map;
