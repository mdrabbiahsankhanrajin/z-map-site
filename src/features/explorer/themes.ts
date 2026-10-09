export const themes = {
  atlas: { label: "Atlas", ocean: "#68afb2", land: "#eee7cf", line: "#456e5a", selected: "#137568", visited: "#e9a15e" },
  dusk: { label: "Dusk", ocean: "#d8d6cf", land: "#ece9df", line: "#817f75", selected: "#5d6658", visited: "#b3b59a" },
  terrain: { label: "Terrain", ocean: "#a3d6ce", land: "#e9ead6", line: "#587f66", selected: "#1b796a", visited: "#f1b769" },
  ink: { label: "Ink", ocean: "#e5e4df", land: "#f7f6f1", line: "#788886", selected: "#273d41", visited: "#adbdb8" },
  coastal: { label: "Coastal", ocean: "#80c5d4", land: "#f5f0df", line: "#548b89", selected: "#127387", visited: "#f1b976" },
} as const;

export type ThemeId = keyof typeof themes;
