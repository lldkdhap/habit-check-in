import { execFileSync } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(
  "dist",
  "habit-tracker-station",
  "habit-tracker-station-win_x64.exe",
);
const releaseDir = resolve("release");
const coreDestination = resolve(releaseDir, "习惯打卡站-core.exe");
const launcherDestination = resolve(releaseDir, "习惯打卡站.exe");
const launcherSource = resolve("scripts", "launcher.cs");

await mkdir(releaseDir, { recursive: true });
await copyFile(source, coreDestination);

const cscCandidates = [
  String.raw`C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`,
  String.raw`C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe`,
];
const csc = cscCandidates.find((candidate) => existsSync(candidate));
if (!csc) {
  throw new Error("Unable to find the .NET Framework C# compiler (csc.exe).");
}

execFileSync(
  csc,
  [
    "/nologo",
    "/target:winexe",
    "/optimize+",
    `/out:${launcherDestination}`,
    launcherSource,
  ],
  { stdio: "inherit" },
);

console.log(`Windows launcher: ${launcherDestination}`);
console.log(`Windows core:     ${coreDestination}`);
