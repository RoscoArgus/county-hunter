import { ref, set, get, update } from "firebase/database";
import { rtdb } from "../config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const createPreset = async (gameData) => {
  const docRef = await addDoc(collection(db, "presets"), gameData);
  return docRef.id;
};

const generateGameCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const createLobby = async (currentUser, presetId, timeLimit, maxPlayers) => {
  const gameCode = generateGameCode(); // Generate a random game code

  const lobbyRef = ref(rtdb, `games/${gameCode}`);

  const initialData = {
    host: currentUser.uid,
    players: {
      [currentUser.uid]: {
        username: currentUser.displayName,
        score: 0,
        online: true,
        inRange: false,
        lastActive: new Date().toISOString(),
      },
    },
    status: "waiting",
    presetId: presetId,
    timeLimit: timeLimit,
    maxPlayers: maxPlayers,
    endTime: null,
  };

  await update(lobbyRef, initialData); // Set data with the generated game code as the key

  return gameCode; // Return the generated game code
};

export const joinLobby = async (gameCode, currentUser) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}`);
  const lobbySnapshot = await get(lobbyRef);

  if (!lobbySnapshot.exists()) {
    throw new Error("Game does not exist");
  }

  const lobbyData = lobbySnapshot.val();
  if(lobbyData.status !== 'waiting') {
    throw new Error("Game has already started");
  }

  if (lobbyData.players[currentUser.uid]) {
    return; // Player already exists in the lobby
  }

  const updatedPlayers = {
    ...lobbyData.players,
    [currentUser.uid]: {
      username: currentUser.displayName,
      score: 0,
      online: true,
      inRange: false,
      lastActive: new Date().toISOString(),
    },
  };

  await update(lobbyRef, {
    players: updatedPlayers,
  });
};

export const getLobbyData = async (gameCode) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}`);
  const lobbySnapshot = await get(lobbyRef);

  if (!lobbySnapshot.exists()) {
    throw new Error("Game does not exist");
  }

  return lobbySnapshot.val();
};

export const updatePlayer = async (attr, value, gameCode, currentUser) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}/players/${currentUser.uid}`);
  await update(lobbyRef, {
    [attr]: value,
  });
}

export const startGame = async (gameCode, targets) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}`);
  
  try {
    const lobbySnapshot = await get(lobbyRef);
    if (lobbySnapshot.exists()) {
      const lobbyData = lobbySnapshot.val();
      const timeLimit = lobbyData.timeLimit;
      const players = lobbyData.players;

      const currentTime = new Date().getTime();
      const endTime = currentTime + timeLimit * 60 * 1000;

      const playerUpdates = Object.keys(players).map(playerId => {
        const playerRef = ref(rtdb, `games/${gameCode}/players/${playerId}`);
        return update(playerRef, { score: 0, remainingTargets: targets });
      });

      await Promise.all(playerUpdates);
      
      await update(lobbyRef, {
        status: "in-progress",
        endTime: endTime,
      });

    } else {
      console.error('No such lobby exists!');
    }
  } catch (error) {
    console.error('Error fetching timeLimit or updating lobby status:', error);
  }
};

export const endGame = async (gameCode) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}`);

  try {
    const lobbySnapshot = await get(lobbyRef);
    if (lobbySnapshot.exists()) {

      await update(lobbyRef, {
        status: "waiting",
        endTime: null,
      });

      console.log(`Game ${gameCode} ended successfully.`);
    } else {
      console.error('No such lobby exists!');
    }
  } catch (error) {
    console.error('Error fetching lobby data or updating game status:', error);
  }
};