// End-to-end smoke test against a running app (default http://localhost:3100) in local-storage mode.
import { chromium } from "playwright";
import assert from "node:assert/strict";
const URL = process.env.APP_URL || "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["geolocation"], geolocation: { latitude: 24.7136, longitude: 46.6753 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && errs.push(m.text()));
const step = (n) => console.log("✓", n);

await p.goto(URL + "/leads");
await p.waitForSelector("text=No leads yet");
step("first run starts empty (no demo records)");
await p.goto(URL + "/settings/#backup");
await p.click("button:has-text('Load demo data')");
await p.waitForSelector("text=Demo data loaded");
await p.goto(URL + "/leads");
await p.waitForSelector("tbody tr");
step("demo data loads on request");

// company types: two main sections + user-defined
await p.goto(URL + "/companies/");
await p.waitForSelector("[role=tab]:has-text('Real Estate Development Companies')");
await p.waitForSelector("[role=tab]:has-text('Design & Execution Companies')");
await p.click("button:has-text('Add company type')");
await p.fill("[role=dialog] input >> nth=0", "Contractors");
await p.click("[role=dialog] button:has-text('Save')");
await p.waitForSelector("[role=tab]:has-text('Contractors')");
await p.click("[role=tab]:has-text('Real Estate Development Companies')");
assert.ok((await p.locator("tbody tr").count()) >= 3);
step("company type sections + add custom type");
await p.goto(URL + "/leads");
await p.waitForSelector("tbody tr");

// potential sites: live location, maps link, contacts with role
await p.goto(URL + "/sites/");
await p.waitForSelector("text=No sites yet");
await p.click("main >> button:has-text('New site')");
await p.fill('[role=dialog] input[placeholder^="e.g. Al Nakheel"]', "Test Mall Unit 12");
await p.click("button:has-text('Use my current location')");
await p.waitForSelector("[role=dialog] input[value*='google.com/maps?q=24.713600']");
await p.selectOption("[role=dialog] select[aria-label='Role']", { label: "Guard" });
await p.fill("[role=dialog] input[aria-label='Name']", "Abu Saad");
await p.fill("[role=dialog] input[aria-label='Phone']", "0551234000");
await p.click("[role=dialog] button:has-text('Save')");
await p.waitForSelector("text=Test Mall Unit 12");
await p.waitForSelector("span.rounded-full:text-is('Guard')");
await p.waitForSelector("a:has-text('Open in Google Maps')");
await p.waitForTimeout(800);
await p.reload();
await p.waitForSelector("text=Abu Saad");
step("potential site with live location, maps link and guard contact (persists)");
await p.goto(URL + "/leads");
await p.waitForSelector("tbody tr");

// create
await p.click("header >> text=New lead");
await p.fill('input[name="companyName"]', "Zaytoon Test Trading");
await p.fill('input[name="contactName"]', "Omar Test");
await p.fill('input[name="phone"]', "0551112223");
await p.fill('input[name="projectName"]', "Zaytoon Flagship");
await p.fill('input[name="value"]', "123456");
await p.click("button:has-text('Save')");
await p.waitForSelector("text=Zaytoon Test Trading");
step("create lead");

// validation
await p.click("header >> text=New lead");
await p.fill('input[name="phone"]', "123");
await p.click("button:has-text('Save')");
await p.waitForSelector("text=This field is required");
await p.waitForSelector("text=Enter a valid phone number");
await p.keyboard.press("Escape");
step("validation errors");

// persistence
await p.reload();
await p.waitForSelector("text=Zaytoon Test Trading");
step("persists after reload");

// search
await p.fill('input[aria-label="Search"]', "0551112223");
await p.waitForSelector("text=Zaytoon Test Trading");
assert.equal(await p.locator("tbody tr").count(), 1);
step("search by phone");

// edit via detail page
await p.click("text=Zaytoon Test Trading");
await p.waitForSelector("text=Zaytoon Flagship");
await p.click("button:has-text('Edit')");
await p.fill('input[name="projectName"]', "Zaytoon Flagship v2");
await p.click("button:has-text('Save')");
await p.waitForSelector("text=Zaytoon Flagship v2");
step("edit lead");

// add note -> timeline
await p.fill("textarea[placeholder^='Write a note']", "Called, wants quote");
await p.click("button:has-text('Add note')");
await p.waitForSelector("text=Called, wants quote");
step("timeline note");

