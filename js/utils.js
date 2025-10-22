// https://daviddalbusco.com/blog/essential-javascript-functions-for-detecting-users-device-characteristics/
const isMobile = () => {
  const isTouchScreen = window.matchMedia("(any-pointer:coarse)").matches;
  const isMouseScreen = window.matchMedia("(any-pointer:fine)").matches;

  return isTouchScreen && !isMouseScreen;
};

// sorting functionality
const playlistContentsElement = document.getElementById(
  "playlist-contents-container"
);

const sortableOnEnd = (event) => {
  const itemElement = event.item;
  const id = itemElement.dataset.mediaKey;

  window.addPlaylistMediaAtIndex(parseInt(id), event.newIndex, event.oldIndex);
};

const sortable = isMobile()
  ? Sortable.create(playlistContentsElement, {
      handle: ".drag-handle",
      animation: 150,
      onEnd: sortableOnEnd,
    })
  : Sortable.create(playlistContentsElement, {
      animation: 150,
      onEnd: sortableOnEnd,
    });
