import { _createDOMFromDatabaseItem } from "./common.js";
import { isMobile } from "./utils.js";
import { stopMedia, setPlayerContent } from "./player.js";
import { setDetailsItemContent } from "./details.js";
import * as db from "./database.js";

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
    if (!isMobile()) {
      scrollToPlaylistItem(outerDivElement.dataset.mediaKey);
    }

    db.getPlaylistMedia(id, (currentMediaItem) => {
      setPlayerContent(currentMediaItem);
      setDetailsItemContent(currentMediaItem, id);
    });

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
  if (!isMobile()) {
    scrollToPlaylistItem(outerDivElement.dataset.mediaKey);
  }
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

export {
  showPlaylistContents,
  addPlaylistItemContent,
  scrollToPlaylistItem,
  updatePlaylistItemTextContent,
  unselectAllPlaylistItems,
  unmarkAllPlaylistItems,
};
