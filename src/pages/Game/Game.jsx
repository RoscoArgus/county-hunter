import React, { useState, useEffect } from 'react';
//import { db } from '../../../config/firebase';
//import useGeolocation from '../../hooks/useGeolocation';
import { useGeolocation } from '../../utils/player';
import Map from '../../components/Map/Map';

const Game = () => {
    const playerLocation = useGeolocation();
    const playArea = {
        latitude: 53.34983,
        longitude: -6.26026,
        radius: 1000,
    }
    const [circles, setCircles] = useState([{latitude: 53.34983, longitude: -6.26026, radius: 1000}]);
    const [justEntered, setJustEntered] = useState(false);

    const isWithinCircle = (playerLocation, circle) => {
        const R = 6371e3; // metres
        const φ1 = playerLocation.latitude * Math.PI/180; // φ, λ in radians
        const φ2 = circle.latitude * Math.PI/180;
        const Δφ = (circle.latitude - playerLocation.latitude) * Math.PI/180;
        const Δλ = (circle.longitude - playerLocation.longitude) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        const distance = R * c; // in metres
        
        if(distance <= circle.radius && !justEntered) {
            setJustEntered(true);
        }
        return distance <= circle.radius;
    };  

    /*useEffect(() => {
        // Fetch circles from Firestore
        const fetchCircles = async () => {
            const snapshot = await db.collection('games').doc('gameId').collection('circles').get();
            const circlesData = snapshot.docs.map(doc => doc.data());
            setCircles(circlesData);
        };

        fetchCircles();
    }, []);*/

    useEffect(() => {
        if (playerLocation.latitude && playerLocation.longitude) {
        circles.forEach(circle => {
            // Handle the event when the player is within the circle (e.g., allow guess)
            if (isWithinCircle(playerLocation, circle) && !justEntered) {
                console.log("Player is within the circle!");
            }
            // Handle the event when the player has left the circle (e.g., disable guess)
            else if (!isWithinCircle(playerLocation, circle) && justEntered) {
                setJustEntered(false);
                console.log("Player has left the circle")
            }
        });
        }
    }, [playerLocation, circles]);

    return (
        <Map circles={circles} playerLocation={playerLocation==null ? {latitude: 0, longitude: 0} : playerLocation} playArea={playArea}/>
    );
};

export default Game;