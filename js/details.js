import { _createDOMFromDatabaseItem } from "./common.js";
import {
  onClickEditableElement,
  isMobile,
  addContentsToSelection,
} from "./utils.js";
import * as db from "./database.js";
import { updatePlayerTextContent } from "./player.js";
import { updatePlaylistItemTextContent } from "./playlist.js";

function setDetailsItemContent(mediaItem, id) {
  const detailsContainer = document.getElementById("details-container");
  detailsContainer.innerHTML = "";
  detailsContainer.dataset.mediaType = mediaItem.type;

  let outerDivElement = _createDOMFromDatabaseItem(mediaItem, id);
  outerDivElement.classList.add("details-item");
  detailsContainer.appendChild(outerDivElement);

  // event listener for click
  detailsContainer.addEventListener("click", onClickEditableElement);

  // event listener for input
  if (mediaItem.type === "text") {
    outerDivElement.contentEditable = true;
    if (mediaItem.content.length == 0) {
      outerDivElement.classList.add("empty");
    }

    if (!isMobile()) {
      if (mediaItem.content.length > 0) {
        addContentsToSelection(outerDivElement);
        outerDivElement.focus();
      } else {
        outerDivElement.focus();
      }
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

export { setDetailsItemContent };
