import {
  setConnectionContent,
  setPlayerContent,
  showPlaylistContents,
} from "./script.js";

// indexedDB functionality
function getConnections(onload) {
  db.transaction("connections").objectStore("connections").getAll().onsuccess =
    (event) => {
      console.log("All connections:", event.target.result);
      onload(event.target.result);
    };
}

function getConnection(connectionKey, onload) {
  _getConnectionTrn(connectionKey, (connection) => {
    _setPlaylist(connection.mediaItems);
    _setPlayerOrder(connection.playerOrder);
    saveWorkspaceConnectionKey(connectionKey);
    saveWorkspaceConnectionName(connection.name);

    onload?.(connection);
  });
}

function loadEmptyConnection(onload) {
  _setPlaylist([]);
  _setPlayerOrder([]);
  resetWorkspaceConnectionKey();
  resetWorkspaceConnectionName();
  onload?.();
}

function _getConnectionTrn(connectionKey, onload) {
  db
    .transaction(["connections"])
    .objectStore("connections")
    .get(connectionKey).onsuccess = (event) => {
    const connection = event.target.result;
    onload(connection);
  };
}

function _setPlayerOrder(playerOrder) {
  db.transaction(["player"], "readwrite")
    .objectStore("player")
    .put(playerOrder, "player-order");
}

function _setPlaylist(mediaItems) {
  const transaction = db.transaction(["playlist"], "readwrite");
  const objectStore = transaction.objectStore("playlist");

  // Clear existing items
  objectStore.clear();

  mediaItems.forEach((mediaItem) => {
    const request = objectStore.add(mediaItem);
    request.onsuccess = (event) => {
      console.log("Media item added:", event.target.result);
    };
  });
}

function saveConnection(name, oncomplete) {
  getPlaylist((mediaItems) => {
    getPlayerOrder((playerOrder) => {
      const connection = {
        name: name,
        mediaItems: mediaItems,
        playerOrder: playerOrder,
      };

      getWorkspaceConnectionKey((connectionKey) => {
        _saveConnectionTrn(connection, connectionKey, (connectionKey) => {
          saveWorkspaceConnectionKey(connectionKey);
          saveWorkspaceConnectionName(name);
          oncomplete?.(connectionKey);
        });
      });
    });
  });
}

function _saveConnectionTrn(connection, connectionKey, oncomplete) {
  const transaction = db.transaction(["connections"], "readwrite");
  const objectStore = transaction.objectStore("connections");

  let request;
  if (connectionKey != null) {
    connection.id = parseInt(connectionKey);
    console.log("Updating connection with key:", connectionKey);
    request = objectStore.put(connection);
  } else {
    request = objectStore.add(connection);
  }

  request.onsuccess = (event) => {
    const itemKey = event.target.result;
    oncomplete?.(itemKey);
  };
}

function deleteCurrentConnection() {
  getWorkspaceConnectionKey((currentConnectionKey) => {
    _deleteConnectionTrn(currentConnectionKey, (deletedKey) => {
      console.log("Deleted connection with key:", deletedKey);
    });
    loadEmptyConnection();
    reloadContent();
  });
}

function _deleteConnectionTrn(connectionKey, oncomplete) {
  const transaction = db.transaction(["connections"], "readwrite");
  const objectStore = transaction.objectStore("connections");
  const request = objectStore.delete(connectionKey);

  request.onsuccess = (event) => {
    console.log("Connection deleted:", event.target.result);
    oncomplete?.(connectionKey);
  };
}

function getWorkspaceConnectionKey(onload) {
  db
    .transaction(["workspace"])
    .objectStore("workspace")
    .get("connection-key").onsuccess = (event) => {
    const connectionKey = event.target.result;
    onload(connectionKey);
  };
}

function saveWorkspaceConnectionKey(connectionKey) {
  const transaction = db.transaction(["workspace"], "readwrite");
  const objectStore = transaction.objectStore("workspace");
  const request = objectStore.put(connectionKey, "connection-key");
  request.onsuccess = (event) => {
    console.log("Workspace connection key saved:", event.target.result);
  };
}

function resetWorkspaceConnectionKey() {
  db.transaction(["workspace"], "readwrite")
    .objectStore("workspace")
    .delete("connection-key");
}

function getWorkspaceConnectionName(onload) {
  db
    .transaction(["workspace"])
    .objectStore("workspace")
    .get("connection-name").onsuccess = (event) => {
    const connectionName = event.target.result || {};
    onload(connectionName);
  };
}

function saveWorkspaceConnectionName(name) {
  const transaction = db.transaction(["workspace"], "readwrite");
  const objectStore = transaction.objectStore("workspace");
  const request = objectStore.put(name, "connection-name");
  request.onsuccess = (event) => {
    console.log("Workspace connection name saved:", event.target.result);
  };
}

function resetWorkspaceConnectionName() {
  db.transaction(["workspace"], "readwrite")
    .objectStore("workspace")
    .put("New Connection", "connection-name");
}

function getPlaylist(onload) {
  db.transaction("playlist").objectStore("playlist").getAll().onsuccess = (
    event
  ) => {
    console.log("All media items in playlist:", event.target.result);
    onload(event.target.result);
  };
}

