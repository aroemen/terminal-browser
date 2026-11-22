import type { Detect } from "../terminal";

interface HerdrLayout {
  spaces: {
    tabs: {
      id: string;
      terminals: { terminal: string; pane: string }[];
    }[];
  }[];
}

export const herdrCore: Detect = (env, run) => {
  if (!env.HC_TERMINAL_ID) return null;

  return {
    name: "herdr-core",
    async getCurrentPane() {
      const layout: HerdrLayout = JSON.parse(await run("herdr-app", ["ls"]));
      for (const space of layout.spaces) {
        for (const tab of space.tabs) {
          const terminal = tab.terminals.find((terminal) => terminal.terminal === env.HC_TERMINAL_ID);
          if (terminal) return { id: terminal.pane, tab: tab.id };
        }
      }
      return null;
    },
  };
};
