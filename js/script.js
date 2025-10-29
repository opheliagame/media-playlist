import { isMobile } from "./utils.js";
import * as db from "./database.js";

// clipboard events
function handlePasteEvent(event) {
  if (!event.clipboardData || !event.clipboardData.items) {
    return;
  }
  event.preventDefault();

  for (const item of event.clipboardData.items) {
    // text
    if (item.kind === "string" && item.type === "text/plain") {
      item.getAsString((textContent) => {
        const mediaItem = {
          type: "text",
          content: textContent,
        };

        // text content needs to be processed inside callback
        db.addPlaylistMedia(mediaItem, (id) => {
          addPlaylistItemContent(mediaItem, id);
          setPlayerContent(mediaItem);
        });
      });
    }

    let mediaItem = null;
    // images
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();

      mediaItem = {
        type: "image",
        content: file,
      };
    }

    if (mediaItem != null) {
      db.addPlaylistMedia(mediaItem, (id) => {
        addPlaylistItemContent(mediaItem, id);
        setPlayerContent(mediaItem);
      });
    }
  }
}
function handleDropEvent(event) {
  if (!event.dataTransfer || !event.dataTransfer.files) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  for (const file of event.dataTransfer.files) {
    let mediaItem = null;

    // images
    if (file.type.startsWith("image/")) {
      mediaItem = {
        type: "image",
        content: file,
      };
    }

    if (mediaItem != null) {
      db.addPlaylistMedia(mediaItem, (id) => {
        addPlaylistItemContent(mediaItem, id);
        setPlayerContent(mediaItem);
      });
    }
  }
}

const mediaInputElement = document.getElementById("media-input");
mediaInputElement.addEventListener("paste", handlePasteEvent);

window.addEventListener("paste", handlePasteEvent);
window.addEventListener("dragover", (event) => {
  event.preventDefault(); // Prevent default to allow drop
  event.dataTransfer.dropEffect = "copy";
});
window.addEventListener("dragenter", (event) => {
  event.preventDefault(); // Prevent default to allow drop
  event.dataTransfer.dropEffect = "copy";
});
window.addEventListener("drop", handleDropEvent);

const addEmptyTextItemButton = document.getElementById(
  "add-empty-text-item-button"
);
addEmptyTextItemButton.addEventListener("click", () => {
  const mediaItem = {
    type: "text",
    content: "",
  };
  db.addPlaylistMedia(mediaItem, (id) => {
    addPlaylistItemContent(mediaItem, id);
    setPlayerContent(mediaItem);
    const playlistItem = document.querySelector(
      `.playlist-item[data-media-key="${id}"]`
    );
    if (playlistItem) {
      playlistItem.click();
    }
  });
});

// common functionality
function _createDOMFromDatabaseItem(mediaItem, id) {
  let innerElement;
  // TODO: add support for audio and video
  // TODO: convert media type to a constant / enum
  if (mediaItem.type === "text") {
    innerElement = document.createElement("p");
    innerElement.textContent = mediaItem.content;
  } else if (mediaItem.type === "image") {
    const file = mediaItem.content;
    const objecturl = URL.createObjectURL(file);
    innerElement = document.createElement("img");
    innerElement.src = objecturl;
    innerElement.alt = file.name;
  }

  let outerDivElement = document.createElement("div");
  outerDivElement.dataset.mediaKey = id || mediaItem.id;
  outerDivElement.dataset.mediaType = mediaItem.type;
  outerDivElement.appendChild(innerElement);

  return outerDivElement;
}

// playlist functionality
let playlistContentsElement = document.getElementById(
  "playlist-contents-container"
);

function showPlaylistContents(mediaItems) {
  // clear the playlist contents container
  playlistContentsElement.innerHTML = "";

  // sort media items by their order in the player
  mediaItems.sort((a, b) => {
    const aIndex = window.playerOrder.indexOf(a.id);
    const bIndex = window.playerOrder.indexOf(b.id);
    return aIndex - bIndex;
  });

  // create elements for each media item and append to the container
  for (const mediaItem of mediaItems) {
    addPlaylistItemContent(mediaItem, mediaItem.id);
  }
}

function addPlaylistItemContent(mediaItem, id) {
  let outerDivElement = _createDOMFromDatabaseItem(mediaItem, id);
  outerDivElement.classList.add("playlist-item");
  // item onclick event
  outerDivElement.addEventListener("click", (event) => {
    stopMedia();
    scrollToPlaylistItem(outerDivElement.dataset.mediaKey);
    setPlayerContent(mediaItem);
    setDetailsItemContent(mediaItem, id);
    unselectAllPlaylistItems();
    outerDivElement.classList.add("selected");
  });

  // item remove button
  let removeButton = document.createElement("div");
  removeButton.id = "remove-button";
  let sampleRemoveButton = document.querySelector("#sample-remove-button");
  removeButton.appendChild(sampleRemoveButton.cloneNode(true));
  outerDivElement.appendChild(removeButton);

  removeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    db.deletePlaylistMedia(outerDivElement.dataset.mediaKey);
    db.reloadContent();
  });

  playlistContentsElement.appendChild(outerDivElement);
  scrollToPlaylistItem(outerDivElement.dataset.mediaKey);
}