// stage change to Won prompts outcome, dashboard updates
await p.selectOption('select[aria-label="Pipeline stage"]', { label: "Won" });
await p.waitForSelector("text=Won — record outcome");
await p.fill("input[inputmode='decimal']", "120000");
await p.click("button:has-text('Confirm')");
await p.waitForSelector("[role=dialog]", { state: "detached" });
await p.waitForTimeout(500);
await p.goto(URL + "/");
await p.waitForSelector("text=Won Contract Value");
const wonText = await p.innerText("body");
assert.match(wonText, /1,371,300|1,371,3/);
step("won outcome updates dashboard (1,251,300 + 120,000)");

// delete
await p.goto(URL + "/leads");
await p.fill('input[aria-label="Search"]', "Zaytoon");
await p.locator("tbody tr").first().locator("button[aria-label='Actions']").click();
await p.click("[role=menuitem]:has-text('Delete')");
await p.click("[role=dialog] button:has-text('Delete')");
await p.waitForSelector("text=No leads match your filters");
step("delete with confirm");

// kanban drag
await p.goto(URL + "/pipeline");
const card = p.locator("a:has-text('Skyline Corporate')").first();
await card.waitFor();
const handle = card.locator("xpath=ancestor::div[contains(@class,'group')]").locator("button[aria-label='Drag']");
const hb = await handle.boundingBox();
const target = p.locator("h3:has-text('Contacted')").locator("xpath=ancestor::div[contains(@class,'w-72')]");
const tb = await target.boundingBox();
await p.mouse.move(hb.x + 5, hb.y + 5);
await p.mouse.down();
await p.mouse.move(hb.x + 20, hb.y + 20, { steps: 5 });
await p.mouse.move(tb.x + tb.width / 2, tb.y + 150, { steps: 15 });
await p.mouse.up();
await p.waitForSelector("text=/Moved to/");
const stageName = (await p.locator("text=/Moved to/").first().innerText()).replace("Moved to ", "").trim();
await p.waitForTimeout(600);
await p.reload();
await p.waitForSelector("h3");
const col = await p.locator(`h3:text-is("${stageName}")`).locator("xpath=ancestor::div[contains(@class,'w-72')]").innerText();
assert.match(col, /Skyline Corporate Offices/);
step("kanban drag moves lead and persists");

// complete follow-up from follow-ups page
await p.goto(URL + "/followups");
await p.click("[role=tab]:has-text('Overdue')");
await p.locator("button:has-text('Mark done')").first().click();
await p.fill("[role=dialog] textarea", "Spoke to client");
await p.click("[role=dialog] button:has-text('Mark done')");
await p.waitForTimeout(500);
step("complete overdue follow-up");

// settings: category in use requires reassign
await p.goto(URL + "/categories");
await p.click("button:has-text('Add service')");
await p.fill("[role=dialog] input >> nth=0", "Glass Partitions");
await p.click("[role=dialog] button:has-text('Save')");
await p.waitForSelector("text=Glass Partitions");
const row = p.locator("li:has-text('Retail Fit-Out')").first();
await row.locator("button[aria-label='Delete']").click();
await p.waitForSelector("text=Reassign affected records to");
assert.equal(await p.locator("[role=dialog] button:has-text('Delete')").isEnabled(), true); // leave-empty allowed for categories
await p.keyboard.press("Escape");
step("in-use category delete requires explicit reassignment dialog");

// Arabic / RTL
await p.click("header button:has-text('العربية')");
await p.waitForTimeout(500);
assert.equal(await p.evaluate(() => document.documentElement.dir), "rtl");
await p.goto(URL + "/");
await p.waitForSelector("text=لوحة التحكم");
await p.screenshot({ path: "/tmp/shots/dashboard-ar.png" });
step("Arabic + RTL (persisted)");

// mobile
const m = await ctx.newPage({ viewport: { width: 390, height: 800 } });
await m.setViewportSize({ width: 390, height: 800 });
await m.goto(URL + "/leads");
await m.waitForSelector("text=Al Rawabi", { timeout: 15000 }).catch(() => {});
await m.screenshot({ path: "/tmp/shots/mobile-leads.png" });
const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
assert.equal(overflow, false);
step("mobile has no horizontal page overflow");

console.log("page errors:", errs);
assert.equal(errs.length, 0);
await b.close();
console.log("ALL PASSED");
