import React, { useEffect, useState } from 'react';
import styles from './Map.module.css';
import { MapContainer, TileLayer, Circle, Marker, AttributionControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaCrosshairs } from 'react-icons/fa';
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
const startOptions = { fillColor: '#ffaaff', fillOpacity: 0.3, color: '#ffaaff'};

const mapBounds = [[-180, -180], [180, 180]];
const defaultCenter = [0, 0];
const defaultZoom = 2;

const validStartingLocation = (startingLocation) => {
    return startingLocation && startingLocation.location && startingLocation.radius;
}

const validPlayerLocation = (playerLocation) => {
    return playerLocation && playerLocation.latitude !== null && playerLocation.longitude !== null;
}

const UpdateMapView = ({ center, zoom, startingLocation, playerLocation, setMapCenter, setMapZoom, tracking }) => {
    const map = useMap();

    useEffect(() => {
        if (tracking && center && zoom !== undefined) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map, tracking]);

    useEffect(() => {

        map.zoomControl[tracking ? 'disable' : 'enable']();

        // Toggle scroll wheel zooming
        map.scrollWheelZoom[tracking ? 'disable' : 'enable']();

        map.doubleClickZoom[tracking ? 'disable' : 'enable']();

        // Toggle touch zoom
        map.touchZoom[tracking ? 'disable' : 'enable']();

        // Toggle box zoom
        map.boxZoom[tracking ? 'disable' : 'enable']();
    }, [tracking, map]);

    useEffect(() => {
        const validStarting = validStartingLocation(startingLocation);
        const validPlayer = validPlayerLocation(playerLocation);

        if (validStarting && validPlayer) {
            if (tracking) {
                const bounds = L.latLngBounds([
                    L.latLng(startingLocation.location.latitude, startingLocation.location.longitude),
                    L.latLng(playerLocation.latitude, playerLocation.longitude)
                ]);
                map.fitBounds(bounds, { padding: [30, 30] });
            } else {
                setMapCenter([
                    (startingLocation.location.latitude+playerLocation.latitude)/2, 
                    (startingLocation.location.longitude+playerLocation.longitude)/2]
                );
            }
        } else if (validStarting) {
            setMapCenter([startingLocation.location.latitude, startingLocation.location.longitude]);
            if (tracking) 
                setMapZoom(15 - (startingLocation.radius / 1750));
        } else if (validPlayer) {
            setMapCenter([playerLocation.latitude, playerLocation.longitude]);
            if (tracking) 
                setMapZoom(18);
        } else {
            setMapCenter(defaultCenter);
            if (tracking) 
                setMapZoom(defaultZoom);
        }
    }, [startingLocation, playerLocation, setMapCenter, setMapZoom, map, tracking]);

    return null;
};

const Map = ({ circles = [], playerLocation, startingLocation, gameMode, locationGuess }) => {
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(defaultZoom);
    const [tracking, setTracking] = useState(true); // State for toggle    

    const toggleTracking = () => {
        setTracking(!tracking);
    };

    return (
        <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            minZoom={3}
            style={{ height: '100%', width: '100%' }}
            worldCopyJump={true}
            maxBounds={mapBounds}
            maxBoundsViscosity={1}
            attributionControl={false}
        >
            <UpdateMapView 
                center={mapCenter} 
                zoom={mapZoom} 
                startingLocation={startingLocation} 
                playerLocation={playerLocation}
                setMapCenter={setMapCenter}
                setMapZoom={setMapZoom}
                tracking={tracking}
            />
            <AttributionControl position="bottomright" prefix={false} />
            <TileLayer
                url={tileLayerUrls.cartoDBVoyager}
                attribution='<a href="https://leafletjs.com/">Leaflet</a> | &copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy;<a href="https://carto.com/attributions">CARTO</a>'
            />
            {validPlayerLocation(playerLocation) && (
                <Marker position={[playerLocation.latitude, playerLocation.longitude]} />
            )}
            {validStartingLocation(startingLocation) && (
                <React.Fragment>
                    <Circle
                        center={[startingLocation.location.latitude, startingLocation.location.longitude]}
                        radius={startingLocation.radius}
                        pathOptions={playAreaOptions}
                    />
                    {gameMode === 'lobby' && (
                        <Circle
                            center={[startingLocation.location.latitude, startingLocation.location.longitude]}
                            radius={50}
                            pathOptions={startOptions}
                        />
                    )}
                </React.Fragment>
            )}
            {gameMode === 'create' && circles.map((circle, index) => (
                <Marker 
                    key={index} 
                    position={[circle.latitude, circle.longitude]} 
                />
            ))}
            {gameMode === 'classic' && circles.map((circle, index) => (
                <Circle
                    key={index}
                    center={[circle.latitude, circle.longitude]}
                    radius={100}
                    pathOptions={locationOptions}
                />
            ))}
            {locationGuess && (
                <Marker position={[locationGuess.latitude, locationGuess.longitude]} />
            )}

            <div className={`${styles.leafletControl} leaflet-top leaflet-right`}>
                <button
                    onClick={toggleTracking}
                    className={`${styles.leafletButton} ${tracking ? styles.active : ''} leaflet-control leaflet-bar`}
                >
                    <FaCrosshairs />
                </button>
            </div>
        </MapContainer>
    );
};

export default Map;
