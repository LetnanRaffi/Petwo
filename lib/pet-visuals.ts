export function petEmoji(petType?: string | null) {
  switch (petType) {
    case "dog":
      return "🐶";
    case "bunny":
      return "🐰";
    case "bear":
      return "🐻";
    default:
      return "🐱";
  }
}
