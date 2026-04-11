import { Text, TextInput } from "react-native";

export const FONT_LOAD_TIMEOUT_MS = 10000;

export function applyDefaultFont() {
  const defaultStyle = { fontFamily: "Inter_400Regular" };
  // @ts-expect-error - defaultProps exists at runtime
  Text.defaultProps = Text.defaultProps || {};
  // @ts-expect-error
  Text.defaultProps.style = [defaultStyle, Text.defaultProps.style];
  // @ts-expect-error
  TextInput.defaultProps = TextInput.defaultProps || {};
  // @ts-expect-error
  TextInput.defaultProps.style = [defaultStyle, TextInput.defaultProps.style];
}

export const WARMUP_SOURCE = require("../assets/videos/tiny.mp4");

export const WARMUP_STYLE = {
  position: "absolute" as const,
  width: 1,
  height: 1,
  opacity: 0,
};
