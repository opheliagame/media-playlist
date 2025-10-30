import {
  unselectAllPlaylistItems,
  unmarkAllPlaylistItems,
  scrollToPlaylistItem,
} from "./playlist.js";
import * as db from "./database.js";
import { isMobile } from "./utils.js";

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

function playMediaAtIndex(index) {
  const playlistStore = window.playlistData;
  currentMediaItemKey = window.playerOrder[index];

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

  let progress =
    (index /
      (window.playerOrder.length > 1 ? window.playerOrder.length - 1 : 1)) *
    100;
  if (progress == 0) {
    progress = 0.01;
  }
  let progressElement = document.getElementById("player-progress-element");
  progressElement.style.width = `${progress}%`;
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
        playMediaAtIndex(currentPlayerOrderIndex);
      }, 1000);
    });
  });
}

function stepMedia() {
  currentPlayerOrderIndex =
    (currentPlayerOrderIndex + 1) % window.playerOrder.length;
  playMediaAtIndex(currentPlayerOrderIndex);
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
  if (manualMode) {
    playerPlayButton.style.display = "none";
    playerResetButton.style.display = "none";
    stepMedia();
  } else {
    if (playSetIntervalId) {
      stopMedia();
    } else {
      playMedia();
    }
  }
});
playerPlayButton.addEventListener("click", () => {
  if (manualMode) {
    playerPlayButton.style.display = "none";
    playerResetButton.style.display = "none";
    stepMedia();
  } else {
    if (playSetIntervalId) {
      stopMedia();
    } else {
      playMedia();
    }
  }
});
playerResetButton.addEventListener("click", () => {
  resetMedia();
});

let manualMode = false;
let manualModeButton = document.getElementById("manual-mode-button");
manualModeButton.addEventListener("click", (event) => {
  manualMode = !manualMode;
  if (manualMode) {
    manualModeButton.classList.remove("off");
    manualModeButton.classList.add("on");
  } else {
    manualModeButton.classList.add("off");
    manualModeButton.classList.remove("on");
  }
});

export {
  setPlayerContent,
  updatePlayerTextContent,
  playMedia,
  stepMedia,
  stopMedia,
  resetMedia,
};
