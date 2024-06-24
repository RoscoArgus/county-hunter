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

export const createLobby = async (userId, presetId) => {
  const gameCode = generateGameCode(); // Generate a random game code

  const lobbyRef = ref(rtdb, `games/${gameCode}`);

  const initialData = {
    host: userId,
    players: {
      [userId]: {
        username: userId,
        score: 0,
        online: true,
        lastActive: new Date().toISOString(),
      },
    },
    status: "waiting",
    presetId: presetId,
  };

  await set(lobbyRef, initialData); // Set data with the generated game code as the key

  return gameCode; // Return the generated game code
};

export const joinLobby = async (gameCode, userId) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}`);
  const lobbySnapshot = await get(lobbyRef);

  if (!lobbySnapshot.exists()) {
    throw new Error("Game does not exist");
  }

  const lobbyData = lobbySnapshot.val();
  if (lobbyData.players[userId]) {
    return; // Player already exists in the lobby
  }

  const updatedPlayers = {
    ...lobbyData.players,
    [userId]: {
      username: userId,
      score: 0,
      online: true,
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

export const startGame = async (gameCode) => {
  const lobbyRef = ref(rtdb, `games/${gameCode}`);
  await update(lobbyRef, {
    status: "in-progress",
  });
};
