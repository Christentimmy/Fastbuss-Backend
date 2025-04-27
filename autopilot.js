const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
    extraHeaders: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGMyNWJiZGY3Nzc3NWI3ZDQxMjZlOCIsImVtYWlsIjoiY2hyaXN0ZW5tZXJjeTZAZ21haWwuY29tIiwicm9sZSI6InN1Yl9hZG1pbiIsImlhdCI6MTc0NTYyNjU4OSwiZXhwIjoxNzQ1Nzk5Mzg5fQ.QG8Fu1FlpHWKwvVT3j1RRicQKepD-SKiVpyCdZ6SeP4`
    }
});


let busId = "680d86d0ecff749963d6ad90";

// Connection handlers
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});

// Listen for responses
socket.on('admin:bus:route:deviation', (data) => {
    console.log('Route deviation detected:', data);
});

// Simulate smooth movement along the route
const routePoints = [
    { lat: -6.2088, lng: 106.8456 },  // Jakarta
    { lat: -6.3000, lng: 107.2000 },  // Mid point 1
    { lat: -6.4025, lng: 107.5422 },  // Mid point 2
    { lat: -6.5000, lng: 107.8000 },  // Deviation point
    { lat: -6.6000, lng: 107.9000 }   // Further deviation
];

let currentIndex = 0;

function sendLocationUpdate() {
    if (currentIndex >= routePoints.length) {
        console.log('Simulation complete');
        return;
    }

    const point = routePoints[currentIndex];
    console.log(`Sending location update ${currentIndex + 1}:`, point);

    socket.emit('driver:location:update', {
        busId: busId,
        latitude: point.lat,
        longitude: point.lng
    });

    currentIndex++;

    // Schedule next update
    setTimeout(sendLocationUpdate, 5000); // Send updates every 5 seconds
}

// Start the simulation
console.log('Starting bus movement simulation...');
sendLocationUpdate();

// Handle process termination
process.on('SIGINT', () => {
    console.log('Stopping simulation...');
    socket.disconnect();
    process.exit();
});