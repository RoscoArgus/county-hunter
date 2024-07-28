const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database();
const FIVE_MINUTES = 5 * 60 * 1000;

// Function to remove inactive players
exports.removeInactivePlayers = functions.pubsub.schedule("every 5 minutes")
    .onRun(async (context) => {
      const now = Date.now();
      const gamesRef = db.ref("games");

      const snapshot = await gamesRef.once("value");
      const updates = {};

      snapshot.forEach((gameSnap) => {
        const gameKey = gameSnap.key;
        const playersRef = gameSnap.child("players");
        const gameData = gameSnap.val();
        if (gameData.status === "in-progress") {
          return null;
        }
        playersRef.forEach((playerSnap) => {
          const playerKey = playerSnap.key;
          const playerData = playerSnap.val();
          if (playerData.lastActive && now - new Date(playerData.lastActive)
              .getTime() > FIVE_MINUTES) {
            updates[`/games/${gameKey}/players/${playerKey}`] = null;
          }
        });
      });

      await db.ref().update(updates);
      return null;
    });

// Function to delete lobbies without a host
exports.removeEmptyLobbies = functions.pubsub.schedule("every 5 minutes")
    .onRun(async (context) => {
      const gamesRef = db.ref("games");
      const snapshot = await gamesRef.once("value");
      const updates = {};

      snapshot.forEach((gameSnap) => {
        const gameKey = gameSnap.key;
        const gameData = gameSnap.val();
        const playersRef = gameSnap.child("players");
        let hostExists = false;

        playersRef.forEach((playerSnap) => {
          const playerKey = playerSnap.key;
          if (playerKey === gameData.host) {
            hostExists = true;
          }
        });

        if (!hostExists) {
          updates[`/games/${gameKey}`] = null;
        }
      });

      await db.ref().update(updates);
      return null;
    });

// Function to update game status if endTime has passed
exports.updateGameStatus = functions.pubsub.schedule("every 30 minutes")
    .onRun(async (context) => {
      const now = Date.now();
      const gamesRef = db.ref("games");

      const snapshot = await gamesRef.once("value");
      const updates = {};

      snapshot.forEach((gameSnap) => {
        const gameKey = gameSnap.key;
        const gameData = gameSnap.val();
        const endTime = new Date(gameData.endTime).getTime();

        if (endTime && now > endTime) {
          updates[`/games/${gameKey}/status`] = "waiting";
        }
      });

      await db.ref().update(updates);
      return null;
    });
