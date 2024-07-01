export const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      0.5 - Math.cos(dLat) / 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
};

export const getRandomPointWithinRadius = (lat, lng, radius) => {
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