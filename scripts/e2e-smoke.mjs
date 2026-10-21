#!/usr/bin/env node
/**
 * End-to-end smoke test.
 *
 * Boots the app on a throwaway port, drives it with headless Chromium and
 * checks that the dashboard renders, that a checklist tick persists, and that
 * saving a value updates the page without a reload.
 *
 * Everything happens in a far-future month so real entries are never touched.
 *
 *   node scripts/e2e-smoke.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import puppeteer from "puppeteer-core";

const PORT = Number(process.env.SMOKE_PORT ?? 3123);
const BASE = `http://localhost:${PORT}`;
const MONTH = "2031-07";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/chromium";

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForServer(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.status < 500) return true;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  const server = spawn(
    "npx",
    ["next", "dev", "-p", String(PORT)],
    {
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      env: { ...process.env, NEXT_DIST_DIR: ".next-smoke" },
    }
  );
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  const stopServer = () => {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  };

  let browser;
  try {
    const up = await waitForServer(`${BASE}/?month=${MONTH}`);
    if (!up) throw new Error(`dev server did not start:\n${serverLog}`);
    check("dev server starts", true, `port ${PORT}`);

    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: "new",
      args: ["--no-sandbox"],
      defaultViewport: { width: 1280, height: 1400 },
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // --- dashboard renders -------------------------------------------------
    const response = await page.goto(`${BASE}/?month=${MONTH}`, {
      waitUntil: "networkidle0",
    });
    check("dashboard responds 200", response.status() === 200, `status ${response.status()}`);

    const sections = await page.evaluate(() =>
      [...document.querySelectorAll("section h2")].map((h) => h.textContent.trim())
    );
    check(
      "dashboard shows every habit section",
      sections.includes("Sleep") && sections.includes("Weight"),
      sections.join(", ")
    );

    const checklistRows = await page.evaluate(
      () => document.querySelectorAll("table tbody tr").length
    );
    check(
      "checklist renders a row per day",
      checklistRows === 31,
      `${checklistRows} rows for July`
    );

    // --- checklist tick persists ------------------------------------------
    const tickCell = (dayIndex) =>
      page.evaluate((index) => {
        const row = document.querySelectorAll("table tbody tr")[index];
        row.querySelectorAll("button")[0].click();
      }, dayIndex);

    const cellPressed = (dayIndex) =>
      page.evaluate((index) => {
        const row = document.querySelectorAll("table tbody tr")[index];
        return row.querySelectorAll("button")[0].getAttribute("aria-pressed");
      }, dayIndex);

    await tickCell(0);
    await sleep(1200);
    check("checklist cell toggles on", (await cellPressed(0)) === "true");

    await page.reload({ waitUntil: "networkidle0" });
    check(
      "checklist tick persists across reload",
      (await cellPressed(0)) === "true"
    );

    await tickCell(0);
    await sleep(1200);
    check(
      "checklist cell toggles back off",
      (await cellPressed(0)) === "false"
    );

    // --- saving a value updates the page live -----------------------------
    const tilesBefore = await page.evaluate(() => {
      const section = [...document.querySelectorAll("section")].find(
        (s) => s.querySelector("h2")?.textContent.trim() === "Sleep"
      );
      return [...section.querySelectorAll("p")].map((p) => p.textContent.trim()).join("|");
    });

    await page.evaluate(() => {
      const section = [...document.querySelectorAll("section")].find(
        (s) => s.querySelector("h2")?.textContent.trim() === "Sleep"
      );
      [...section.querySelectorAll("button")]
        .find((b) => b.textContent.trim() === "2")
        .click();
    });
    await page.waitForSelector("input[name=value_hours]", { timeout: 10_000 });
    await page.evaluate(() => {
      const input = document.querySelector("input[name=value_hours]");
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      setter.call(input, "6.5");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click("form button[type=submit]");
    await sleep(2500);

    const tilesAfter = await page.evaluate(() => {
      const section = [...document.querySelectorAll("section")].find(
        (s) => s.querySelector("h2")?.textContent.trim() === "Sleep"
      );
      return [...section.querySelectorAll("p")].map((p) => p.textContent.trim()).join("|");
    });
    check(
      "saving a value refreshes the dashboard without a reload",
      tilesBefore !== tilesAfter,
      tilesBefore === tilesAfter ? "tiles unchanged" : "tiles updated"
    );

    const listedValue = await page.evaluate(() => {
      const row = document.querySelectorAll("table tbody tr")[1];
      return row
        .querySelector("td:nth-child(2) span.truncate")
        ?.textContent?.trim();
    });
    check(
      "checklist shows the logged value",
      listedValue === "6.5",
      `cell shows "${listedValue}"`
    );

    // --- delete the entry we created --------------------------------------
    await page.evaluate(() => {
      const section = [...document.querySelectorAll("section")].find(
        (s) => s.querySelector("h2")?.textContent.trim() === "Sleep"
      );
      [...section.querySelectorAll("button")]
        .find((b) => b.textContent.trim() === "2")
        .click();
    });
    await page.waitForSelector("form button[data-action=delete]", {
      timeout: 10_000,
    });
    await page.click("form button[data-action=delete]");
    await sleep(2000);

    const deleted = await page.evaluate(() => {
      const section = [...document.querySelectorAll("section")].find(
        (s) => s.querySelector("h2")?.textContent.trim() === "Sleep"
      );
      const tiles = [...section.querySelectorAll("p")].map((p) => p.textContent.trim());
      return tiles.join("|");
    });
    check("deleting an entry updates the dashboard", deleted === tilesBefore);

    check("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));

    await page.screenshot({
      path: "/tmp/opencode/e2e-smoke.png",
      fullPage: true,
    });
  } finally {
    if (browser) await browser.close();
    stopServer();
  }

  const failed = results.filter((r) => !r.passed);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`
  );
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error("SMOKE TEST ERROR:", error.message);
  process.exit(1);
});