function scrollToPlaylistItem(id) {
  const playlistItem = document.querySelector(
    `.playlist-item[data-media-key="${id}"]`
  );
  if (playlistItem) {
    playlistItem.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }
}

function updatePlaylistItemTextContent(id, newTextContent) {
  const playlistItem = document.querySelector(
    `.playlist-item[data-media-key="${id}"]`
  );
  if (playlistItem) {
    const textElement = playlistItem.querySelector("p");
    if (textElement) {
      textElement.textContent = newTextContent;
    }
  }
}

function unselectAllPlaylistItems() {
  const selectedItems = document.querySelectorAll(".playlist-item.selected");
  selectedItems.forEach((item) => {
    item.classList.remove("selected");
  });
}
function unmarkAllPlaylistItems() {
  const playingItems = document.querySelectorAll(".playlist-item.playing");
  playingItems.forEach((item) => {
    item.classList.remove("playing");
  });
}

// details functionality
function setDetailsItemContent(mediaItem, id) {
  const detailsContainer = document.getElementById("details-container");
  detailsContainer.innerHTML = "";
  detailsContainer.dataset.mediaType = mediaItem.type;

  let outerDivElement = _createDOMFromDatabaseItem(mediaItem, id);
  outerDivElement.classList.add("details-item");
  detailsContainer.appendChild(outerDivElement);

  // event listener for input
  if (mediaItem.type === "text") {
    outerDivElement.contentEditable = true;
    if (mediaItem.content.length == 0) {
      outerDivElement.classList.add("empty");
    }

    // focus contenteditable element and place cursor at the end
    if (mediaItem.content.length > 0) {
      const selection = window.getSelection();
      const range = document.createRange();
      selection.removeAllRanges();
      range.selectNodeContents(outerDivElement);
      range.collapse(false);
      selection.addRange(range);
      outerDivElement.focus();
    } else {
      outerDivElement.focus();
    }

    outerDivElement.addEventListener("input", (event) => {
      const newContent = event.target.textContent;
      if (newContent.length === 0) {
        outerDivElement.classList.add("empty");
      } else {
        outerDivElement.classList.remove("empty");
      }
      const newMediaItem = {
        type: "text",
        content: newContent,
      };
      db.updatePlaylistMedia(outerDivElement.dataset.mediaKey, newMediaItem);
      updatePlaylistItemTextContent(
        outerDivElement.dataset.mediaKey,
        newContent
      );
      updatePlayerTextContent(newContent);
    });
  }
}

// player functionality
let currentMediaItemKey = null;
let currentPlayerOrderIndex = 0;
let playSetIntervalId = null;
let showPlayerControlsSetTimeoutId = null;
const playerPlayButton = document.getElementById("player-play-button");
const playerResetButton = document.getElementById("player-reset-button");
const playerControlsContainer = document.getElementById(
  "player-controls-container"
);
const playerContentsContainer = document.getElementById(
  "player-contents-container"
);
// TODO add event listener for space key to play/pause
playerContentsContainer.addEventListener("mouseenter", () => {
  clearInterval(showPlayerControlsSetTimeoutId);
  showPlayerControlsSetTimeoutId = setTimeout(() => {
    playerControlsContainer.style.display = "none";
  }, 2000);
});
playerContentsContainer.addEventListener("mousemove", (event) => {
  playerControlsContainer.style.display = "flex";
});

function setPlayerContent(mediaItem) {
  playerContentsContainer.innerHTML = ""; // Clear previous content

  if (mediaItem.type === "text") {
    const textElement = document.createElement("p");
    textElement.textContent = mediaItem.content;
    playerContentsContainer.appendChild(textElement);
  } else if (mediaItem.type === "image") {
    const file = mediaItem.content;
    const objecturl = URL.createObjectURL(file);
    const imageElement = document.createElement("img");
    imageElement.src = objecturl;
    imageElement.alt = file.name;
    playerContentsContainer.appendChild(imageElement);
  }
}

function updatePlayerTextContent(newTextContent) {
  const textElement = playerContentsContainer.querySelector("p");
  if (textElement) {
    textElement.textContent = newTextContent;
  }
}

