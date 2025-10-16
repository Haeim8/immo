import { rmSync } from "fs";
import { spawnSync } from "child_process";

try {
  rmSync("dist-anchor-tests", { recursive: true, force: true });
} catch (error) {
  console.warn("Warning: unable to clean dist-anchor-tests directory", error);
}

const result = spawnSync("yarn", ["pnpify", "tsc", "-p", "tsconfig.anchor-tests.json"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
