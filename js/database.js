// indexedDB functionality
function getMediaFromPlaylistStore(onload) {
  db.transaction("playlist").objectStore("playlist").getAll().onsuccess = (
    event
  ) => {
    console.log("All media items in playlist:", event.target.result);
    onload(event.target.result);
  };
}

function addMediaToDatabase(mediaItem, oncomplete) {
  _addMediaToPlaylistStore(mediaItem, (mediaKey) => {
    _addMediaToPlaylistEnd(mediaKey);
    oncomplete?.(mediaKey);
  });
}

function updateMediaInDatabase(mediaKey, mediaItem) {
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

function _addMediaToPlaylistStore(mediaItem, oncomplete) {
  const transaction = db.transaction(["playlist"], "readwrite");
  transaction.oncomplete = () => {};

  const objectStore = transaction.objectStore("playlist");
  const request = objectStore.add(mediaItem);
  request.onsuccess = (event) => {
    const itemKey = event.target.result;
    oncomplete?.(itemKey);
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

function _addMediaToPlaylistEnd(mediaKey) {
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

function addMediaToPlaylistAtIndex(mediaKey, newIndex, oldIndex) {
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

function removeMediaFromDatabase(mediaKey) {
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

// SCHEMA, version 1
// [
//   { type: "text", content: "some text" },
//   { type: "image", content: objectURL },
// ]

function reloadContent() {
  getPlayerOrder((playerOrder) => {
    window.playerOrder = playerOrder;
  });
  getMediaFromPlaylistStore((mediaItems) => {
    window.showPlaylistContents(mediaItems);
    window.setPlayerContent(mediaItems[0] || {});
    window.playlistData = mediaItems;
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

  db.createObjectStore("playlist", {
    autoIncrement: true,
    keyPath: "id",
  });
  db.createObjectStore("player");
};

request.onsuccess = (event) => {
  db = event.target.result;
  db.onerror = (event) => {
    // Generic error handler for all errors targeted at this database's
    // requests!
    console.error(`Database error: ${event.target.error?.message}`);
  };
  window.db = db; // Expose db to the global scope

  reloadContent();
  console.log("Playlist data initialized:", window.playlistData);
  console.log("Player order initialized:", window.playerOrder);
  window.reloadContent = reloadContent;
  window.getMediaFromPlaylistStore = getMediaFromPlaylistStore;
  window.addMediaToDatabase = addMediaToDatabase;
  window.addMediaToPlaylistAtIndex = addMediaToPlaylistAtIndex;
  window.updateMediaInDatabase = updateMediaInDatabase;
  window.removeMediaFromDatabase = removeMediaFromDatabase;
};