function playMedia() {
  unselectAllPlaylistItems();
  playerPlayButton.style.display = "none";
  playerResetButton.style.display = "block";

  db.getPlayerOrder((playerOrder) => {
    window.playerOrder = playerOrder;
    db.getPlaylist((mediaItems) => {
      window.playlistData = mediaItems;
      const playlistStore = window.playlistData;

      if (playlistStore.length === 0) {
        console.warn("No media items in the playlist to play.");
        return;
      }

      currentMediaItemKey = window.playerOrder[currentPlayerOrderIndex];

      playSetIntervalId = setInterval(() => {
        currentPlayerOrderIndex =
          (currentPlayerOrderIndex + 1) % window.playerOrder.length;
        currentMediaItemKey = window.playerOrder[currentPlayerOrderIndex];
        const nextItem = playlistStore.find(
          (item) => item.id === currentMediaItemKey
        );
        setPlayerContent(nextItem);

        const currentPlaylistItem = document.querySelector(
          `.playlist-item[data-media-key="${currentMediaItemKey}"]`
        );
        if (currentPlaylistItem) {
          unmarkAllPlaylistItems();
          if (!isMobile()) {
            scrollToPlaylistItem(currentMediaItemKey);
          }
          currentPlaylistItem.classList.add("playing");
        }
      }, 1000);
    });
  });
}

function stopMedia() {
  if (playSetIntervalId) {
    clearInterval(playSetIntervalId);
    playSetIntervalId = null;
    playerControlsContainer.style.display = "flex";
    playerPlayButton.style.display = "block";
    playerResetButton.style.display = "none";
  }
}

function resetMedia() {
  stopMedia();
  currentPlayerOrderIndex = 0;
  currentMediaItemKey = window.playerOrder[0];
  const playlistStore = window.playlistData;
  if (playlistStore.length > 0) {
    const firstItem = playlistStore.find(
      (item) => item.id === currentMediaItemKey
    );
    setPlayerContent(firstItem);
  } else {
    const playerContentsContainer = document.getElementById(
      "player-contents-container"
    );
    playerContentsContainer.innerHTML =
      "<p>No media items in the playlist.</p>";
  }
}

playerContentsContainer.addEventListener("click", (event) => {
  if (playSetIntervalId) {
    stopMedia();
  } else {
    playMedia();
  }
});
playerPlayButton.addEventListener("click", () => {
  if (playSetIntervalId) {
    stopMedia();
  } else {
    playMedia();
  }
});
playerResetButton.addEventListener("click", () => {
  resetMedia();
});

// connections functionality
const connectionsListContainer = document.getElementById(
  "connections-list-container"
);
const connectionsListContainerHideButton = document.getElementById(
  "connections-list-container-hide-button"
);

const connectionNameInput = document.getElementById("connection-name-input");
const connectionsListElement = document.getElementById("connections-list");
const loadConnectionsButton = document.getElementById(
  "load-connections-button"
);
const saveConnectionButton = document.getElementById("save-connection-button");
const deleteConnectionButton = document.getElementById(
  "delete-connection-button"
);

loadConnectionsButton.addEventListener("click", () => {
  db.getConnections((connections) => {
    connectionsListContainer.classList.add("visible");

    connectionsListElement.innerHTML = ""; // Clear previous connections
    connections.forEach((connection) => {
      const connectionItem = document.createElement("li");
      connectionItem.textContent = connection.name;
      connectionItem.dataset.connectionKey = connection.id;

      connectionItem.addEventListener("click", () => {
        getConnection(connection.id, (connection) => {
          connectionsListContainer.classList.remove("visible");
          db.reloadContent();
        });
      });

      connectionsListElement.appendChild(connectionItem);
    });

    const newConnectionItem = document.createElement("li");
    newConnectionItem.textContent = "Add New Connection";
    newConnectionItem.addEventListener("click", () => {
      db.loadEmptyConnection(() => {
        connectionsListContainer.classList.remove("visible");
        db.reloadContent();
      });
    });
    connectionsListElement.appendChild(newConnectionItem);
  });
});

connectionsListContainerHideButton.addEventListener("click", () => {
  connectionsListContainer.classList.remove("visible");
});

saveConnectionButton.addEventListener("click", () => {
  const connectionName = connectionNameInput.textContent.trim();
  db.saveConnection(connectionName, (connectionKey) => {
    console.log("Connection saved with key:", connectionKey);
  });
});

deleteConnectionButton.addEventListener("click", () => {
  db.deleteCurrentConnection();
});

function setConnectionContent(connectionName) {
  connectionNameInput.textContent = connectionName || "connection name here";
}

export { showPlaylistContents, setPlayerContent, setConnectionContent };
