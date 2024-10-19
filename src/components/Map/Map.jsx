import React, { useEffect, useState } from 'react';
import styles from './Map.module.css';
import { MapContainer, TileLayer, Circle, AttributionControl, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FaCrosshairs } from 'react-icons/fa';
import { STARTING_RANGE, TARGET_RANGE } from '../../constants';
import 'leaflet/dist/leaflet.css';
import UserMarker from '../UserMarker/UserMarker';
import TargetMarker from '../TargetMarker/TargetMarker';
import { useAuth } from '../../context/AuthContext';

const tileLayerUrls = {
    openStreetMap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    cartoDBVoyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    cartoDBDarkMatter: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    esriWorldStreetMap: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    esriWorldImagery: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    esriWorldTopoMap: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    jawgCustom: `https://tile.jawg.io/b7e0916d-17f5-4ed0-aa33-49f06754f337/{z}/{x}/{y}{r}.png?access-token=${import.meta.env.VITE_JAWG_ACCESS_TOKEN}`
};

const playAreaOptions = { fillColor: 'transparent', fillOpacity: 1.0 };
const locationOptions = { fillColor: 'blue', fillOpacity: 0.2, color: 'blue' };
const startOptions = { fillColor: '#ffaaff', fillOpacity: 0.3, color: '#ffaaff'};
const selectedOptions = { fillColor: 'yellow', fillOpacity: 0.3, color: 'yellow' };

const mapBounds = [[-180, -180], [180, 180]];
const defaultCenter = [0, 0];
const defaultZoom = 2;

const validStartingLocation = (startingLocation) => {
    return startingLocation && startingLocation.location && startingLocation.radius;
}

const validPlayerLocation = (playerLocation) => {
    return playerLocation && playerLocation.latitude && playerLocation.longitude;
}

const UpdateMapView = ({ center, zoom, startingLocation, playerLocation, setMapCenter, setMapZoom, tracking, setTracking }) => {
    const map = useMap();

    useEffect(() => {
        if (tracking && center && zoom !== undefined) {
            map.setView(center, zoom, { animate: true, duration: 3 });
        }
    }, [startingLocation, center, zoom, map, tracking]);

    useEffect(() => {
        map.zoomControl[tracking ? 'disable' : 'enable']();
        map.scrollWheelZoom[tracking ? 'disable' : 'enable']();
        map.doubleClickZoom[tracking ? 'disable' : 'enable']();
        map.touchZoom[tracking ? 'disable' : 'enable']();
        map.boxZoom[tracking ? 'disable' : 'enable']();

        map.on('dragstart', () => setTracking(false));

        return () => {
            map.off('dragstart');
        };

    }, [tracking, map]);

    useEffect(() => {
        const validStarting = validStartingLocation(startingLocation);
        const validPlayer = validPlayerLocation(playerLocation);

        const updateBounds = () => {
            try {
                if (validStarting && validPlayer) {
                    if (tracking) {
                        const bounds = L.latLngBounds([
                            L.latLng(startingLocation.location.latitude, startingLocation.location.longitude),
                            L.latLng(playerLocation.latitude, playerLocation.longitude)
                        ]);
                        map.fitBounds(bounds, { padding: [30, 30], animate: true });
                    } else {
                        setMapCenter([
                            (startingLocation.location.latitude+playerLocation.latitude)/2, 
                            (startingLocation.location.longitude+playerLocation.longitude)/2],
                            { animate: true }
                        );
                    }
                } else if (validStarting) {
                    setMapCenter(
                        [startingLocation.location.latitude, startingLocation.location.longitude],
                        { animate: true }
                    );
                    if (tracking) 
                        setMapZoom(15 - (startingLocation.radius / 1750), { animate: true });
                } else if (validPlayer) {
                    setMapCenter([playerLocation.latitude, playerLocation.longitude], { animate: true });
                    if (tracking) 
                        setMapZoom(18, { animate: true });
                } else {
                    setMapCenter(defaultCenter, { animate: true });
                    if (tracking) 
                        setMapZoom(defaultZoom, { animate: true });
                }
            } catch (error) {
                console.log('Error updating map view. Trying again...');
                setTimeout(updateBounds, 1000);
            }
        }

        updateBounds();
    }, [startingLocation, playerLocation, setMapCenter, setMapZoom, map, tracking]);

        

    return null;
};

const Map = ({ circles = [], playerLocation, startingLocation, gameMode, locationGuess, players }) => {
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(defaultZoom);
    const [tracking, setTracking] = useState(true); // State for toggle    
    const { currentUser } = useAuth();

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
                setTracking={setTracking}
            />
            <AttributionControl position="bottomright" prefix={false} />
            <TileLayer
                url={tileLayerUrls.jawgCustom}
                attribution='<a href="https://leafletjs.com/">Leaflet</a> | <a href=\"https://www.jawg.io?utm_medium=map&utm_source=attribution\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors'
            />
            {validStartingLocation(startingLocation) && (
                <React.Fragment>
                    <Circle
                        center={[startingLocation.location.latitude, startingLocation.location.longitude]}
                        radius={startingLocation.radius}
                        pathOptions={playAreaOptions}
                    />
                    {/*Starting Circle*/}
                    {(gameMode === 'lobby' || gameMode === 'create' || circles?.length === 0) && (
                        <Circle
                            center={[startingLocation.location.latitude, startingLocation.location.longitude]}
                            radius={STARTING_RANGE}
                            pathOptions={startOptions}
                        />
                    )}
                </React.Fragment>
            )}
            {players && players.map((player, index) => {
                if(!validPlayerLocation(player.location)) return null;
                return (
                    <UserMarker 
                        key={index} 
                        position={[player.location.latitude, player.location.longitude]} 
                        user={player} 
                    >
                        <Popup>
                            <h3>{player.displayName}</h3>
                        </Popup>
                    </UserMarker>
                );
                }
            )}
            {validPlayerLocation(playerLocation) && (
                <UserMarker position={[playerLocation?.latitude, playerLocation.longitude]} user={currentUser}>
                    <Popup>
                        <h3>{currentUser?.displayName} (You)</h3>
                    </Popup>
                </UserMarker>
            )}
            {(gameMode === 'create' || gameMode === 'lobby') && circles.map((circle, index) => (
                <TargetMarker 
                    key={index} 
                    position={[circle.latitude, circle.longitude]} 
                >
                    <Popup className="request-popup">
                        <h3>{circle.locationName}</h3>
                        <h4>Hint: {circle.hint}</h4>
                        <h4>Street: {circle.street ? circle.street : 'None'}</h4>
                        <h4>Reviews: {circle.reviews ? 'Yes' : 'No'}</h4>
                        <h4>Types: {circle.types?.length > 1 ? 'Yes' : 'No'}</h4>
                    </Popup>
                </TargetMarker>
            ))}
            {gameMode === 'classic' && circles.map((circle, index) => {
                return <Circle
                    key={index}
                    center={[circle.latitude, circle.longitude]}
                    radius={TARGET_RANGE}
                    pathOptions={circle.isSelected ? selectedOptions : locationOptions}
                />
            })}
            {locationGuess && (
                <TargetMarker position={[locationGuess.latitude, locationGuess.longitude]} />
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
