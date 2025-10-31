import * as db from "./database.js";
import { addPlaylistItemContent, setPlayerContent } from "./playlist.js";

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
