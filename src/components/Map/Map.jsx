import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from './Map.module.css';
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

const MapEvents = ({ playerLocation, setIndicatorPosition }) => {
  const map = useMap();

  const updateIndicatorPosition = () => {
    if (!playerLocation || !playerLocation.latitude || !playerLocation.longitude) {
      setIndicatorPosition(null);
      return;
    }

    const playerLatLng = L.latLng(playerLocation.latitude, playerLocation.longitude);
    const bounds = map.getBounds();

    if (!bounds.contains(playerLatLng)) {
      const mapSize = map.getSize();
      const containerPoint = map.latLngToContainerPoint(playerLatLng);
      const edgeBuffer = 15; // buffer from the edge of the screen

      // Check if the player marker is entirely outside the viewport
      if (
        containerPoint.x < -edgeBuffer ||
        containerPoint.x > mapSize.x + edgeBuffer ||
        containerPoint.y < -edgeBuffer ||
        containerPoint.y > mapSize.y + edgeBuffer
      ) {
        let top, left;

        if (containerPoint.y < 0) {
          top = edgeBuffer;
          left = Math.min(Math.max(containerPoint.x, edgeBuffer), mapSize.x - edgeBuffer);
        } else if (containerPoint.y > mapSize.y) {
          top = mapSize.y - edgeBuffer;
          left = Math.min(Math.max(containerPoint.x, edgeBuffer), mapSize.x - edgeBuffer);
        } else if (containerPoint.x < 0) {
          top = Math.min(Math.max(containerPoint.y, edgeBuffer), mapSize.y - edgeBuffer);
          left = edgeBuffer;
        } else if (containerPoint.x > mapSize.x) {
          top = Math.min(Math.max(containerPoint.y, edgeBuffer), mapSize.y - edgeBuffer);
          left = mapSize.x - edgeBuffer;
        }

        setIndicatorPosition({ top, left });
      } else {
        setIndicatorPosition(null);
      }
    } else {
      setIndicatorPosition(null);
    }
  };

  // Check if indicator
  useEffect(() => {
    map.on('move', updateIndicatorPosition);
    map.on('zoom', updateIndicatorPosition);

    updateIndicatorPosition();

    return () => {
      map.off('move', updateIndicatorPosition);
      map.off('zoom', updateIndicatorPosition);
    };
  }, [map, playerLocation]);

  return null;
};

const Map = ({ circles, playerLocation, playArea }) => {
  const [indicatorPosition, setIndicatorPosition] = useState(null);

  if (!playerLocation || !playerLocation.latitude || !playerLocation.longitude) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={[playerLocation.latitude, playerLocation.longitude]}
        zoom={15}
        minZoom={3}
        style={{ height: '100%', width: '100%' }}
        worldCopyJump={true}
        maxBounds={mapBounds}
        maxBoundsViscosity={1}
      >
        <TileLayer
          url={tileLayerUrls.cartoDBVoyager}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {/*<Rectangle bounds={mapBounds} />*/}
        <Circle
          center={[playArea.latitude, playArea.longitude]}
          radius={playArea.radius}
          pathOptions={playAreaOptions}
        />
        {circles.map((circle, index) => (
          <Marker key={index} position={[circle.latitude, circle.longitude]} />
        ))}
        <Marker position={[playerLocation.latitude, playerLocation.longitude]} />
        <MapEvents playerLocation={playerLocation} setIndicatorPosition={setIndicatorPosition} />
      </MapContainer>
      {indicatorPosition && <div className={styles.playerIndicator} style={{ top: indicatorPosition.top, left: indicatorPosition.left }} />}
    </div>
  );
};

export default Map;