function getPlaylistMedia(mediaKey, onload) {
  const id = parseInt(mediaKey);
  db.transaction("playlist").objectStore("playlist").get(id).onsuccess = (
    event
  ) => {
    onload(event.target.result);
  };
}

function addPlaylistMedia(mediaItem, oncomplete) {
  _addPlaylistMediaTrn(mediaItem, (mediaKey) => {
    _addPlayerOrderTrn(mediaKey);
    oncomplete?.(mediaKey);
  });
}

function updatePlaylistMedia(mediaKey, mediaItem) {
  const id = parseInt(mediaKey);
  const transaction = db.transaction(["playlist"], "readwrite");
  const objectStore = transaction.objectStore("playlist");
  const request = objectStore.get(id);
  request.onsuccess = (event) => {
    const existingItem = event.target.result;
    if (existingItem) {
      existingItem.type = mediaItem.type;
      existingItem.content = mediaItem.content;
      objectStore.put(existingItem);
    } else {
      console.error(`Media item with key ${mediaKey} not found.`);
    }
  };
}

function getPlayerOrder(onload) {
  const objectStore = db.transaction(["player"]).objectStore("player");
  const request = objectStore.get("player-order");
  request.onsuccess = (event) => {
    const playerOrder = event.target.result || [];
    onload(playerOrder);
  };
}

function addPlaylistMediaAtIndex(mediaKey, newIndex, oldIndex) {
  const objectStore = db
    .transaction(["player"], "readwrite")
    .objectStore("player");
  const request = objectStore.get("player-order");

  request.onsuccess = (event) => {
    const playerOrder = event.target.result || [];
    playerOrder.splice(oldIndex, 1);
    playerOrder.splice(newIndex, 0, mediaKey);

    objectStore.put(playerOrder, "player-order");
  };
}

function deletePlaylistMedia(mediaKey) {
  const id = parseInt(mediaKey);

  const transaction = db.transaction(["playlist", "player"], "readwrite");
  const playlistStore = transaction.objectStore("playlist");
  playlistStore.delete(id);

  const playerStore = transaction.objectStore("player");
  playerStore.get("player-order").onsuccess = (event) => {
    const playerOrder = event.target.result || [];
    const index = playerOrder.indexOf(id);
    if (index > -1) {
      playerOrder.splice(index, 1);
      playerStore.put(playerOrder, "player-order");
    }
  };
}

function _addPlaylistMediaTrn(mediaItem, oncomplete) {
  const transaction = db.transaction(["playlist"], "readwrite");
  transaction.oncomplete = () => {};

  const objectStore = transaction.objectStore("playlist");
  const request = objectStore.add(mediaItem);
  request.onsuccess = (event) => {
    const itemKey = event.target.result;
    oncomplete?.(itemKey);
  };
}

function _addPlayerOrderTrn(mediaKey) {
  const objectStore = db
    .transaction(["player"], "readwrite")
    .objectStore("player");
  const request = objectStore.get("player-order");

  request.onsuccess = (event) => {
    const playerOrder = event.target.result;

    if (!playerOrder) {
      objectStore.add([mediaKey], "player-order");
    } else {
      playerOrder.push(mediaKey);
      objectStore.put(playerOrder, "player-order");
    }
  };
}

// SCHEMA, version 1
// db playlist
// [
//   { type: "text", content: "some text" },
//   { type: "image", content: objectURL },
// ]

function reloadContent() {
  getPlayerOrder((playerOrder) => {
    window.playerOrder = playerOrder;
  });
  getPlaylist((mediaItems) => {
    showPlaylistContents(mediaItems);
    setPlayerContent(mediaItems[0] || {});
    window.playlistData = mediaItems;
  });
  getConnections((connections) => {
    // showConnections(connections);
  });
  getWorkspaceConnectionName((connectionName) => {
    setConnectionContent(connectionName);
  });
}

let db;
const request = indexedDB.open("MediaPlaylistDB", 1);
request.onerror = (event) => {
  console.error("Why didn't you allow my web app to use IndexedDB?!");
};
// This event is only implemented in recent browsers
request.onupgradeneeded = (event) => {
  db = event.target.result;

  db.createObjectStore("connections", {
    autoIncrement: true,
    keyPath: "id",
  });
  db.createObjectStore("playlist", {
    autoIncrement: true,
    keyPath: "id",
  });
  db.createObjectStore("player");
  db.createObjectStore("workspace");
};

request.onsuccess = (event) => {
  db = event.target.result;
  db.onerror = (event) => {
    // Generic error handler for all errors targeted at this database's
    // requests!
    console.error(`Database error: ${event.target.error?.message}`);
  };

  reloadContent();
  console.log("Playlist data initialized:", window.playlistData);
  console.log("Player order initialized:", window.playerOrder);
};

export {
  db,
  reloadContent,
  getConnections,
  getConnection,
  loadEmptyConnection,
  saveConnection,
  deleteCurrentConnection,
  getPlaylist,
  getPlaylistMedia,
  addPlaylistMedia,
  addPlaylistMediaAtIndex,
  updatePlaylistMedia,
  deletePlaylistMedia,
  getPlayerOrder,
};
