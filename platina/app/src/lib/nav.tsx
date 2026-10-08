import { createContext, useContext } from "react";
import type { ScreenId } from "./data";

export const NavCtx = createContext<{ tab: ScreenId; setTab: (t: ScreenId) => void }>({
  tab: "stats",
  setTab: () => {},
});

export const useNav = () => useContext(NavCtx);
