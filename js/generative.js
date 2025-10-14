// show title animation
// TODO refine this animation
function showTitleAnimation() {
  // TODO use config object for site config and constants
  const websiteTitle = "connections";
  const websitePalette = [
    "#6495ed",
    "#ff4500",
    "#00fa9a",
    "#ffcc00",
    "#ff69b4",
  ];
  const titleAnimationContainer = document.querySelector(
    ".title-animation-container"
  );

  let animationDelay = 0;
  for (const letter of websiteTitle) {
    const letterElement = document.createElement("div");
    letterElement.classList.add("letter", "animate");
    // letterElement.style.color = random(websitePalette);
    letterElement.style.color = "white";
    letterElement.style.animationDelay = `${animationDelay}s`;
    animationDelay += 0.1;

    const letterBackground = document.createElement("div");
    const clonedSvg = document.getElementById("sample-circle").cloneNode(true);
    clonedSvg.style.fill = random(websitePalette);
    // clonedSvg.style.fill = "white";
    letterBackground.appendChild(clonedSvg);
    letterBackground.className = "letter-background";

    letterElement.appendChild(letterBackground);
    letterElement.appendChild(document.createTextNode(letter));
    titleAnimationContainer.appendChild(letterElement);

    setTimeout(() => {
      letterElement.classList.remove("animate");
    }, 10000);

    letterElement.addEventListener("mouseenter", () => {
      letterElement.style.animationDelay = "0s";
      letterElement.classList.add("animate");
      setTimeout(() => {
        letterElement.classList.remove("animate");
      }, 2000);
    });
  }

  const titleLinkHeading = document.querySelector(".title-link-heading");
  titleLinkHeading.style.display = "none";
}

showTitleAnimation();

// generative functions
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
