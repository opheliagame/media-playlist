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

export { _createDOMFromDatabaseItem };
