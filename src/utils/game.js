import { ref, set, get, child, update, push } from "firebase/database";
import { rtdb } from "../config/firebase";


export const joinLobby = async (gameCode, userId) => {
  const lobbyRef = ref(rtdb, `lobbies/${gameCode}`);
  const lobbySnapshot = await get(lobbyRef);

  if (!lobbySnapshot.exists()) {
    throw new Error("Lobby does not exist");
  }

  const lobbyData = lobbySnapshot.val();
  if (lobbyData.players.includes(userId)) {
    return;
  }

  await update(lobbyRef, {
    players: [...lobbyData.players, userId],
  });
};

export const createLobby = async (userId) => {
  const lobbyRef = ref(rtdb, "lobbies");
  const newLobbyRef = push(lobbyRef); // Generates a new unique key
  const gameCode = newLobbyRef.key; // Use the generated key as the game code

  const initialData = {
    creator: userId,
    players: [userId],
    status: "waiting",
    // Add any other initial data you want for the lobby
  };

  await set(newLobbyRef, initialData);

  return gameCode;
};

export const getLobbyData = async (gameCode) => {
  const lobbyRef = ref(rtdb, `lobbies/${gameCode}`);
  const lobbySnapshot = await get(lobbyRef);

  if (!lobbySnapshot.exists()) {
    throw new Error("Lobby does not exist");
  }

  return lobbySnapshot.val();
};

export const startGame = async (gameCode) => {
  const lobbyRef = ref(rtdb, `lobbies/${gameCode}`);
  await update(lobbyRef, {
    status: "in-progress",
  });
};
