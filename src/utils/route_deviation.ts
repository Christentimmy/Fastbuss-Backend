import haversine from 'haversine-distance'; 

function checkRouteDeviation(currentLocation: { latitude: number; longitude: number }, waypoints: { latitude: number; longitude: number }[]) {
  const thresholdMeters = 300; 

  for (const waypoint of waypoints) {
    const distance = haversine(currentLocation, waypoint);
    if (distance <= thresholdMeters) {
      return false; // Still on route
    }
  }
  return true; // Off route
}

export default checkRouteDeviation;
