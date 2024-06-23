// src/utils/game.js
import { ref, set, get, update, push } from "firebase/database";
import { rtdb } from "../config/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const createPreset = async (gameData) => {
  console.log(gameData)
  const docRef = await addDoc(collection(db, "temp_presets"), gameData);
  return docRef.id;
};

const generateGameCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
    creator: userId,
    players: [userId],
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
  if (lobbyData.players.includes(userId)) {
    return;
  }

  await update(lobbyRef, {
    players: [...lobbyData.players, userId],
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
