import { addPlaylistMediaAtIndex } from "./database.js";

// https://daviddalbusco.com/blog/essential-javascript-functions-for-detecting-users-device-characteristics/
const isMobile = () => {
  const isTouchScreen = window.matchMedia("(any-pointer:coarse)").matches;
  const isMouseScreen = window.matchMedia("(any-pointer:fine)").matches;

  return isTouchScreen && !isMouseScreen;
};

const addContentsToSelection = (contents) => {
  const selection = window.getSelection();
  const range = document.createRange();
  selection.removeAllRanges();
  range.selectNodeContents(contents);
  range.collapse(false);
  selection.addRange(range);
};

const onClickEditableElement = (event) => {
  addContentsToSelection(event.target);

  if (!isMobile()) {
    event.target.focus();
  }
};

// sorting functionality
let playlistContentsElement = document.getElementById(
  "playlist-contents-container"
);

const sortableOnEnd = (event) => {
  const itemElement = event.item;
  const id = itemElement.dataset.mediaKey;

  addPlaylistMediaAtIndex(parseInt(id), event.newIndex, event.oldIndex);
};

const sortable = Sortable.create(playlistContentsElement, {
  delay: 80,
  delayOnTouchOnly: true,
  animation: 150,
  onEnd: sortableOnEnd,
});

export { isMobile, addContentsToSelection, onClickEditableElement };
