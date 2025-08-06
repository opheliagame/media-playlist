// This script manages dark mode functionality for the application.
console.log("Darkmode script loaded");

const userPref = window.matchMedia("(prefers-color-scheme: light)").matches
  ? "light"
  : "dark";
const currentTheme = localStorage.getItem("theme") ?? userPref;
document.documentElement.setAttribute("saved-theme", currentTheme);

const emitThemeChangeEvent = (theme) => {
  const event = new CustomEvent("themechange", {
    detail: { theme },
  });
  document.dispatchEvent(event);
};

const switchTheme = (e) => {
  const newTheme = e.target.checked ? "dark" : "light";
  document.documentElement.setAttribute("saved-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  emitThemeChangeEvent(newTheme);
};

const themeChange = (e) => {
  const newTheme = e.matches ? "dark" : "light";
  document.documentElement.setAttribute("saved-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  toggleSwitch.checked = e.matches;
  emitThemeChangeEvent(newTheme);
};

// Darkmode toggle
const toggleSwitch = document.querySelector("#darkmode-toggle");
toggleSwitch.addEventListener("change", switchTheme);
if (currentTheme === "dark") {
  toggleSwitch.checked = true;
}

// Listen for changes in prefers-color-scheme
const colorSchemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
colorSchemeMediaQuery.addEventListener("change", themeChange);
