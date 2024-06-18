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

const mapBounds = [[-180, -180], [180, 180]];

const Map = ({ circles, playerLocation, playArea }) => {

  const [mapCenter, setMapCenter] = useState(playerLocation ? playerLocation : { latitude: 0, longitude: 0 });
  const [mapZoom, setMapZoom] = useState(playerLocation ? 15 : 0);
  console.log(playerLocation);

  useEffect(() => {
    if(playerLocation) {
      setMapCenter(playerLocation);
      setMapZoom(15);
    } 
  }, [playerLocation]);

  useEffect(() => {
    console.log("Map center updated")
  }, [mapCenter])

  return (
    <>
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
        {playArea && <Circle
          center={[playArea.latitude, playArea.longitude]}
          radius={playArea.radius}
          pathOptions={playAreaOptions}
        />}
        {circles.map((circle, index) => (
          <Marker key={index} position={[circle.latitude, circle.longitude]} />
        ))}
        {playerLocation && <Marker position={[playerLocation.latitude, playerLocation.longitude]} />}
      </MapContainer>
    </>
  );
};

export default Map;
