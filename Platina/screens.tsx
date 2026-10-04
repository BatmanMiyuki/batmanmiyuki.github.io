import type { FC } from "react";
import type { ScreenId } from "./data";
import { GamepadTabIcon, PlayTabIcon, SettingsTabIcon, StatsTabIcon } from "./icons";
import StatsScreen from "../screens/StatsScreen";
import GamesScreen from "../screens/GamesScreen";
import PlayScreen from "../screens/PlayScreen";
import SettingsScreen from "../screens/SettingsScreen";

export const SCREENS: Record<ScreenId, FC> = {
  stats: StatsScreen,
  games: GamesScreen,
  play: PlayScreen,
  settings: SettingsScreen,
};

export const TABS: { id: ScreenId; label: string; Icon: typeof StatsTabIcon }[] = [
  { id: "stats", label: "Stats", Icon: StatsTabIcon },
  { id: "games", label: "Jeux", Icon: GamepadTabIcon },
  { id: "play", label: "Play", Icon: PlayTabIcon },
  { id: "settings", label: "Paramètres", Icon: SettingsTabIcon },
];
