import { spawn } from "node:child_process";

const url = "http://localhost:5173";
console.log(`[demo:hub] starting hub dev server`);
console.log(`[demo:hub] open ${url}`);

const child = spawn("npm", ["run", "dev:hub"], {
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
