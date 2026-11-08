// ScherThing bake: render the personal content (reminders + calendars) to HTML
// and inject it into index.html between the CONTENT markers (plaintext — Matt
// confirmed the public-dashboard choice on Nov 8, 2026; encryption removed).
// Raw data exports live ONLY under private/ and are never pushed.
//
// Usage:
//   node bake.mjs --demo     fake data
//   node bake.mjs            private/*.json (fresh exports)
import { readFileSync, writeFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
const TZ = "America/New_York";
const ITER = 600000;
const demo = process.argv.includes("--demo");

/* ---------- load data ---------- */
let reminders, events, bakedAt = new Date();
if (demo) {
  reminders = [
    { title: "Otto: demo medication AM", due_date: new Date().toISOString(), priority: 1, priority_name: "high",
      recurrence: { frequency: "daily", interval: 1 }, notes: "Demo notes — not real data." },
    { title: "Proviable", due_date: new Date().toISOString(), priority: 0, recurrence: { frequency: "daily", interval: 1 } },
    { title: "Demo household task", due_date: new Date(Date.now() + 864e5 * 3).toISOString(), priority: 0,
      recurrence: { frequency: "monthly", interval: 1 } },
  ];
  events = [
    { calendar: "Matt", start: new Date().toISOString(), summary: "Demo Matt event", all_day: false },
    { calendar: "samantha.z.scher@gmail.com", start: new Date(Date.now() + 864e5).toISOString(), summary: "Demo Sam event", all_day: false },
    { calendar: "ScherThing", start: new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10), summary: "Demo family event", all_day: true },
  ];
} else {
  reminders = JSON.parse(readFileSync(DIR + "private/reminders-scherthing.json", "utf8")).reminders;
  events = JSON.parse(readFileSync(DIR + "private/agenda-14.json", "utf8")).events;
}

/* ---------- helpers ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const etDate = d => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const etTime = d => new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d).replace(/\s?[AP]M/i, m => m.trim().toLowerCase());
const etDayLabel = d => new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(d);
const todayET = etDate(bakedAt);

function schedLabel(r) {
  if (!r) return "";
  const days = { SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat" };
  if (r.frequency === "daily") return r.interval === 2 ? "Every other day" : r.interval > 1 ? `Every ${r.interval} days` : "Daily";
  if (r.frequency === "weekly") return r.days_of_week?.length ? r.days_of_week.map(d => days[d]).join(" & ") : "Weekly";
  if (r.frequency === "monthly") return r.interval === 1 ? "Monthly" : `Every ${r.interval} months`;
  if (r.frequency === "yearly") return "Yearly";
  return "";
}
function dueChip(iso) {
  const d = new Date(iso);
  const date = etDate(d);
  if (date === todayET) return `<span class="chip today">Today · ${etTime(d)}</span>`;
  const tomorrow = etDate(new Date(bakedAt.getTime() + 864e5));
  if (date === tomorrow) return `<span class="chip">Tomorrow · ${etTime(d)}</span>`;
  return `<span class="chip">${etDayLabel(d)} · ${etTime(d)}</span>`;
}
function itemHTML(r, { withNotes = true } = {}) {
  const sched = schedLabel(r.recurrence);
  return `<div class="item"><div class="item-top"><span class="item-title">${esc(r.title)}</span>`
    + (r.priority_name === "high" ? `<span class="flag">⚑ HIGH</span>` : "")
    + (sched ? `<span class="chip sched">${esc(sched)}</span>` : "")
    + (r.due_date ? dueChip(r.due_date) : "")
    + `</div>`
    + (withNotes && r.notes ? `<div class="item-notes">${esc(r.notes)}</div>` : "")
    + `</div>`;
}

/* ---------- reminders sections ---------- */
const isOtto = r => /^(Otto:|Proviable|Heartgard)/.test(r.title);
const otto = reminders.filter(isOtto).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
const house = reminders.filter(r => !isOtto(r)).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
const dueToday = reminders.filter(r => r.due_date && etDate(new Date(r.due_date)) === todayET)
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

/* ---------- calendar section (Matt / Sam / ScherThing only) ---------- */
const CALMAP = { "Matt": ["Matt", "cal-matt"], "samantha.z.scher@gmail.com": ["Sam", "cal-sam"], "ScherThing": ["ScherThing", "cal-scher"] };
const calEvents = events.filter(e => CALMAP[e.calendar]);
const byDay = new Map();
for (const e of calEvents) {
  const d = new Date(e.start);
  const key = e.all_day ? e.start.slice(0, 10) : etDate(d);
  if (!byDay.has(key)) byDay.set(key, []);
  byDay.get(key).push(e);
}
let calHTML = "";
for (const key of [...byDay.keys()].sort()) {
  const dayEvents = byDay.get(key).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const d0 = new Date(key + "T12:00:00");
  const label = (key === todayET ? "Today — " : "") + etDayLabel(d0);
  calHTML += `<div class="day-group"><div class="day-label${key === todayET ? " today" : ""}">${esc(label)}</div>`;
  for (const e of dayEvents) {
    const [who, cls] = CALMAP[e.calendar];
    const time = e.all_day ? "All day" : etTime(new Date(e.start));
    calHTML += `<div class="ev"><span class="time">${esc(time)}</span><span class="ttl">${esc(e.summary)}</span><span class="chip ${cls}">${who}</span></div>`;
  }
  calHTML += `</div>`;
}
if (!calHTML) calHTML = `<div class="empty">Nothing on the family calendars in the next two weeks.</div>`;

/* ---------- assemble payload ---------- */
const payloadHTML =
  `<div class="snap-note">Snapshot as of ${etDayLabel(bakedAt)} · ${etTime(bakedAt)} ET · Re-baked daily + hourly — weather above is live.</div>`
  + `<section class="sec sec-today"><h2>Due today <span class="n">· ${dueToday.length}</span></h2>`
  + (dueToday.length ? dueToday.map(r => itemHTML(r, { withNotes: false })).join("") : `<div class="empty">Nothing due today. 🎉</div>`)
  + `</section>`
  + `<section class="sec sec-otto"><h2>🐾 Otto's care <span class="n">· ${otto.length} routines</span></h2>`
  + otto.map(r => itemHTML(r)).join("")
  + `</section>`
  + `<section class="sec sec-house"><h2>🏠 Household <span class="n">· ${house.length}</span></h2>`
  + house.map(r => itemHTML(r, { withNotes: false })).join("")
  + `</section>`
  + `<section class="sec sec-cal"><h2>📅 Next two weeks <span class="n">· Matt · Sam · ScherThing</span></h2>`
  + calHTML
  + `</section>`;

/* ---------- inject (plaintext) ---------- */
const file = DIR + "index.html";
const html = readFileSync(file, "utf8");
if (!html.includes("<!--CONTENT_START-->") || !html.includes("<!--CONTENT_END-->"))
  throw new Error("CONTENT markers not found in index.html");
writeFileSync(file, html.replace(/<!--CONTENT_START-->[\s\S]*?<!--CONTENT_END-->/,
  "<!--CONTENT_START-->\n" + payloadHTML + "\n<!--CONTENT_END-->"));
console.log(`${demo ? "DEMO" : "REAL"} bake done: content ${payloadHTML.length} chars injected into index.html`);
