const assert = require("node:assert/strict");
const { test } = require("node:test");
const { detect } = require("../dist/terminal/index.js");

const env = { HC_TERMINAL_ID: "t7", TERM_PROGRAM: "ghostty" };
const context = { tty: null, cwd: "/" };

function layout(terminal = "t7", pane = "p7", tab = "tab7") {
  return JSON.stringify({
    spaces: [{ tabs: [
      { id: "other-tab", terminals: [{ terminal: "t8", pane: "p8" }] },
      { id: tab, terminals: [{ terminal, pane }] },
    ] }],
  });
}

test("herdr-core identity wins over inherited Ghostty and maps to the app pane", async () => {
  const commands = [];
  const terminal = detect(env, async (bin, args) => {
    commands.push([bin, ...args]);
    return layout();
  });
  assert.equal(terminal?.name, "herdr-core");
  assert.deepEqual(await terminal.getCurrentPane(context), { id: "p7", tab: "tab7" });
  assert.deepEqual(commands, [["herdr-app", "ls"]]);
});

test("herdr-core does not select another terminal when its own is not in the app", async () => {
  const terminal = detect(env, async () => layout("t9"));
  assert.equal(await terminal.getCurrentPane(context), null);
});

test("herdr-core resolves the current layout again after a terminal moves", async () => {
  let current = layout();
  const terminal = detect(env, async () => current);
  assert.deepEqual(await terminal.getCurrentPane(context), { id: "p7", tab: "tab7" });
  current = layout("t7", "new-pane", "new-tab");
  assert.deepEqual(await terminal.getCurrentPane(context), { id: "new-pane", tab: "new-tab" });
});

test("herdr-core reports app lookup failures instead of selecting another backend", async () => {
  const terminal = detect(env, async () => { throw new Error("app unavailable"); });
  await assert.rejects(terminal.getCurrentPane(context), /app unavailable/);
});
