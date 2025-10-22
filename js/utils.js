const isMobile = () => {
  const isTouchScreen = window.matchMedia("(any-pointer:coarse)").matches;
  const isMouseScreen = window.matchMedia("(any-pointer:fine)").matches;

  return isTouchScreen && !isMouseScreen;
};
