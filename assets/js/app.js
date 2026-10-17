var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
(function() {
  try {
    if (window.top !== window.self) {
      if (window.APP_ROLE === "admin") {
        document.documentElement.innerHTML = '<p style="font-family:sans-serif;padding:24px;direction:rtl">لا يمكن فتح لوحة الإدارة داخل إطار.</p>';
        try {
          window.top.location = window.self.location;
        } catch (e) {
        }
        throw new Error("framed");
      }
      try {
        window.top.location = window.self.location;
      } catch (e) {
      }
    }
  } catch (e) {
  }
})();
(function() {
  const cfg = window.FIREBASE_CONFIG;
  if (cfg && window.firebase) {
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg);
    } catch (e) {
      console.warn("Firebase init", e);
    }
  }
  window.db = window.firebase && firebase.database ? firebase.database() : null;
})();
(function() {
  try {
    if (window.APP_ROLE === "admin") {
      console.info("Manifest injection skipped for admin panel");
    } else if (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      var link = document.createElement("link");
      link.rel = "manifest";
      link.href = "manifest.json";
      document.head.appendChild(link);
    } else {
      console.info("Manifest injection skipped for protocol", location.protocol);
    }
  } catch (e) {
    console.warn("Error injecting manifest:", e);
  }
})();
if ("serviceWorker" in navigator && window.APP_ROLE !== "admin") {
  if (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js?v=20261016-8").catch((e) => console.warn("SW register failed", e));
    });
  } else {
    console.info("ServiceWorker registration skipped: insecure origin", location.protocol, location.hostname);
  }
}
let selectedSection = 1;
let currentView = "home";
let isEditMode = false;
Object.defineProperty(window, "EDIT_MODE", {
  get() {
    return isEditMode;
  },
  configurable: false
});
const defaultData = {
  sections: 1,
  sectionNames: ["الشعبة 1"],
  subjects: [],
  progress: {},
  assignments: {},
  exams: {},
  recordings: {},
  recordingsLinks: {},
  recordingsChannelLink: "",
  support: [],
  summaries: [],
  liveLinks: {},
  news: [],
  weeklyScheduleEnabled: true,
  weeklySchedule: {
    Saturday: {},
    Sunday: {},
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {}
  },
  importantLinks: [],
  team: [],
  books: [],
  packages: [],
  // per-section teachers and group links (will be normalized)
  teachers: {
    // example: '1': [{ id:1, name:'أ. خالد', role:'رياضيات', phone:'079...'}]
  },
  groupLinks: {
    // example: '1': [{ id:1, title:'مجموعة شعبة 1', url:'#' }]
  }
};
for (let i = 1; i <= defaultData.sections; i++) {
  if (!defaultData.progress[i]) defaultData.progress[i] = {};
  if (!defaultData.assignments[i]) defaultData.assignments[i] = [];
  if (!defaultData.exams[i]) defaultData.exams[i] = [];
  if (!defaultData.liveLinks[i]) defaultData.liveLinks[i] = {};
  if (!defaultData.recordings[i]) defaultData.recordings[i] = [];
  if (!defaultData.recordingsLinks[i]) defaultData.recordingsLinks[i] = {};
}
function asArray(v) {
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== void 0);
  if (v && typeof v === "object") return Object.keys(v).sort((a, b) => Number(a) - Number(b)).map((k) => v[k]).filter((x) => x !== null && x !== void 0);
  return [];
}
window.asArray = asArray;
function normalizeAppData(data) {
  var _a;
  if (!data) return defaultData;
  ["books", "packages", "support", "summaries", "news", "importantLinks", "team"].forEach((k) => {
    if (data[k] !== void 0) data[k] = asArray(data[k]);
  });
  if (!data.sections) data.sections = defaultData.sections;
  if (!Array.isArray(data.subjects)) data.subjects = Array.isArray(defaultData.subjects) ? defaultData.subjects.slice() : [];
  if (!data.progress) data.progress = {};
  if (!Array.isArray(data.sectionNames)) data.sectionNames = Array.from({ length: data.sections || 0 }, (_, i) => `شعبة ${i + 1}`);
  while (data.sectionNames.length < (data.sections || 0)) data.sectionNames.push(`شعبة ${data.sectionNames.length + 1}`);
  if (data.sectionNames.length > (data.sections || 0)) data.sectionNames = data.sectionNames.slice(0, data.sections || 0);
  if (!data.assignments) data.assignments = {};
  if (!data.liveLinks) data.liveLinks = {};
  if (!data.recordings) data.recordings = {};
  if (!data.recordingsLinks) data.recordingsLinks = {};
  if (!data.recordingsChannelLink) data.recordingsChannelLink = "";
  if (!data.support) data.support = defaultData.support.slice();
  if (!data.summaries) data.summaries = defaultData.summaries.slice();
  if (!data.liveLinks) data.liveLinks = {};
  if (!data.news) data.news = defaultData.news.slice();
  if (!data.importantLinks) data.importantLinks = defaultData.importantLinks.slice();
  if (!data.team) data.team = defaultData.team.slice();
  if (!data.books) data.books = defaultData.books.slice();
  if (!data.packages) data.packages = defaultData.packages.slice();
  if (!data.exams) data.exams = {};
  if (!data.teachers) data.teachers = {};
  if (!data.groupLinks) data.groupLinks = {};
  if (typeof data.weeklyScheduleEnabled !== "boolean") data.weeklyScheduleEnabled = true;
  if (!data.weeklySchedule) data.weeklySchedule = { Saturday: {}, Sunday: {}, Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {} };
  for (const d of ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) if (!data.weeklySchedule[d]) data.weeklySchedule[d] = {};
  if (!Array.isArray(data.team)) data.team = Array.isArray(defaultData.team) ? defaultData.team.slice() : [];
  data.team.forEach((m) => {
    if (!m.bio) m.bio = "";
  });
  for (let i = 1; i <= data.sections; i++) {
    if (!data.progress[i]) data.progress[i] = {};
    if (!data.assignments[i]) data.assignments[i] = [];
    if (!data.exams[i]) data.exams[i] = [];
    if (!data.liveLinks[i]) data.liveLinks[i] = {};
    if (!data.recordings[i]) data.recordings[i] = [];
    if (!data.recordingsLinks[i]) data.recordingsLinks[i] = {};
    if (!data.teachers[i]) data.teachers[i] = [];
    if (!data.groupLinks[i]) data.groupLinks[i] = [];
    ["assignments", "exams", "recordings", "teachers", "groupLinks"].forEach((k) => {
      data[k][i] = asArray(data[k][i]);
    });
    if (!Array.isArray(data.subjects)) data.subjects = [];
  }
  for (let i = 1; i <= (data.sections || 0); i++) {
    for (const key of ["progress", "liveLinks", "recordingsLinks"]) {
      if (Array.isArray((_a = data[key]) == null ? void 0 : _a[i])) {
        const obj = {};
        data[key][i].forEach((entry) => {
          if (!entry || typeof entry !== "object") return;
          const subject = String(entry.subject || "").trim();
          if (!subject) return;
          obj[subject] = entry.value !== void 0 ? entry.value : entry.link !== void 0 ? entry : entry;
        });
        data[key][i] = obj;
      }
    }
  }
  return data;
}
function prepareAppDataForFirebase(src) {
  var _a;
  try {
    const data = JSON.parse(JSON.stringify(src || {}));
    const sections = data.sections || 0;
    for (let i = 1; i <= sections; i++) {
      for (const key of ["progress", "liveLinks", "recordingsLinks"]) {
        const value = (_a = data[key]) == null ? void 0 : _a[i];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          data[key][i] = Object.keys(value).map((subject) => ({ subject, value: value[subject] }));
        }
      }
    }
    return data;
  } catch (e) {
    console.warn("prepareAppDataForFirebase failed, falling back to original", e);
    return src;
  }
}
let appData = normalizeAppData(JSON.parse(localStorage.getItem("collegeAppData")) || defaultData);
let firebaseLoadStarted = false;
let dataEpoch = 0;
let lastFetchAt = 0;
let fetchInFlight = null;
let fbConnected = true;
function canWriteData() {
  return window.APP_ROLE === "admin" && window.IS_ADMIN === true && window.ADMIN_VERIFIED === true && !!window.AUTH_USER;
}
window.canWriteData = canWriteData;
function saveData() {
  dataEpoch++;
  try {
    const serialized = JSON.stringify(appData);
    if (serialized.length > 8 * 1024 * 1024) {
      alert("حجم البيانات كبير جداً (أكثر من 8 ميجابايت). احذف بعض المرفقات الكبيرة قبل الحفظ.");
      return Promise.reject(new Error("PAYLOAD_TOO_LARGE"));
    }
    localStorage.setItem("collegeAppData", serialized);
  } catch (e) {
    console.warn("localStorage save failed", e);
  }
  if (!canWriteData()) {
    console.warn("Blocked client write: admin session is not authorized.");
    if (window.APP_ROLE === "admin" && typeof window.notifyUnauthorized === "function") window.notifyUnauthorized();
    return Promise.reject(new Error("UNAUTHORIZED"));
  }
  if (!db) return Promise.resolve();
  return db.ref("appData").set(prepareAppDataForFirebase(appData)).catch((err) => {
    console.error("Firebase save failed:", err);
    throw err;
  });
}
window.saveData = saveData;
function deleteAllItems(label, getList, afterDelete) {
  if (!window.IS_ADMIN) return;
  const list = getList();
  if (!Array.isArray(list) || list.length === 0) {
    alert("لا توجد بيانات لحذفها.");
    return;
  }
  if (!confirm("هل أنت متأكد من حذف جميع " + label + "؟ لا يمكن التراجع عن هذا الإجراء.")) return;
  list.splice(0, list.length);
  saveData();
  if (afterDelete) afterDelete();
  else render();
}
function deleteAllSectionItems(label, getList, afterDelete) {
  if (!window.IS_ADMIN) return;
  const list = getList();
  if (!Array.isArray(list) || list.length === 0) {
    alert("لا توجد بيانات لحذفها في الشعبة الحالية.");
    return;
  }
  if (!confirm("هل أنت متأكد من حذف جميع " + label + " في الشعبة الحالية؟ لا يمكن التراجع عن هذا الإجراء.")) return;
  list.splice(0, list.length);
  saveData();
  if (afterDelete) afterDelete();
  else render();
}
window.enableEditMode = function() {
  if (window.APP_ROLE !== "admin") return;
  if (window.IS_ADMIN !== true || window.ADMIN_VERIFIED !== true) return;
  isEditMode = true;
};
window.disableEditMode = function() {
  isEditMode = false;
};
function getSubjectsList() {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  const add = (v) => {
    const name = String(v != null ? v : "").trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    out.push(name);
  };
  if (Array.isArray(appData.subjects)) appData.subjects.forEach(add);
  Object.keys(appData.progress && appData.progress[selectedSection] || {}).forEach(add);
  Object.keys(appData.liveLinks && appData.liveLinks[selectedSection] || {}).forEach(add);
  Object.keys(appData.recordingsLinks && appData.recordingsLinks[selectedSection] || {}).forEach(add);
  return out;
}
window.getSubjectsList = getSubjectsList;
function fetchRemoteData() {
  if (!db) return Promise.resolve("offline");
  if (fetchInFlight) return fetchInFlight;
  const epoch = dataEpoch;
  const job = new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve("timeout");
      }
    }, 12e3);
    db.ref("appData").once("value").then((snap) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (!snap.exists()) {
        resolve("empty");
        return;
      }
      if (epoch !== dataEpoch) {
        resolve("skipped");
        return;
      }
      appData = normalizeAppData(snap.val());
      if (selectedSection > appData.sections) selectedSection = 1;
      try {
        localStorage.setItem("collegeAppData", JSON.stringify(appData));
      } catch (e) {
      }
      lastFetchAt = Date.now();
      resolve("ok");
    }).catch((err) => {
      console.warn("Firebase appData load failed:", err);
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve("error");
    });
  }).then((r) => {
    fetchInFlight = null;
    return r;
  });
  fetchInFlight = job;
  return job;
}
function loadDataFromFirebase() {
  if (firebaseLoadStarted || !db) return;
  firebaseLoadStarted = true;
  try {
    db.ref(".info/connected").on("value", (s) => {
      fbConnected = !!s.val();
    });
  } catch (e) {
  }
  fetchRemoteData().then((r) => {
    if (r === "ok") {
      try {
        render();
      } catch (e) {
        console.warn("render after Firebase load failed", e);
      }
    }
  });
}
loadDataFromFirebase();
function typingNow() {
  const a = document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
}
function softRefresh() {
  if (!db || Date.now() - lastFetchAt < 4e4 || typingNow()) return;
  fetchRemoteData().then((r) => {
    if (r === "ok" && !typingNow()) {
      try {
        render();
      } catch (e) {
      }
    }
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && window.APP_ROLE !== "admin") softRefresh();
});
window.addEventListener("online", () => {
  if (window.APP_ROLE !== "admin") softRefresh();
});
function showToast(msg, kind) {
  let t = document.getElementById("app-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "app-toast";
    t.className = "app-toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.dataset.kind = kind || "ok";
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
let refreshing = false;
async function refreshCurrentSection() {
  if (refreshing) return;
  refreshing = true;
  const btn = document.getElementById("refresh-btn");
  if (btn) {
    btn.classList.add("spinning");
    btn.disabled = true;
  }
  let result = "offline";
  try {
    const reconnect = () => {
      try {
        db.goOffline();
        db.goOnline();
      } catch (e) {
      }
    };
    if (db) {
      if (!fbConnected) reconnect();
      result = await fetchRemoteData();
      if (result === "timeout" || result === "error") {
        reconnect();
        result = await fetchRemoteData();
      }
    }
    try {
      render();
    } catch (e) {
      console.warn("render", e);
    }
  } finally {
    refreshing = false;
    if (btn) {
      btn.classList.remove("spinning");
      btn.disabled = false;
    }
  }
  if (result === "ok" || result === "empty" || result === "skipped") showToast("تم تحديث البيانات");
  else showToast("تعذر الاتصال، تحقق من الإنترنت وجرّب مرة أخرى", "err");
}
window.refreshCurrentSection = refreshCurrentSection;
const REFRESH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>';
function ensureRefreshButton() {
  const inner = document.querySelector(".main-content .header");
  if (!inner || document.getElementById("refresh-btn")) return;
  const b = document.createElement("button");
  b.id = "refresh-btn";
  b.type = "button";
  b.className = "refresh-btn";
  b.title = "تحديث البيانات";
  b.setAttribute("aria-label", "تحديث البيانات");
  b.innerHTML = REFRESH_ICON + "<span>تحديث</span>";
  b.onclick = refreshCurrentSection;
  inner.appendChild(b);
}
window.ensureRefreshButton = ensureRefreshButton;
const DEFAULT_SETTINGS = {
  font: "default",
  colorScheme: "light",
  themeVersion: 6,
  fontScale: 80,
  lineHeight: 17,
  highContrast: false,
  reducedMotion: false,
  compactMode: false
};
function saveUserSettings(value) {
  try {
    localStorage.setItem("userSettings", JSON.stringify(value || DEFAULT_SETTINGS));
  } catch (e) {
    console.warn("userSettings save failed", e);
  }
}
function loadUserSettings() {
  try {
    const stored = localStorage.getItem("userSettings");
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}
let userSettings = loadUserSettings();
if (!userSettings || typeof userSettings !== "object") userSettings = __spreadValues({}, DEFAULT_SETTINGS);
if (userSettings.themeVersion !== 6) {
  userSettings.colorScheme = "light";
  userSettings.themeVersion = 6;
  saveUserSettings(userSettings);
}
if (!["light", "dark"].includes(userSettings.colorScheme)) userSettings.colorScheme = "light";
function setFont(fontName) {
  const map = { default: '"Segoe UI", Tahoma, Arial, sans-serif', aldhabi: "'ALDHABI', sans-serif", alatypoo: "'AlaTypoo', sans-serif", dwnoutsh: "'DWNOUTSH', sans-serif", kfxftout: "'KFXFTOUT', sans-serif", ptbldbrk: "'PTBLDBRK', sans-serif" };
  if (!map[fontName]) return;
  document.documentElement.style.setProperty("--font-family", map[fontName]);
  userSettings.font = fontName;
  saveUserSettings(userSettings);
  updateFontButtons();
}
function setColorScheme(schemeName) {
  const normalized = schemeName === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  try {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", normalized === "dark" ? "#141210" : "#f6f1e8");
  } catch (e) {
  }
  userSettings.colorScheme = normalized;
  saveUserSettings(userSettings);
  updateColorSchemeButtons();
}
function updateFontButtons() {
  const cur = userSettings.font || "default";
  document.querySelectorAll(".font-choice-btn").forEach((b) => b.classList.toggle("selected", b.id === `font-${cur}-btn`));
}
function updateColorSchemeButtons() {
  const cur = userSettings.colorScheme || "light";
  document.querySelectorAll(".theme-option").forEach((b) => b.classList.toggle("selected", b.id === `scheme-${cur}-btn`));
}
function setFontScale(v) {
  const n = Math.max(60, Math.min(120, Number(v) || 80));
  document.documentElement.style.setProperty("--font-scale", n / 100);
  document.documentElement.style.setProperty("--base-font-size", 16 * n / 100 + "px");
  userSettings.fontScale = n;
  saveUserSettings(userSettings);
  const e = document.getElementById("font-size-value");
  if (e) e.textContent = n + "%";
  const input = document.getElementById("font-size-range");
  if (input) input.value = n;
}
function setLineHeight(v) {
  const n = Math.max(15, Math.min(22, Number(v) || 17));
  document.documentElement.style.setProperty("--line-height-scale", n / 10);
  userSettings.lineHeight = n;
  saveUserSettings(userSettings);
  const e = document.getElementById("line-height-value");
  if (e) e.textContent = (n / 10).toFixed(1) + "×";
  const input = document.getElementById("line-height-range");
  if (input) input.value = n;
}
function toggleHighContrast() {
  userSettings.highContrast = !userSettings.highContrast;
  document.body.classList.toggle("high-contrast", userSettings.highContrast);
  saveUserSettings(userSettings);
  updateAppearanceStates();
}
function toggleReducedMotion() {
  userSettings.reducedMotion = !userSettings.reducedMotion;
  document.body.classList.toggle("reduced-motion", userSettings.reducedMotion);
  saveUserSettings(userSettings);
  updateAppearanceStates();
}
function toggleCompactMode() {
  userSettings.compactMode = !userSettings.compactMode;
  document.body.classList.toggle("compact-mode", userSettings.compactMode);
  saveUserSettings(userSettings);
  updateAppearanceStates();
}
function updateAppearanceStates() {
  [["contrast-state", userSettings.highContrast], ["motion-state", userSettings.reducedMotion], ["compact-state", userSettings.compactMode]].forEach((x) => {
    const e = document.getElementById(x[0]);
    if (e) e.textContent = x[1] ? "●" : "○";
  });
}
function resetAppearanceSettings() {
  userSettings = __spreadValues({}, DEFAULT_SETTINGS);
  saveUserSettings(userSettings);
  setFont("default");
  setColorScheme("light");
  setFontScale(80);
  setLineHeight(17);
  document.body.classList.remove("high-contrast", "reduced-motion", "compact-mode");
  updateAppearanceStates();
  render();
}
function applyStoredSettings() {
  const fm = { default: '"Segoe UI", Tahoma, Arial, sans-serif', aldhabi: "'ALDHABI', sans-serif", alatypoo: "'AlaTypoo', sans-serif", dwnoutsh: "'DWNOUTSH', sans-serif", kfxftout: "'KFXFTOUT', sans-serif", ptbldbrk: "'PTBLDBRK', sans-serif" };
  document.documentElement.style.setProperty("--font-family", fm[userSettings.font] || fm.default);
  setColorScheme(userSettings.colorScheme || "light");
  setFontScale(userSettings.fontScale || 80);
  setLineHeight(userSettings.lineHeight || 17);
  document.body.classList.toggle("high-contrast", !!userSettings.highContrast);
  document.body.classList.toggle("reduced-motion", !!userSettings.reducedMotion);
  document.body.classList.toggle("compact-mode", !!userSettings.compactMode);
  updateAppearanceStates();
}
applyStoredSettings();
function escapeHtml(v) {
  return String(v != null ? v : "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}
function esc(v) {
  return escapeHtml(v);
}
function escMultiline(v) {
  return escapeHtml(v);
}
function jsAttr(v) {
  return escapeHtml(String(v != null ? v : "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\r/g, "").replace(/\n/g, "\\n"));
}
const SAFE_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:", "sms:", "whatsapp:"];
function safeUrl(v) {
  let raw = String(v != null ? v : "").trim();
  if (!raw) return "";
  raw = raw.replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, "");
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.startsWith("data:")) {
    return /^data:image\/(png|jpe?g|gif|webp|bmp|avif);base64,[a-z0-9+/=\s]*$/i.test(raw) ? raw : "";
  }
  if (lower.startsWith("blob:")) return raw;
  if (/^[#/?]/.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    const scheme = lower.slice(0, lower.indexOf(":") + 1);
    return SAFE_URL_SCHEMES.includes(scheme) ? raw : "";
  }
  return "https://" + raw;
}
function safeUrlAttr(v) {
  return escapeHtml(safeUrl(v));
}
function safeImgSrc(v) {
  const u = safeUrl(v);
  if (!u) return "";
  return /^(https?:|data:image\/|blob:)/i.test(u) ? escapeHtml(u) : "";
}
function safePhone(v) {
  return String(v != null ? v : "").replace(/[^0-9+]/g, "");
}
window.safeUrl = safeUrl;
window.escapeHtml = escapeHtml;
function getSectionLabel(i) {
  return appData.sectionNames && appData.sectionNames[i - 1] || `شعبة ${i}`;
}
function renderSectionManagement() {
  const box = document.getElementById("section-management");
  if (!box || !window.IS_OWNER) {
    if (box) box.innerHTML = "";
    return;
  }
  box.innerHTML = "";
  for (let i = 1; i <= appData.sections; i++) {
    const row = document.createElement("div");
    row.className = "management-row";
    row.innerHTML = '<input class="editable-input" value="' + escapeHtml(getSectionLabel(i)) + '" placeholder="اسم الشعبة"><button class="btn-delete btn-sm" ' + (appData.sections <= 1 ? "disabled" : "") + ">حذف</button>";
    const inp = row.querySelector("input");
    inp.onchange = () => renameSection(i, inp.value);
    row.querySelector("button").onclick = () => deleteSection(i);
    box.appendChild(row);
  }
}
function renameSection(i, n) {
  if (!window.IS_OWNER) return;
  n = (n || "").trim();
  if (!n) return;
  appData.sectionNames[i - 1] = n;
  saveData();
  render();
}
function addNewSection() {
  if (!window.IS_OWNER) return;
  appData.sections += 1;
  appData.sectionNames = appData.sectionNames || [];
  appData.sectionNames.push(`شعبة ${appData.sections}`);
  ["progress", "assignments", "exams", "liveLinks", "recordings", "recordingsLinks", "teachers", "groupLinks"].forEach((k) => {
    appData[k] = appData[k] || {};
    appData[k][appData.sections] = k === "assignments" || k === "exams" || k === "recordings" ? [] : {};
  });
  saveData();
  render();
}
function deleteSection(i) {
  if (!window.IS_OWNER) return;
  if (appData.sections <= 1) return;
  if (!confirm("حذف " + getSectionLabel(i) + "؟ سيتم حذف بياناتها أيضاً.")) return;
  ["progress", "assignments", "exams", "liveLinks", "recordings", "recordingsLinks", "teachers", "groupLinks"].forEach((k) => {
    if (appData[k]) delete appData[k][i];
  });
  appData.sections--;
  appData.sectionNames.splice(i - 1, 1);
  if (selectedSection > appData.sections) selectedSection = appData.sections;
  saveData();
  render();
}
function renderKnownAccounts() {
  const box = document.getElementById("known-accounts-list");
  if (!box || !window.IS_OWNER || !db) return;
  Promise.all([db.ref("loginDirectory").once("value"), db.ref("adminUsers").once("value")]).then(([a, b]) => {
    const knownByUid = {};
    a.forEach((c) => knownByUid[c.key] = __spreadValues({ uid: c.key }, c.val() || {}));
    const admins = b.val() || {};
    Object.keys(admins).forEach((uid) => {
      if (!knownByUid[uid]) knownByUid[uid] = __spreadValues({ uid }, admins[uid] || {});
    });
    const known = Object.values(knownByUid);
    if (!known.length) {
      box.innerHTML = '<div class="notice">سيظهر الحساب هنا بعد أول محاولة دخول من /admin/.</div>';
      return;
    }
    box.innerHTML = "";
    known.sort((x, y) => String(x.email || "").localeCompare(String(y.email || ""))).forEach((u) => {
      const row = document.createElement("div");
      row.className = "management-row account-row";
      const is = !!admins[u.uid], isSelf = window.AUTH_USER && u.uid === window.AUTH_USER.uid;
      row.innerHTML = "<div><strong>" + escapeHtml(u.displayName || "حساب Google") + "</strong><small>" + escapeHtml(u.email || "") + '</small></div><button class="btn-sm ' + (isSelf ? "btn-link" : is ? "btn-delete" : "btn-add") + '" ' + (isSelf ? "disabled" : "") + ">" + (isSelf ? "المالك" : is ? "سحب الصلاحية" : "منح الصلاحية") + "</button>";
      if (!isSelf) row.querySelector("button").onclick = () => is ? revokeAdmin(u.uid) : grantAdmin(u.uid);
      box.appendChild(row);
    });
  }).catch(() => box.innerHTML = '<div class="notice">تعذر تحميل الحسابات حالياً.</div>');
}
function grantAdmin(uid) {
  if (!window.IS_OWNER || !db) return;
  db.ref("loginDirectory/" + uid).once("value").then((s) => {
    if (!s.exists()) return;
    const v = s.val();
    return db.ref("adminUsers/" + uid).set({ email: v.email || "", displayName: v.displayName || "", addedAt: firebase.database.ServerValue.TIMESTAMP });
  }).then(renderKnownAccounts);
}
function revokeAdmin(uid) {
  if (!window.IS_OWNER || !db) return;
  if (!confirm("سحب صلاحية هذا الحساب؟")) return;
  db.ref("adminUsers/" + uid).remove().then(renderKnownAccounts);
}
function grantAdminByEmail() {
  if (!window.IS_OWNER || !db) return;
  const input = document.getElementById("admin-email-search"), email = (input && input.value || "").trim().toLowerCase();
  if (!email) return;
  db.ref("loginDirectory").once("value").then((s) => {
    let found = null;
    s.forEach((c) => {
      const v = c.val() || {};
      if (String(v.email || "").toLowerCase() === email) found = __spreadValues({ uid: c.key }, v);
    });
    if (!found) {
      alert("الحساب يجب أن يحاول الدخول إلى /admin/ مرة واحدة أولاً.");
      return;
    }
    return db.ref("adminUsers/" + found.uid).set({ email: found.email || email, displayName: found.displayName || "", addedAt: firebase.database.ServerValue.TIMESTAMP });
  }).then(() => {
    if (input) input.value = "";
    renderKnownAccounts();
  });
}
let sectionHistory = [];
function showSection(sectionId) {
  if (window.APP_ROLE === "admin" && !window.IS_ADMIN) return;
  if (sectionId === "access-logs" && !window.IS_OWNER) return;
  if (currentView !== sectionId) {
    sectionHistory.push(currentView);
  }
  document.querySelectorAll(".nav-item").forEach((el) => el.classList.remove("active"));
  const activeNav = Array.from(document.querySelectorAll(".nav-item")).find((el) => (el.getAttribute("onclick") || "").includes(sectionId));
  if (activeNav) activeNav.classList.add("active");
  document.querySelectorAll(".content-area").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.classList.add("active");
  currentView = sectionId;
  const titles = {
    "home": "الرئيسية",
    "progress": "الرزم والمنهج",
    "assignments": "الواجبات",
    "exams": "الاختبارات",
    "support": "أرقام الدعم",
    "summaries": "الملفات والتلخيصات",
    "live-links": "روابط الحصص",
    "recordings": "تسجيلات الحصص",
    "news": "آخر الأخبار",
    "books-packages": "الكتب والرزم",
    "teachers": "أسماء الأساتذة",
    "group-links": "روابط المجموعات",
    "important-links": "روابط مهمة",
    "settings": "الإعدادات",
    "about-team": "فريق التطوير",
    "weekly-schedule": "الجدول الأسبوعي",
    "access-logs": "سجل الدخول"
  };
  const heading = document.getElementById("page-heading");
  if (heading) heading.innerText = titles[sectionId] || "";
  render();
  softRefresh();
}
function goBack() {
  if (sectionHistory.length > 0) {
    const prev = sectionHistory.pop();
    showSection(prev);
  } else {
    showSection("home");
  }
}
function setSection(sectionNum) {
  selectedSection = sectionNum;
  renderSectionSelectors();
  render();
}
window.addEventListener("popstate", function() {
  goBack();
});
function render() {
  if (window.APP_ROLE === "admin" && window.ADMIN_VERIFIED !== true) return;
  try {
    ensureRefreshButton();
  } catch (e) {
    console.warn("refresh btn", e);
  }
  try {
    initDhikr();
  } catch (e) {
    console.warn("dhikr", e);
  }
  try {
    renderDate();
  } catch (e) {
    console.warn("renderDate", e);
  }
  try {
    renderSectionSelectors();
  } catch (e) {
    console.warn("renderSectionSelectors", e);
  }
  if (currentView === "progress") renderProgress();
  if (currentView === "recordings") renderRecordings();
  if (currentView === "assignments") renderAssignments();
  if (currentView === "exams") renderExams();
  if (currentView === "support") renderSupport();
  if (currentView === "summaries") renderSummaries();
  if (currentView === "live-links") renderLiveLinks();
  if (currentView === "weekly-schedule") renderWeeklySchedule();
  if (currentView === "teachers") renderTeachers();
  if (currentView === "group-links") renderGroupLinks();
  if (currentView === "news") renderNews();
  if (currentView === "books-packages") renderBooksPackages();
  if (currentView === "important-links") renderImportantLinks();
  if (currentView === "settings") renderSettings();
  if (currentView === "about-team") renderTeam();
  if (currentView === "access-logs" && window.IS_OWNER && window.renderAccessLogs) window.renderAccessLogs();
  hideEmptyPublicActions();
  lockDownViewerUI();
}
function lockDownViewerUI() {
  if (window.APP_ROLE === "admin") return;
  try {
    document.querySelectorAll(
      ".add-new-container, .editable-field, .btn-delete, .btn-add, .btn-save, .admin-only, .owner-only-panel, .owner-only-nav, .owner-only-control, .manage-subjects-btn, .admin-signout, .schedule-add, .schedule-actions"
    ).forEach((el) => el.remove());
    document.querySelectorAll("input, textarea, select").forEach((el) => {
      const handler = (el.getAttribute("onchange") || "") + (el.getAttribute("oninput") || "");
      if (/^\s*(update|rename|delete|remove|add|toggleWeekly|grant|revoke)/i.test(handler)) el.remove();
    });
    document.body.classList.remove("edit-mode", "owner-mode", "admin-authorized");
    document.body.classList.add("view-mode");
  } catch (e) {
    console.warn("lockDownViewerUI", e);
  }
}
window.lockDownViewerUI = lockDownViewerUI;
function hideEmptyPublicActions() {
  if (window.IS_ADMIN) return;
  document.querySelectorAll(".content-area a").forEach((a) => {
    const h = (a.getAttribute("href") || "").trim();
    if (!h || h === "#" || h.toLowerCase() === "javascript:void(0)") a.style.display = "none";
  });
  document.querySelectorAll('.content-area .optional-action[data-empty="true"]').forEach((e) => e.style.display = "none");
}
function renderDate() {
  const el = document.getElementById("current-date");
  if (!el) return;
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  el.innerText = (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG", options);
}
function renderSectionSelectors() {
  const ids = ["progress-sec-selector", "record-sec-selector", "assign-sec-selector", "exams-sec-selector", "live-sec-selector"];
  ids.push("teachers-sec-selector", "group-sec-selector");
  ids.forEach((id) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = "";
    for (let i = 1; i <= appData.sections; i++) {
      const btn = document.createElement("button");
      btn.className = `sec-btn ${selectedSection === i ? "active" : ""}`;
      btn.innerText = getSectionLabel(i);
      btn.onclick = () => setSection(i);
      container.appendChild(btn);
    }
  });
}
function renderProgress() {
  const container = document.getElementById("progress-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع بيانات التقدم للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => {
      const sectionData2 = appData.progress[selectedSection] || {};
      if (!Object.keys(sectionData2).length) {
        alert("لا توجد بيانات لحذفها في الشعبة الحالية.");
        return;
      }
      if (!confirm("هل أنت متأكد من حذف جميع بيانات التقدم في الشعبة الحالية؟ لا يمكن التراجع عن هذا الإجراء.")) return;
      appData.progress[selectedSection] = {};
      saveData();
      render();
    };
    container.appendChild(clear);
  }
  const sectionData = appData.progress[selectedSection] || {};
  const subjectsInSection = Object.keys(sectionData);
  if (subjectsInSection.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا توجد مواد مسجلة لهذه الشعبة حالياً.</p>');
  }
  subjectsInSection.forEach((sub) => {
    const data = sectionData[sub] || { current: 0, total: 10, lessonName: "" };
    const percent = Math.min(100, Math.round(data.current / data.total * 100));
    const card = document.createElement("div");
    card.className = "data-card";
    card.innerHTML = `
                    <div class="data-header">
                        <h3>${esc(sub)}</h3>
                        <div class="lesson-name editable-value rich-text">${esc(data.lessonName && data.lessonName.trim() ? data.lessonName : "")}</div>
                        <div class="progress-text editable-value">درس ${esc(data.current)} من ${esc(data.total)}</div>
                    </div>
                    <div class="editable-field" style="margin-bottom: 12px;">
                        <label>اسم الدرس الحالي (اختياري):</label>
                        <input type="text" class="editable-input" value="${esc(data.lessonName || "")}" onchange="updateProgress('${jsAttr(sub)}', 'lessonName', this.value)">
                        <label>الدرس الحالي (رقم):</label>
                        <input type="number" class="editable-input" value="${esc(data.current)}" onchange="updateProgress('${jsAttr(sub)}', 'current', this.value)">
                        <label>إجمالي الدروس:</label>
                        <input type="number" class="editable-input" value="${esc(data.total)}" onchange="updateProgress('${jsAttr(sub)}', 'total', this.value)">
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <button class="btn-sm btn-delete" onclick="removeSubjectFromSection('${jsAttr(sub)}')">حذف المادة من الشعبة</button>
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${Number(percent) || 0}%"></div>
                    </div>
                    <!-- Attachments for this subject -->
                    <div style="margin-top:12px;">
                        <strong style="color:var(--text-light);">ملحقات المادة:</strong>
                        <div id="progress-attachments-${escapeId(sub)}" style="margin-top:8px;"></div>
                        ${isEditMode ? `
                        <div style="margin-top:10px; padding:10px; background:var(--card-bg); border-radius:6px;">
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button class="btn-sm" onclick="selectProgressAttachmentType('${escapeJs(sub)}','image')">📷 صورة</button>
                                <button class="btn-sm" onclick="selectProgressAttachmentType('${escapeJs(sub)}','link')">🔗 رابط</button>
                                <button class="btn-sm" onclick="selectProgressAttachmentType('${escapeJs(sub)}','file')">📎 ملف</button>
                            </div>
                            <div id="progress-attach-image-section-${escapeId(sub)}" style="display:none; margin-top:8px;">
                                <input type="file" id="progress-attachment-image-input-${escapeId(sub)}" accept="image/*">
                                <div id="progress-attachment-image-preview-${escapeId(sub)}"></div>
                            </div>
                            <div id="progress-attach-link-section-${escapeId(sub)}" style="display:none; margin-top:8px;">
                                <input type="text" id="progress-attachment-link-input-${escapeId(sub)}" class="editable-input" placeholder="https://...">
                            </div>
                            <div id="progress-attach-file-section-${escapeId(sub)}" style="display:none; margin-top:8px;">
                                <input type="file" id="progress-attachment-file-input-${escapeId(sub)}">
                                <div id="progress-attachment-file-preview-${escapeId(sub)}"></div>
                            </div>
                            <div style="margin-top:8px;">
                                <button class="btn-sm btn-add" onclick="addCurrentProgressAttachmentToSubject('${escapeJs(sub)}')">➕ أضف الملحق</button>
                            </div>
                        </div>` : ""}
                    </div>
                `;
    container.appendChild(card);
    try {
      renderProgressAttachments(sub);
    } catch (e) {
      console.warn("renderProgressAttachments error", e);
    }
  });
  const addBox = document.createElement("div");
  addBox.className = "add-new-container";
  const available = getSubjectsList().filter((s) => !subjectsInSection.includes(s));
  let optionsHtml = "";
  available.forEach((a) => {
    optionsHtml += `<option value="${esc(a)}">${esc(a)}</option>`;
  });
  addBox.innerHTML = `
                <h4>إضافة مادة موجودة للشعبة الحالية</h4>
                ${available.length === 0 ? '<p style="color:var(--text-light);">لا توجد مواد متاحة للإضافة.</p>' : `<select id="add-existing-subject-select" class="editable-input" style="margin-bottom:8px;">${optionsHtml}</select><button class="btn-sm btn-add" onclick="addExistingSubjectToSection()">أضف المادة للشعبة</button>`}
            `;
  container.appendChild(addBox);
}
function updateProgress(subject, field, value) {
  if (!appData.progress[selectedSection]) appData.progress[selectedSection] = {};
  if (!appData.progress[selectedSection][subject]) appData.progress[selectedSection][subject] = { current: 0, total: 10, lessonName: "" };
  if (field === "lessonName") {
    appData.progress[selectedSection][subject][field] = value;
  } else {
    appData.progress[selectedSection][subject][field] = parseInt(value) || 0;
  }
  saveData();
  render();
}
function removeSubjectFromSection(subject) {
  if (!confirm("هل تريد حذف هذه المادة من الشعبة الحالية؟ (سيتم إزالة التقدم والروابط لهذه الشعبة فقط)")) return;
  if (appData.progress && appData.progress[selectedSection]) delete appData.progress[selectedSection][subject];
  if (appData.liveLinks && appData.liveLinks[selectedSection]) delete appData.liveLinks[selectedSection][subject];
  saveData();
  render();
}
function addExistingSubjectToSection() {
  const sel = document.getElementById("add-existing-subject-select");
  if (!sel) return;
  const name = sel.value;
  if (!name) return;
  if (!appData.progress[selectedSection]) appData.progress[selectedSection] = {};
  if (appData.progress[selectedSection][name]) {
    alert("المادة موجودة بالفعل في هذه الشعبة");
    return;
  }
  appData.progress[selectedSection][name] = { current: 1, total: 20, lessonName: "" };
  if (!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
  appData.liveLinks[selectedSection][name] = { link: "", from: "", to: "" };
  saveData();
  render();
}
function renderAssignments() {
  const container = document.getElementById("assignments-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع الواجبات للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllSectionItems("الواجبات", () => appData.assignments[selectedSection] || [], () => renderAssignments());
    container.appendChild(clear);
  }
  let tasks = appData.assignments[selectedSection] || [];
  const modeEl = document.getElementById("assign-filter-mode");
  const dateEl = document.getElementById("assign-filter-date");
  const subjEl = document.getElementById("assign-filter-subject");
  const mode = modeEl ? modeEl.value : "all";
  if (subjEl) {
    const prev = subjEl.value || "all";
    let opts = '<option value="all">كل المواد</option>';
    getSubjectsList().forEach((s) => {
      opts += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
    subjEl.innerHTML = opts;
    subjEl.value = prev;
  }
  const newSubEl = document.getElementById("new-assignment-subject");
  if (newSubEl) {
    let opts2 = '<option value="">--- اختر مادة ---</option>';
    getSubjectsList().forEach((s) => {
      opts2 += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
    newSubEl.innerHTML = opts2;
  }
  if (mode === "date") {
    if (dateEl) {
      dateEl.style.display = "";
      const selDate = dateEl.value;
      if (selDate) {
        tasks = tasks.filter((t) => {
          if (!t.date) return false;
          const d = new Date(t.date);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}` === selDate;
        });
      }
    }
  } else {
    if (dateEl) dateEl.style.display = "none";
  }
  const selectedSubject = subjEl ? subjEl.value : "all";
  if (selectedSubject && selectedSubject !== "all") {
    tasks = tasks.filter((t) => t.subject === selectedSubject);
  }
  if (tasks.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا يوجد واجبات مسجلة لهذه الشعبة حالياً.</p>');
    return;
  }
  tasks.forEach((task, index) => {
    const div = document.createElement("div");
    div.className = `task-item ${task.done ? "completed" : ""}`;
    const dateLabel = task.date ? new Date(task.date).toLocaleDateString("ar-EG") : "";
    const subjectHtml = task.subject ? `<div class="task-subject">${esc(task.subject)}</div>` : "";
    let attachmentHtml = "";
    if (Array.isArray(task.attachments) && task.attachments.length > 0) {
      task.attachments.forEach((att, ai) => {
        if (att.type === "image") {
          attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${safeImgSrc(att.data)}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewAttachmentImage('assignment', ${Number(index)}, ${Number(ai)})">
                                </div>
                            `;
        } else if (att.type === "link") {
          attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer nofollow" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
        } else if (att.type === "file") {
          attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('assignment', ${Number(index)}, ${Number(ai)})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${esc(att.name || att.url || "ملف")}</span>
                                </div>
                            `;
        }
      });
    }
    div.innerHTML = `
                    <div style="flex:1">
                        ${subjectHtml}
                        <div class="task-desc"><span class="editable-value rich-text">${esc(task.text)}</span></div>
                                    ${attachmentHtml}
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;"><small style="color:var(--text-light);">${esc(dateLabel)}</small></div>
                        <textarea class="editable-field editable-input" rows="3" onchange="updateTaskText(${Number(index)}, this.value)">${esc(task.text)}</textarea>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteTask(${index})">حذف</button>
                `;
    container.appendChild(div);
  });
}
function renderRecordings() {
  const container = document.getElementById("recordings-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع التسجيلات للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllSectionItems("التسجيلات", () => appData.recordings[selectedSection] || [], () => renderRecordings());
    container.appendChild(clear);
  }
  let recs = appData.recordings[selectedSection] || [];
  const channelBox = document.getElementById("recordings-channel-box");
  if (channelBox) {
    const ch = appData.recordingsChannelLink || "";
    channelBox.innerHTML = `
                    <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #eef2ff;">
                        <strong>رابط قناة التسجيلات:</strong>
                        ${ch ? `<a href="${safeUrlAttr(ch)}" target="_blank" rel="noopener noreferrer" style="margin-inline-start:8px; display:inline-block;">فتح القناة</a>` : '<span style="color:var(--text-light); margin-inline-start:8px;">لم يتم تعيين رابط القناة بعد</span>'}
                        ${isEditMode ? `<div style="margin-top:8px;"><input type="text" id="global-recordings-channel" class="editable-input" placeholder="رابط قناة التسجيلات" value="${esc(ch)}" onchange="updateRecordingsChannelLink(this.value)"></div>` : ""}
                    </div>
                `;
  }
  const modeEl = document.getElementById("record-filter-mode");
  const dateEl = document.getElementById("record-filter-date");
  const subjEl = document.getElementById("record-filter-subject");
  const mode = modeEl ? modeEl.value : "all";
  if (subjEl) {
    const prev = subjEl.value || "all";
    let opts = '<option value="all">كل المواد</option>';
    getSubjectsList().forEach((s) => {
      opts += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
    subjEl.innerHTML = opts;
    subjEl.value = prev;
  }
  const newSubEl = document.getElementById("new-record-subject");
  if (newSubEl) {
    let opts2 = '<option value="">--- اختر مادة ---</option>';
    getSubjectsList().forEach((s) => {
      opts2 += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
    newSubEl.innerHTML = opts2;
  }
  if (mode === "date") {
    if (dateEl) {
      dateEl.style.display = "";
      const selDate = dateEl.value;
      if (selDate) {
        recs = recs.filter((r) => {
          if (!r.date) return false;
          const d = new Date(r.date);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}` === selDate;
        });
      }
    }
  } else {
    if (dateEl) dateEl.style.display = "none";
  }
  const selectedSubject = subjEl ? subjEl.value : "all";
  if (selectedSubject && selectedSubject !== "all") {
    recs = recs.filter((r) => r.subject === selectedSubject);
  }
  if (recs.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">جميع التسجيلات مرفوعة على قناة التسجيلات.</p>');
  } else {
    recs.forEach((r) => {
      const origIndex = (appData.recordings[selectedSection] || []).findIndex((rr) => rr.id === r.id);
      const row = document.createElement("div");
      row.className = "data-card";
      const dateLabel = r.date ? new Date(r.date).toLocaleDateString("ar-EG") : "";
      row.innerHTML = `
                        <div class="data-header">
                            <h3>${esc(r.subject || "عام")}</h3>
                            <div class="lesson-name rich-text">${esc(r.title)}</div>
                            <div class="progress-text">${esc(dateLabel)}</div>
                        </div>
                        <div style="margin-top:8px;"><a href="${safeUrlAttr(r.link)}" target="_blank" rel="noopener noreferrer">فتح التسجيل على يوتيوب</a></div>
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <button class="btn-sm btn-delete" onclick="deleteRecording(${origIndex})">حذف</button>
                        </div>
                    `;
      container.appendChild(row);
    });
  }
  if (selectedSubject && selectedSubject !== "all") {
    const subjLinks = appData.recordingsLinks && appData.recordingsLinks[selectedSection] || {};
    const subjectLink = subjLinks[selectedSubject] || "";
    const link = subjectLink || (appData.recordingsChannelLink || "");
    const box = document.createElement("div");
    box.className = "add-new-container";
    box.style.marginTop = "12px";
    box.innerHTML = `
                    <h4>رابط كل التسجيلات للمادة ${esc(selectedSubject)}</h4>
                    ${subjectLink ? `<a href="${safeUrlAttr(subjectLink)}" target="_blank" rel="noopener noreferrer">فتح رابط كل التسجيلات (رابط المادة)</a>` : link ? `<a href="${safeUrlAttr(link)}" target="_blank" rel="noopener noreferrer">فتح رابط قناة التسجيلات (افتراضي)</a>` : '<p style="color:var(--text-light);">لا يوجد رابط شامل لهذه المادة أو للقناة.</p>'}
                    ${isEditMode ? `<label style="margin-top:8px; color:var(--text-light);">تعريف/تعديل رابط المادة (سيُستخدم بدل القناة):</label><input type="text" id="edit-recordings-link" class="editable-input" value="${esc(subjectLink || "")}" onchange="updateRecordingsLink('${jsAttr(selectedSubject)}', this.value)">` : ""}
                `;
    container.appendChild(box);
  }
}
function addRecording() {
  const title = document.getElementById("new-record-title").value.trim();
  const link = document.getElementById("new-record-link").value.trim();
  const subj = document.getElementById("new-record-subject").value || "";
  const dateInput = document.getElementById("new-record-date") ? document.getElementById("new-record-date").value : "";
  if (!title || !link) {
    alert("الرجاء إدخال اسم التسجيل ورابط يوتيوب");
    return;
  }
  if (!appData.recordings[selectedSection]) appData.recordings[selectedSection] = [];
  const dateVal = dateInput ? new Date(dateInput).getTime() : Date.now();
  appData.recordings[selectedSection].push({ id: Date.now(), title, link, subject: subj, date: dateVal });
  saveData();
  document.getElementById("new-record-title").value = "";
  document.getElementById("new-record-link").value = "";
  if (document.getElementById("new-record-date")) document.getElementById("new-record-date").value = "";
  if (document.getElementById("new-record-subject")) document.getElementById("new-record-subject").value = "";
  renderRecordings();
}
function deleteRecording(index) {
  if (!confirm("هل تريد حذف هذا التسجيل؟")) return;
  if (!appData.recordings[selectedSection]) return;
  appData.recordings[selectedSection].splice(index, 1);
  saveData();
  renderRecordings();
}
function updateRecordingsLink(subject, value) {
  if (!appData.recordingsLinks[selectedSection]) appData.recordingsLinks[selectedSection] = {};
  appData.recordingsLinks[selectedSection][subject] = value;
  saveData();
  renderRecordings();
}
function updateRecordingsChannelLink(value) {
  appData.recordingsChannelLink = value || "";
  saveData();
  renderRecordings();
}
let currentAttachment = null;
let newAssignmentAttachments = [];
let newNewsAttachments = [];
let newLinkAttachments = [];
let currentLinkAttachment = null;
let currentNewsAttachment = null;
function selectAttachmentType(type) {
  console.log("selectAttachmentType called with type:", type);
  try {
    const imgSec = document.getElementById("attachment-image-section");
    const linkSec = document.getElementById("attachment-link-section");
    const fileSec = document.getElementById("attachment-file-section");
    if (imgSec) imgSec.style.display = "none";
    if (linkSec) linkSec.style.display = "none";
    if (fileSec) fileSec.style.display = "none";
    if (type === "image") {
      if (imgSec) {
        imgSec.style.display = "block";
        console.log("Image section shown");
      }
      const imgInput = document.getElementById("attachment-image-input");
      if (imgInput) {
        imgInput.onchange = handleImageAttachment;
      }
    } else if (type === "link") {
      if (linkSec) {
        linkSec.style.display = "block";
        console.log("Link section shown");
      }
    } else if (type === "file") {
      if (fileSec) {
        fileSec.style.display = "block";
        console.log("File section shown");
      }
      const fileInput = document.getElementById("attachment-file-input");
      if (fileInput) {
        fileInput.onchange = handleFileAttachment;
      }
    }
  } catch (e) {
    console.error("selectAttachmentType error:", e);
  }
}
function handleImageAttachment(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    currentAttachment = {
      type: "image",
      name: file.name,
      data: event.target.result
    };
    const preview = document.getElementById("attachment-image-preview");
    if (preview) {
      preview.innerHTML = `<img src="${safeImgSrc(event.target.result)}" style="max-width:100%; border-radius:8px;">`;
    }
    console.log("Image attachment set");
  };
  reader.readAsDataURL(file);
}
function handleFileAttachment(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const binaryString = event.target.result;
    let base64 = "";
    const bytes = new Uint8Array(binaryString);
    for (let i = 0; i < bytes.byteLength; i++) {
      base64 += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(base64);
    currentAttachment = {
      type: "file",
      name: file.name,
      size: file.size,
      mimeType: file.type,
      data: base64
    };
    const preview = document.getElementById("attachment-file-preview");
    if (preview) {
      preview.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${esc(file.name)} (${(file.size / 1024).toFixed(2)} KB)`;
    }
    console.log("File attachment set");
  };
  reader.readAsArrayBuffer(file);
}
function addCurrentAttachmentToNewAssignment() {
  if (!currentAttachment) {
    const linkInput = document.getElementById("attachment-link-input");
    if (linkInput && linkInput.value) {
      newAssignmentAttachments.push({ type: "link", url: linkInput.value });
      linkInput.value = "";
    } else {
      alert("لا يوجد ملحق جاهز للإضافة");
      return;
    }
  } else {
    newAssignmentAttachments.push(currentAttachment);
    currentAttachment = null;
  }
  clearAttachment();
  renderNewAssignmentAttachmentsList();
}
function renderNewAssignmentAttachmentsList() {
  const list = document.getElementById("new-assignment-attachments-list");
  if (!list) return;
  if (newAssignmentAttachments.length === 0) {
    list.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات مضافة</small>';
    return;
  }
  list.innerHTML = "";
  newAssignmentAttachments.forEach((att, idx) => {
    let html = "";
    if (att.type === "image") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><img src="${safeImgSrc(att.data)}" style="max-width:120px; display:block; margin-bottom:6px;"><button class="btn-sm btn-delete" onclick="removeNewAssignmentAttachment(${Number(idx)})">إزالة</button></div>`;
    else if (att.type === "file") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${esc(att.name)}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadNewAssignmentFile(${Number(idx)})">⬇️ تحميل</button><button class="btn-sm btn-delete" onclick="removeNewAssignmentAttachment(${Number(idx)})">إزالة</button></div>`;
    else if (att.type === "link") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer">${esc(att.url)}</a> <button class="btn-sm btn-delete" onclick="removeNewAssignmentAttachment(${Number(idx)})">إزالة</button></div>`;
    const wr = document.createElement("div");
    wr.innerHTML = html;
    list.appendChild(wr);
  });
}
function removeNewAssignmentAttachment(i) {
  newAssignmentAttachments.splice(i, 1);
  renderNewAssignmentAttachmentsList();
}
function downloadNewAssignmentFile(i) {
  const att = newAssignmentAttachments[i];
  if (!att || att.type !== "file") return;
  const binaryString = atob(att.data.split(",")[1] || att.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let k = 0; k < binaryString.length; k++) bytes[k] = binaryString.charCodeAt(k);
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function clearAttachment() {
  currentAttachment = null;
  document.getElementById("attachment-image-section").style.display = "none";
  document.getElementById("attachment-link-section").style.display = "none";
  document.getElementById("attachment-file-section").style.display = "none";
  const imgInput = document.getElementById("attachment-image-input");
  const fileInput = document.getElementById("attachment-file-input");
  const linkInput = document.getElementById("attachment-link-input");
  if (imgInput) imgInput.value = "";
  if (fileInput) fileInput.value = "";
  if (linkInput) linkInput.value = "";
  document.getElementById("attachment-image-preview").innerHTML = "";
  document.getElementById("attachment-file-preview").innerHTML = "";
  console.log("Attachment cleared");
}
newNewsAttachments = [];
function addCurrentNewsAttachmentToNew() {
  if (!currentNewsAttachment) {
    const linkInput = document.getElementById("news-attachment-link-input");
    if (linkInput && linkInput.value) {
      newNewsAttachments.push({ type: "link", url: linkInput.value });
      linkInput.value = "";
    } else {
      alert("لا يوجد ملحق جاهز للإضافة");
      return;
    }
  } else {
    newNewsAttachments.push(currentNewsAttachment);
    currentNewsAttachment = null;
  }
  clearNewsAttachment();
  renderNewNewsAttachmentsList();
}
function renderNewNewsAttachmentsList() {
  const list = document.getElementById("new-news-attachments-list");
  if (!list) return;
  if (newNewsAttachments.length === 0) {
    list.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات مضافة</small>';
    return;
  }
  list.innerHTML = "";
  newNewsAttachments.forEach((att, idx) => {
    let html = "";
    if (att.type === "image") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><img src="${safeImgSrc(att.data)}" style="max-width:120px; display:block; margin-bottom:6px;"><button class="btn-sm btn-delete" onclick="removeNewNewsAttachment(${Number(idx)})">إزالة</button></div>`;
    else if (att.type === "file") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${esc(att.name)}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadNewNewsFile(${Number(idx)})">⬇️ تحميل</button><button class="btn-sm btn-delete" onclick="removeNewNewsAttachment(${Number(idx)})">إزالة</button></div>`;
    else if (att.type === "link") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer">${esc(att.url)}</a> <button class="btn-sm btn-delete" onclick="removeNewNewsAttachment(${Number(idx)})">إزالة</button></div>`;
    const wr = document.createElement("div");
    wr.innerHTML = html;
    list.appendChild(wr);
  });
}
function removeNewNewsAttachment(i) {
  newNewsAttachments.splice(i, 1);
  renderNewNewsAttachmentsList();
}
function downloadNewNewsFile(i) {
  const att = newNewsAttachments[i];
  if (!att || att.type !== "file") return;
  const binaryString = atob(att.data.split(",")[1] || att.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let k = 0; k < binaryString.length; k++) bytes[k] = binaryString.charCodeAt(k);
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function selectLinkAttachmentType(type) {
  try {
    const imgSec = document.getElementById("link-attachment-image-section");
    const linkSec = document.getElementById("link-attachment-link-section");
    const fileSec = document.getElementById("link-attachment-file-section");
    if (imgSec) imgSec.style.display = "none";
    if (linkSec) linkSec.style.display = "none";
    if (fileSec) fileSec.style.display = "none";
    if (type === "image") {
      if (imgSec) imgSec.style.display = "block";
      const imgInput = document.getElementById("link-attachment-image-input");
      if (imgInput) imgInput.onchange = handleLinkImageAttachment;
    } else if (type === "link") {
      if (linkSec) linkSec.style.display = "block";
    } else if (type === "file") {
      if (fileSec) fileSec.style.display = "block";
      const fileInput = document.getElementById("link-attachment-file-input");
      if (fileInput) fileInput.onchange = handleLinkFileAttachment;
    }
  } catch (e) {
    console.error("selectLinkAttachmentType error", e);
  }
}
function handleLinkImageAttachment(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    currentLinkAttachment = { type: "image", name: file.name, data: ev.target.result };
    const preview = document.getElementById("link-attachment-image-preview");
    if (preview) preview.innerHTML = `<img src="${safeImgSrc(ev.target.result)}" style="max-width:100%; border-radius:8px;">`;
  };
  reader.readAsDataURL(file);
}
function handleLinkFileAttachment(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const binaryString = ev.target.result;
    let base64 = "";
    const bytes = new Uint8Array(binaryString);
    for (let i = 0; i < bytes.byteLength; i++) base64 += String.fromCharCode(bytes[i]);
    base64 = btoa(base64);
    currentLinkAttachment = { type: "file", name: file.name, size: file.size, mimeType: file.type, data: base64 };
    const preview = document.getElementById("link-attachment-file-preview");
    if (preview) preview.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${esc(file.name)} (${(file.size / 1024).toFixed(2)} KB)`;
  };
  reader.readAsArrayBuffer(file);
}
function clearLinkAttachment() {
  currentLinkAttachment = null;
  const imgSec = document.getElementById("link-attachment-image-section");
  const linkSec = document.getElementById("link-attachment-link-section");
  const fileSec = document.getElementById("link-attachment-file-section");
  if (imgSec) imgSec.style.display = "none";
  if (linkSec) linkSec.style.display = "none";
  if (fileSec) fileSec.style.display = "none";
  const ii = document.getElementById("link-attachment-image-input");
  const fi = document.getElementById("link-attachment-file-input");
  const li = document.getElementById("link-attachment-link-input");
  if (ii) ii.value = "";
  if (fi) fi.value = "";
  if (li) li.value = "";
  const ip = document.getElementById("link-attachment-image-preview");
  const fp = document.getElementById("link-attachment-file-preview");
  if (ip) ip.innerHTML = "";
  if (fp) fp.innerHTML = "";
}
function addCurrentLinkAttachmentToNew() {
  if (!currentLinkAttachment) {
    const linkInput = document.getElementById("link-attachment-link-input");
    if (linkInput && linkInput.value) {
      newLinkAttachments.push({ type: "link", url: linkInput.value });
      linkInput.value = "";
    } else {
      alert("لا يوجد ملحق جاهز للإضافة");
      return;
    }
  } else {
    newLinkAttachments.push(currentLinkAttachment);
    currentLinkAttachment = null;
  }
  clearLinkAttachment();
  renderNewLinkAttachmentsList();
}
function renderNewLinkAttachmentsList() {
  const list = document.getElementById("new-link-attachments-list");
  if (!list) return;
  if (newLinkAttachments.length === 0) {
    list.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات مضافة</small>';
    return;
  }
  list.innerHTML = "";
  newLinkAttachments.forEach((att, idx) => {
    let html = "";
    if (att.type === "image") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><img src="${safeImgSrc(att.data)}" style="max-width:120px; display:block; margin-bottom:6px;"><button class="btn-sm btn-delete" onclick="removeNewLinkAttachment(${Number(idx)})">إزالة</button></div>`;
    else if (att.type === "file") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${esc(att.name)}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadNewLinkFile(${Number(idx)})">⬇️ تحميل</button><button class="btn-sm btn-delete" onclick="removeNewLinkAttachment(${Number(idx)})">إزالة</button></div>`;
    else if (att.type === "link") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer">${esc(att.url)}</a> <button class="btn-sm btn-delete" onclick="removeNewLinkAttachment(${Number(idx)})">إزالة</button></div>`;
    const wr = document.createElement("div");
    wr.innerHTML = html;
    list.appendChild(wr);
  });
}
function removeNewLinkAttachment(i) {
  newLinkAttachments.splice(i, 1);
  renderNewLinkAttachmentsList();
}
function downloadNewLinkFile(i) {
  const att = newLinkAttachments[i];
  if (!att || att.type !== "file") return;
  const binaryString = atob(att.data.split(",")[1] || att.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let k = 0; k < binaryString.length; k++) bytes[k] = binaryString.charCodeAt(k);
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function addAssignment() {
  const text = document.getElementById("new-assignment-text").value;
  console.log("addAssignment called, section=", selectedSection, "text=", text);
  if (text) {
    if (!appData.assignments[selectedSection]) appData.assignments[selectedSection] = [];
    const dateInput = document.getElementById("new-assignment-date") ? document.getElementById("new-assignment-date").value : "";
    const subjInput = document.getElementById("new-assignment-subject") ? document.getElementById("new-assignment-subject").value : "";
    const dateVal = dateInput ? new Date(dateInput).getTime() : Date.now();
    const attachments = Array.isArray(newAssignmentAttachments) ? newAssignmentAttachments.slice() : [];
    if (currentAttachment) {
      attachments.push(currentAttachment);
      currentAttachment = null;
    }
    const linkInputPending = document.getElementById("attachment-link-input");
    if (linkInputPending && linkInputPending.value) {
      attachments.push({ type: "link", url: linkInputPending.value });
      linkInputPending.value = "";
    }
    const folderId = document.getElementById("new-assignment-folder") ? document.getElementById("new-assignment-folder").value : "";
    const assignmentObj = {
      id: Date.now(),
      text,
      done: false,
      date: dateVal,
      subject: subjInput || "",
      attachments,
      folderId: folderId || ""
    };
    appData.assignments[selectedSection].push(assignmentObj);
    document.getElementById("new-assignment-text").value = "";
    if (document.getElementById("new-assignment-date")) document.getElementById("new-assignment-date").value = "";
    if (document.getElementById("new-assignment-subject")) document.getElementById("new-assignment-subject").value = "";
    clearAttachment();
    newAssignmentAttachments = [];
    renderNewAssignmentAttachmentsList();
    saveData();
    render();
    try {
      renderAssignments();
    } catch (e) {
      console.warn("renderAssignments error", e);
    }
  }
}
function toggleTask(index) {
  appData.assignments[selectedSection][index].done = !appData.assignments[selectedSection][index].done;
  saveData();
  render();
}
function updateTaskText(index, val) {
  appData.assignments[selectedSection][index].text = val;
  saveData();
  render();
}
function deleteTask(index) {
  if (confirm("هل أنت متأكد من حذف هذا الواجب؟")) {
    appData.assignments[selectedSection].splice(index, 1);
    saveData();
    render();
  }
}
function closeImageViewer() {
  const v = document.getElementById("img-viewer");
  if (v && v._cleanup) v._cleanup();
  if (v) v.remove();
  document.body.classList.remove("iv-open");
}
function viewImage(imageSrc) {
  closeImageViewer();
  const raw = safeUrl(imageSrc);
  if (!raw || !/^(https?:|data:image\/|blob:)/i.test(raw)) return;
  const ov = document.createElement("div");
  ov.id = "img-viewer";
  ov.className = "img-viewer";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.innerHTML = '<div class="iv-bar" dir="ltr"><button type="button" class="iv-btn iv-close" data-a="close" aria-label="إغلاق">✕</button><div class="iv-tools"><button type="button" class="iv-btn" data-a="out" aria-label="تصغير">−</button><span class="iv-level" id="iv-level">100%</span><button type="button" class="iv-btn" data-a="in" aria-label="تكبير">+</button><button type="button" class="iv-btn iv-wide" data-a="fit">كامل الصورة</button><button type="button" class="iv-btn iv-wide" data-a="width">عرض الشاشة</button></div></div><div class="iv-stage" dir="ltr"><div class="iv-canvas"><img class="iv-img" alt="" draggable="false"></div></div>';
  document.body.appendChild(ov);
  document.body.classList.add("iv-open");
  const stage = ov.querySelector(".iv-stage");
  const canvas = ov.querySelector(".iv-canvas");
  const img = ov.querySelector(".iv-img");
  const level = ov.querySelector("#iv-level");
  let scale = 1, fitScale = 1, minScale = 1, maxScale = 4, ready = false;
  function metrics() {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
    fitScale = Math.min(sw / nw, sh / nh, 1);
    minScale = fitScale;
    maxScale = Math.max(fitScale * 10, 4);
  }
  function apply() {
    img.style.width = img.naturalWidth * scale + "px";
    level.textContent = Math.round(scale / fitScale * 100) + "%";
  }
  function setScale(next, cx, cy) {
    next = Math.max(minScale, Math.min(maxScale, next));
    if (cx === void 0) {
      cx = stage.clientWidth / 2;
      cy = stage.clientHeight / 2;
    }
    const oldW = canvas.scrollWidth || 1, oldH = canvas.scrollHeight || 1;
    const rx = (stage.scrollLeft + cx) / oldW, ry = (stage.scrollTop + cy) / oldH;
    scale = next;
    apply();
    stage.scrollLeft = rx * canvas.scrollWidth - cx;
    stage.scrollTop = ry * canvas.scrollHeight - cy;
  }
  function fitAll() {
    scale = fitScale;
    apply();
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
  }
  function fitWidth() {
    scale = Math.max(minScale, Math.min(maxScale, stage.clientWidth / (img.naturalWidth || 1)));
    apply();
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
  }
  function init() {
    metrics();
    scale = fitScale;
    apply();
    ready = true;
  }
  img.onload = init;
  img.onerror = () => {
    canvas.innerHTML = '<p class="iv-error">تعذر عرض الصورة</p>';
  };
  img.src = raw;
  if (img.complete && img.naturalWidth) init();
  ov.querySelector(".iv-bar").addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]");
    if (!a || !ready) {
      if (a && a.dataset.a === "close") closeImageViewer();
      return;
    }
    const k = a.dataset.a;
    if (k === "close") closeImageViewer();
    else if (k === "in") setScale(scale * 1.35);
    else if (k === "out") setScale(scale / 1.35);
    else if (k === "fit") fitAll();
    else if (k === "width") fitWidth();
  });
  stage.addEventListener("wheel", (e) => {
    if (!ready || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    setScale(scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  stage.addEventListener("dblclick", (e) => {
    if (!ready) return;
    const r = stage.getBoundingClientRect();
    if (scale <= fitScale * 1.05) setScale(Math.max(fitScale * 2.5, stage.clientWidth / (img.naturalWidth || 1)), e.clientX - r.left, e.clientY - r.top);
    else fitAll();
  });
  let pinch = null;
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2 && ready) {
      pinch = { d: dist(e.touches), s: scale };
    }
  }, { passive: true });
  stage.addEventListener("touchmove", (e) => {
    if (pinch && e.touches.length === 2) {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      setScale(pinch.s * dist(e.touches) / pinch.d, cx, cy);
    }
  }, { passive: false });
  stage.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinch = null;
  }, { passive: true });
  let drag = null, moved = false;
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop };
    moved = false;
  });
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  function onMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      moved = true;
      stage.classList.add("grabbing");
    }
    stage.scrollLeft = drag.l - dx;
    stage.scrollTop = drag.t - dy;
  }
  function onUp() {
    drag = null;
    stage.classList.remove("grabbing");
  }
  stage.addEventListener("click", (e) => {
    if (moved) {
      moved = false;
      return;
    }
    if (e.target === img) return;
    if (scale <= fitScale * 1.05) closeImageViewer();
  });
  function onKey(e) {
    if (e.key === "Escape") closeImageViewer();
    else if (e.key === "+" || e.key === "=") setScale(scale * 1.35);
    else if (e.key === "-") setScale(scale / 1.35);
    else if (e.key === "0") fitAll();
  }
  function onResize() {
    if (!ready) return;
    const was = scale <= fitScale * 1.01;
    metrics();
    if (was) scale = fitScale;
    else scale = Math.max(minScale, Math.min(maxScale, scale));
    apply();
  }
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  ov._cleanup = () => {
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };
}
window.closeImageViewer = closeImageViewer;
function downloadFile(taskIndex, fileName) {
  const task = appData.assignments[selectedSection][taskIndex];
  if (!task || !task.attachment || task.attachment.type !== "file") return;
  let data;
  if (task.attachment.data instanceof ArrayBuffer) {
    data = new Blob([task.attachment.data]);
  } else {
    const binaryString = atob(task.attachment.data.split(",")[1] || task.attachment.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    data = new Blob([bytes]);
  }
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
const currentProgressAttachment = {};
function escapeId(s) {
  return String(s).replace(/[^a-z0-9]/gi, "_");
}
function escapeJs(s) {
  return jsAttr(s);
}
function selectProgressAttachmentType(subject, type) {
  const id = escapeId(subject);
  const imgSec = document.getElementById(`progress-attach-image-section-${id}`);
  const linkSec = document.getElementById(`progress-attach-link-section-${id}`);
  const fileSec = document.getElementById(`progress-attach-file-section-${id}`);
  if (imgSec) imgSec.style.display = "none";
  if (linkSec) linkSec.style.display = "none";
  if (fileSec) fileSec.style.display = "none";
  if (type === "image") {
    if (imgSec) imgSec.style.display = "block";
    const inp = document.getElementById(`progress-attachment-image-input-${id}`);
    if (inp) inp.onchange = function(e) {
      handleProgressImageAttachment(e, subject);
    };
  } else if (type === "link") {
    if (linkSec) linkSec.style.display = "block";
  } else if (type === "file") {
    if (fileSec) fileSec.style.display = "block";
    const inp = document.getElementById(`progress-attachment-file-input-${id}`);
    if (inp) inp.onchange = function(e) {
      handleProgressFileAttachment(e, subject);
    };
  }
}
function handleProgressImageAttachment(e, subject) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    currentProgressAttachment[subject] = { type: "image", name: file.name, data: ev.target.result };
    const pv = document.getElementById(`progress-attachment-image-preview-${escapeId(subject)}`);
    if (pv) pv.innerHTML = `<img src="${safeImgSrc(ev.target.result)}" style="max-width:120px; border-radius:6px;">`;
  };
  reader.readAsDataURL(file);
}
function handleProgressFileAttachment(e, subject) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const binary = ev.target.result;
    let base64 = "";
    const bytes = new Uint8Array(binary);
    for (let i = 0; i < bytes.byteLength; i++) base64 += String.fromCharCode(bytes[i]);
    base64 = btoa(base64);
    currentProgressAttachment[subject] = { type: "file", name: file.name, size: file.size, mimeType: file.type, data: base64 };
    const pv = document.getElementById(`progress-attachment-file-preview-${escapeId(subject)}`);
    if (pv) pv.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${esc(file.name)} (${(file.size / 1024).toFixed(2)} KB)`;
  };
  reader.readAsArrayBuffer(file);
}
function addCurrentProgressAttachmentToSubject(subject) {
  if (!appData.progress[selectedSection]) appData.progress[selectedSection] = {};
  if (!appData.progress[selectedSection][subject]) appData.progress[selectedSection][subject] = { current: 0, total: 10, lessonName: "" };
  const attachments = appData.progress[selectedSection][subject].attachments = appData.progress[selectedSection][subject].attachments || [];
  const id = escapeId(subject);
  const linkInput = document.getElementById(`progress-attachment-link-input-${id}`);
  if (!currentProgressAttachment[subject]) {
    if (linkInput && linkInput.value) {
      attachments.push({ type: "link", url: linkInput.value });
      linkInput.value = "";
    } else {
      alert("لا يوجد ملحق جاهز للإضافة");
      return;
    }
  } else {
    attachments.push(currentProgressAttachment[subject]);
    delete currentProgressAttachment[subject];
  }
  const imgSec = document.getElementById(`progress-attach-image-section-${id}`);
  const linkSec = document.getElementById(`progress-attach-link-section-${id}`);
  const fileSec = document.getElementById(`progress-attach-file-section-${id}`);
  if (imgSec) imgSec.style.display = "none";
  if (linkSec) linkSec.style.display = "none";
  if (fileSec) fileSec.style.display = "none";
  const imgIn = document.getElementById(`progress-attachment-image-input-${id}`);
  if (imgIn) imgIn.value = "";
  const fileIn = document.getElementById(`progress-attachment-file-input-${id}`);
  if (fileIn) fileIn.value = "";
  saveData();
  renderProgressAttachments(subject);
}
function renderProgressAttachments(subject) {
  const id = escapeId(subject);
  const container = document.getElementById(`progress-attachments-${id}`);
  if (!container) return;
  const data = appData.progress[selectedSection] && appData.progress[selectedSection][subject] || {};
  const list = data.attachments || [];
  if (list.length === 0) {
    container.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات</small>';
    return;
  }
  container.innerHTML = "";
  list.forEach((att, idx) => {
    let html = "";
    if (att.type === "image") html = `<div style="display:inline-block; margin:6px; background:#fff; padding:6px; border-radius:6px;"><img src="${safeImgSrc(att.data)}" style="max-width:100px; display:block; margin-bottom:6px;"><div style="text-align:center;"><button class="btn-sm btn-delete" onclick="removeProgressAttachment('${escapeJs(subject)}', ${idx})">إزالة</button></div></div>`;
    else if (att.type === "file") html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${esc(att.name)}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadProgressFile('${escapeJs(subject)}', ${Number(idx)})">⬇️ تحميل</button>${isEditMode ? `<button class="btn-sm btn-delete" onclick="removeProgressAttachment('${escapeJs(subject)}', ${idx})">إزالة</button>` : ""}</div>`;
    else if (att.type === "link") html = `<div style="padding:6px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer">${esc(att.url)}</a> ${isEditMode ? `<button class="btn-sm btn-delete" onclick="removeProgressAttachment('${escapeJs(subject)}', ${idx})">إزالة</button>` : ""}</div>`;
    const wr = document.createElement("div");
    wr.innerHTML = html;
    container.appendChild(wr);
  });
}
function removeProgressAttachment(subject, idx) {
  if (!confirm("هل تريد حذف هذا الملحق؟")) return;
  const data = appData.progress[selectedSection] && appData.progress[selectedSection][subject] || {};
  if (!data.attachments || !Array.isArray(data.attachments)) return;
  data.attachments.splice(idx, 1);
  saveData();
  renderProgressAttachments(subject);
}
function downloadProgressFile(subject, idx) {
  const data = appData.progress[selectedSection] && appData.progress[selectedSection][subject] || {};
  const att = data.attachments && data.attachments[idx];
  if (!att || att.type !== "file") return;
  const binaryString = atob(att.data.split(",")[1] || att.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let k = 0; k < binaryString.length; k++) bytes[k] = binaryString.charCodeAt(k);
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function renderSupport() {
  const container = document.getElementById("support-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع أرقام الدعم";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllItems("أرقام الدعم", () => appData.support);
    container.appendChild(clear);
  }
  appData.support.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${esc(item.name)}</h3>
                            <input class="editable-field editable-input" value="${esc(item.name)}" onchange="updateSupport(${Number(index)}, 'name', this.value)">
                            <p class="editable-value rich-text" style="color:gray; font-size:0.9rem">${esc(item.role)}</p>
                            <input class="editable-field editable-input" value="${esc(item.role)}" onchange="updateSupport(${Number(index)}, 'role', this.value)">
                        </div>
                        <div style="text-align:left;">
                            ${safePhone(item.phone) ? `<a href="https://wa.me/${esc(safePhone(item.phone).replace(/^\+/, ""))}" target="_blank" rel="noopener noreferrer" class="btn-link editable-value">تواصل</a>` : ``}
                            <input class="editable-field editable-input" value="${esc(item.phone)}" onchange="updateSupport(${Number(index)}, 'phone', this.value)">
                        </div>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteSupport(${index})">حذف جهة الاتصال</button>
                `;
    container.appendChild(div);
  });
}
function addSupport() {
  const name = document.getElementById("new-support-name").value;
  const role = document.getElementById("new-support-role").value;
  const phone = document.getElementById("new-support-num").value;
  if (name && phone) {
    appData.support.push({ id: Date.now(), name, role, phone });
    document.getElementById("new-support-name").value = "";
    document.getElementById("new-support-role").value = "";
    document.getElementById("new-support-num").value = "";
    saveData();
    render();
  }
}
function updateSupport(index, key, val) {
  appData.support[index][key] = val;
  saveData();
  render();
}
function deleteSupport(index) {
  if (confirm("حذف جهة الاتصال؟")) {
    appData.support.splice(index, 1);
    saveData();
    render();
  }
}
function renderSummaries() {
  const container = document.getElementById("summaries-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع التلخيصات والملفات";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllItems("التلخيصات والملفات", () => appData.summaries);
    container.appendChild(clear);
  }
  appData.summaries.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value rich-text">${esc(item.title)}</h3>
                            <input class="editable-field editable-input" value="${esc(item.title)}" onchange="updateSummary(${Number(index)}, 'title', this.value)">
                        </div>
                        ${safeUrl(item.link) ? `<a href="${safeUrlAttr(item.link)}" target="_blank" rel="noopener noreferrer" class="btn-link editable-value">تحميل ⬇️</a>` : ``}
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${esc(item.link)}" placeholder="رابط الملف" onchange="updateSummary(${Number(index)}, 'link', this.value)">
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteSummary(${index})">حذف الملف</button>
                `;
    container.appendChild(div);
  });
}
function addSummary() {
  const title = document.getElementById("new-summ-title").value;
  const link = document.getElementById("new-summ-link").value;
  if (title && link) {
    appData.summaries.push({ id: Date.now(), title, link });
    document.getElementById("new-summ-title").value = "";
    document.getElementById("new-summ-link").value = "";
    saveData();
    render();
  }
}
function updateSummary(index, key, val) {
  appData.summaries[index][key] = val;
  saveData();
  render();
}
function deleteSummary(index) {
  if (confirm("حذف الملف؟")) {
    appData.summaries.splice(index, 1);
    saveData();
    render();
  }
}
function formatTime12(time24) {
  if (!time24) return "";
  if (typeof time24 === "number") {
    const d = new Date(time24);
    let h = d.getHours();
    const m2 = String(d.getMinutes()).padStart(2, "0");
    const ampm2 = h >= 12 ? "م" : "ص";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m2} ${ampm2}`;
  }
  const m = String(time24).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time24;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ampm = hh >= 12 ? "م" : "ص";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${mm} ${ampm}`;
}
const WEEK_DAYS_AR = [["Saturday", "السبت"], ["Sunday", "الأحد"], ["Monday", "الاثنين"], ["Tuesday", "الثلاثاء"], ["Wednesday", "الأربعاء"], ["Thursday", "الخميس"], ["Friday", "الجمعة"]];
function currentWeekDayKey() {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][(/* @__PURE__ */ new Date()).getDay()];
}
function ensureWeeklyModel() {
  appData.weeklySchedule = appData.weeklySchedule || {};
  WEEK_DAYS_AR.forEach(([d]) => {
    appData.weeklySchedule[d] = appData.weeklySchedule[d] || {};
    for (let i = 1; i <= appData.sections; i++) {
      const cur = appData.weeklySchedule[d][i];
      if (Array.isArray(cur)) continue;
      const arr = [];
      if (cur && typeof cur === "object") Object.entries(cur).forEach(([subject, e]) => arr.push({ id: Date.now() + Math.random(), subject, teacher: "", from: (e == null ? void 0 : e.from) || "", to: (e == null ? void 0 : e.to) || "", link: (e == null ? void 0 : e.link) || "", note: (e == null ? void 0 : e.note) || "" }));
      appData.weeklySchedule[d][i] = arr;
    }
  });
}
function getWeeklyEntries(day, sec) {
  var _a, _b;
  ensureWeeklyModel();
  return ((_b = (_a = appData.weeklySchedule) == null ? void 0 : _a[day]) == null ? void 0 : _b[sec]) || [];
}
function getEffectiveLiveLinks() {
  const today = currentWeekDayKey();
  const direct = appData.liveLinks && appData.liveLinks[selectedSection] || {};
  if (Object.keys(direct).length) return { links: direct, source: "today" };
  if (appData.weeklyScheduleEnabled) {
    const links = {};
    getWeeklyEntries(today, selectedSection).forEach((e) => {
      if (e && e.subject) links[e.subject] = { link: e.link || "", from: e.from || "", to: e.to || "", note: e.note || "", teacher: e.teacher || "" };
    });
    if (Object.keys(links).length) return { links, source: "weekly" };
  }
  return { links: {}, source: "none" };
}
function effectiveSourceLabel(s) {
  return "";
}
function renderWeeklySchedule() {
  const box = document.getElementById("weekly-schedule-list");
  if (!box) return;
  ensureWeeklyModel();
  const day = (document.getElementById("weekly-day-select") || {}).value || currentWeekDayKey();
  const sec = Number((document.getElementById("weekly-section-select") || {}).value || selectedSection);
  const entries = getWeeklyEntries(day, sec);
  box.innerHTML = "";
  const toolbar = document.createElement("div");
  toolbar.className = "schedule-toolbar";
  toolbar.innerHTML = '<div><label>اليوم</label><select id="weekly-day-select" class="editable-input">' + WEEK_DAYS_AR.map((x) => '<option value="' + x[0] + '" ' + (day === x[0] ? "selected" : "") + ">" + x[1] + "</option>").join("") + '</select></div><div><label>الشعبة</label><select id="weekly-section-select" class="editable-input">' + Array.from({ length: appData.sections }, (_, i) => '<option value="' + (i + 1) + '" ' + (sec === i + 1 ? "selected" : "") + ">" + escapeHtml(getSectionLabel(i + 1)) + "</option>").join("") + '</select></div><label class="admin-check"><input id="weekly-enabled-toggle" type="checkbox" ' + (appData.weeklyScheduleEnabled ? "checked" : "") + "> تفعيل الجدول الأسبوعي</label>";
  box.appendChild(toolbar);
  toolbar.querySelector("#weekly-day-select").onchange = renderWeeklySchedule;
  toolbar.querySelector("#weekly-section-select").onchange = renderWeeklySchedule;
  toolbar.querySelector("#weekly-enabled-toggle").onchange = (e) => toggleWeeklySchedule(e.target.checked);
  const note = document.createElement("div");
  note.className = "notice";
  note.textContent = "حصص كل يوم تتكرر كل أسبوع، ويمكن إضافة أكثر من حصة في اليوم.";
  box.appendChild(note);
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع حصص هذا اليوم للشعبة";
    clear.style.margin = "10px 0";
    clear.onclick = () => {
      if (!entries.length) {
        alert("لا توجد حصص لحذفها لهذا اليوم.");
        return;
      }
      if (!confirm("هل أنت متأكد من حذف جميع حصص هذا اليوم للشعبة الحالية؟ لا يمكن التراجع عن هذا الإجراء.")) return;
      entries.splice(0, entries.length);
      saveData();
      renderWeeklySchedule();
    };
    box.appendChild(clear);
  }
  const list = document.createElement("div");
  list.className = "schedule-list";
  entries.forEach((e, i) => {
    const row = document.createElement("div");
    row.className = "schedule-row";
    row.innerHTML = '<div class="schedule-index">' + (i + 1) + '</div><div><div class="schedule-grid-fields"><input class="editable-input" value="' + escapeHtml(e.subject || "") + '" placeholder="المادة"><input class="editable-input" value="' + escapeHtml(e.teacher || "") + '" placeholder="المعلم (اختياري)"><input type="time" class="editable-input" value="' + (e.from || "") + '"><input type="time" class="editable-input" value="' + (e.to || "") + '"><input class="editable-input full" value="' + escapeHtml(e.link || "") + '" placeholder="رابط الحصة (اختياري)"><input class="editable-input full" value="' + escapeHtml(e.note || "") + '" placeholder="ملاحظة (اختياري)"></div><div class="schedule-actions"><button class="btn-sm btn-add">حفظ</button><button class="btn-sm btn-delete">حذف</button></div></div>';
    const inp = row.querySelectorAll("input");
    row.querySelector(".btn-add").onclick = () => {
      e.subject = inp[0].value.trim();
      e.teacher = inp[1].value.trim();
      e.from = inp[2].value;
      e.to = inp[3].value;
      e.link = inp[4].value.trim();
      e.note = inp[5].value.trim();
      saveData();
      renderWeeklySchedule();
    };
    row.querySelector(".btn-delete").onclick = () => {
      entries.splice(i, 1);
      saveData();
      renderWeeklySchedule();
    };
    list.appendChild(row);
  });
  const add = document.createElement("div");
  add.className = "schedule-add";
  add.innerHTML = "<h4>إضافة حصة إلى " + escapeHtml(getSectionLabel(sec)) + " — " + escapeHtml((WEEK_DAYS_AR.find((x) => x[0] === day) || ["", day])[1]) + '</h4><div class="schedule-grid-fields"><input id="ws-subject" class="editable-input" placeholder="المادة"><input id="ws-teacher" class="editable-input" placeholder="المعلم (اختياري)"><input id="ws-from" type="time" class="editable-input"><input id="ws-to" type="time" class="editable-input"><input id="ws-link" class="editable-input full" placeholder="رابط الحصة (اختياري)"><input id="ws-note" class="editable-input full" placeholder="ملاحظة (اختياري)"></div><button class="btn-add btn-sm" onclick="weeklyAddNew()">+ إضافة الحصة</button>';
  list.appendChild(add);
  box.appendChild(list);
}
function weeklyAddNew() {
  if (!window.IS_ADMIN) return;
  const item = { id: Date.now(), subject: (document.getElementById("ws-subject").value || "").trim(), teacher: (document.getElementById("ws-teacher").value || "").trim(), from: document.getElementById("ws-from").value, to: document.getElementById("ws-to").value, link: (document.getElementById("ws-link").value || "").trim(), note: (document.getElementById("ws-note").value || "").trim() };
  if (!item.subject) return alert("اكتب اسم المادة أولاً.");
  const day = document.getElementById("weekly-day-select").value, sec = Number(document.getElementById("weekly-section-select").value);
  getWeeklyEntries(day, sec).push(item);
  saveData();
  renderWeeklySchedule();
}
function toggleWeeklySchedule(v) {
  if (!window.IS_ADMIN) return;
  appData.weeklyScheduleEnabled = !!v;
  saveData();
  renderWeeklySchedule();
}
function renderLiveLinks() {
  const container = document.getElementById("live-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع روابط الحصص للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => {
      if (!confirm("هل أنت متأكد من حذف جميع روابط الحصص في الشعبة الحالية؟ لا يمكن التراجع عن هذا الإجراء.")) return;
      appData.liveLinks[selectedSection] = {};
      saveData();
      renderLiveLinks();
    };
    container.appendChild(clear);
  }
  const effective = getEffectiveLiveLinks();
  const banner = document.createElement("div");
  if (effectiveSourceLabel(effective.source)) {
    banner.className = "notice";
    banner.style.cssText = "padding:10px 12px;margin-bottom:12px;";
    banner.textContent = effectiveSourceLabel(effective.source);
    container.appendChild(banner);
  }
  const links = effective.links || {};
  const keys = Object.keys(links);
  if (keys.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا توجد روابط مسجلة لهذه الشعبة حالياً. أضف مادة جديدة أدناه.</p>');
  }
  keys.forEach((sub) => {
    const entry = links[sub] && typeof links[sub] === "object" ? links[sub] : { link: "", from: "", to: "" };
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
                    <div class="data-header">
                        <h3 class="lesson-name">${esc(sub)}</h3>
                        ${safeUrl(entry.link) ? `<a href="${safeUrlAttr(entry.link)}" target="_blank" rel="noopener noreferrer" class="btn-link editable-value">دخول الحصة 🎉</a>` : '<span class="editable-value" style="color:gray">لا يوجد رابط</span>'}
                        ${entry.note ? `<div class="editable-value rich-text" style="color:var(--text-light); margin-top:6px;">${esc(entry.note)}</div>` : ""}
                        <p class="editable-value session-info">موعد الحصة: ${esc(entry.from ? formatTime12(entry.from) : "--")} إلى ${esc(entry.to ? formatTime12(entry.to) : "--")}</p>
                    </div>
                    <div class="editable-field">
                        <label>اسم المادة:</label>
                        <input type="text" class="editable-input" value="${esc(sub)}" onchange="renameLiveSubject('${escapeForJs(sub)}', this.value)">
                        <label style="margin-top:8px;">رابط الحصة:</label>
                        <input type="text" class="editable-input" value="${esc(entry.link)}" placeholder="الصق الرابط هنا" onchange="updateLiveLink('${escapeForJs(sub)}', 'link', this.value)">
                        <label style="margin-top:8px;">ملاحظة عن الحصة (اختياري):</label>
                        <textarea class="editable-input" onchange="updateLiveLink('${escapeForJs(sub)}', 'note', this.value)" style="min-height:60px;">${esc(entry.note || "")}</textarea>
                        <div style="display:flex; gap:10px; margin-top:8px;">
                            <div style="flex:1">
                                <label>من:</label>
                                <input type="time" class="editable-input" value="${esc(entry.from)}" onchange="updateLiveLink('${escapeForJs(sub)}', 'from', this.value)">
                            </div>
                            <div style="flex:1">
                                <label>إلى:</label>
                                <input type="time" class="editable-input" value="${esc(entry.to)}" onchange="updateLiveLink('${escapeForJs(sub)}', 'to', this.value)">
                            </div>
                        </div>
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <button class="btn-sm btn-delete" onclick="deleteLiveEntry('${escapeForJs(sub)}')">حذف هذه المادة من الشعبة</button>
                        </div>
                    </div>
                `;
    container.appendChild(div);
  });
  const addBox = document.createElement("div");
  addBox.className = "add-new-container";
  addBox.innerHTML = `
                <h4>إضافة رابط حصّة جديد</h4>
                <input type="text" id="new-live-subject" class="editable-input" placeholder="اسم المادة (مثلاً: الرياضيات)" style="margin-bottom:8px;">
                <input type="text" id="new-live-link" class="editable-input" placeholder="رابط الحصة (https://...)" style="margin-bottom:8px;">
                <label style="margin-top:6px;">ملاحظة عن الحصة (اختياري):</label>
                <input type="text" id="new-live-note" class="editable-input" placeholder="اكتب ملاحظة قصيرة هنا" style="margin-bottom:8px;">
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <input type="time" id="new-live-from" class="editable-input" style="flex:1">
                    <input type="time" id="new-live-to" class="editable-input" style="flex:1">
                </div>
                <button class="btn-sm btn-add" onclick="addLiveEntry()">إضافة</button>
            `;
  container.appendChild(addBox);
}
function escapeForJs(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\"/g, '\\"');
}
function updateLiveLink(subject, key, val) {
  if (!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
  let cur = appData.liveLinks[selectedSection][subject];
  if (!cur || typeof cur !== "object") cur = { link: "", from: "", to: "", note: "" };
  cur[key] = val;
  appData.liveLinks[selectedSection][subject] = cur;
  saveData();
  render();
}
function addLiveEntry() {
  const name = (document.getElementById("new-live-subject") || {}).value || "";
  const link = (document.getElementById("new-live-link") || {}).value || "";
  const note = (document.getElementById("new-live-note") || {}).value || "";
  const from = (document.getElementById("new-live-from") || {}).value || "";
  const to = (document.getElementById("new-live-to") || {}).value || "";
  const subject = name.trim();
  if (!subject) {
    alert("ادخل اسم المادة أولاً");
    return;
  }
  if (!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
  if (appData.liveLinks[selectedSection][subject]) {
    if (!confirm("هناك مادة بنفس الاسم في الشعبة الحالية. هل تريد استبدالها؟")) return;
  }
  appData.liveLinks[selectedSection][subject] = { link: link.trim(), from, to, note: note.trim() };
  saveData();
  render();
  try {
    document.getElementById("new-live-subject").value = "";
    document.getElementById("new-live-link").value = "";
    document.getElementById("new-live-note").value = "";
    document.getElementById("new-live-from").value = "";
    document.getElementById("new-live-to").value = "";
  } catch (e) {
  }
}
function renameLiveSubject(oldName, newName) {
  const newN = (newName || "").trim();
  if (!newN) {
    alert("اسم المادة لا يمكن أن يكون فارغاً");
    render();
    return;
  }
  if (!appData.liveLinks[selectedSection] || !appData.liveLinks[selectedSection][oldName]) {
    render();
    return;
  }
  if (oldName === newN) return;
  if (appData.liveLinks[selectedSection][newN]) {
    alert("هناك مادة بنفس الاسم موجودة بالفعل في هذه الشعبة");
    render();
    return;
  }
  appData.liveLinks[selectedSection][newN] = appData.liveLinks[selectedSection][oldName];
  delete appData.liveLinks[selectedSection][oldName];
  saveData();
  render();
}
function deleteLiveEntry(subject) {
  if (!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
  if (!confirm("هل تريد حذف هذه المادة من الشعبة الحالية؟")) return;
  delete appData.liveLinks[selectedSection][subject];
  saveData();
  render();
}
function deleteLiveLink(subject) {
  if (!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
  if (confirm("هل تريد حذف رابط هذه المادة في الشعبة الحالية؟")) {
    try {
      delete appData.liveLinks[selectedSection][subject];
    } catch (e) {
      appData.liveLinks[selectedSection][subject] = void 0;
    }
    saveData();
    render();
  }
}
function openManageSubjects() {
  if (!window.IS_OWNER) return;
  let modal = document.getElementById("subject-manager-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "subject-manager-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = '<div class="modal-box subject-manager"><div class="modal-head"><h3>إدارة المواد</h3><button class="modal-close" aria-label="إغلاق">×</button></div><div id="subject-manager-list" class="management-list"></div><div class="modal-form"><input id="new-subject-name" class="editable-input" placeholder="اسم المادة"><button class="btn-add btn-sm" id="subject-add-btn">إضافة مادة</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector(".modal-close").onclick = () => modal.remove();
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    modal.querySelector("#subject-add-btn").onclick = () => {
      addSubject();
      renderSubjectManager();
    };
  }
  renderSubjectManager();
  modal.classList.add("open");
}
function renderSubjectManager() {
  const box = document.getElementById("subject-manager-list");
  if (!box) return;
  if (!appData.subjects.length) {
    box.innerHTML = '<div class="notice">لا توجد مواد بعد.</div>';
    return;
  }
  box.innerHTML = appData.subjects.map((subject, i) => '<div class="management-row"><span class="subject-name">' + escapeHtml(subject) + '</span><button class="btn-delete btn-sm" onclick="deleteSubject(' + JSON.stringify(subject) + ');renderSubjectManager();">حذف</button></div>').join("");
}
function deleteSubject(subject) {
  if (!confirm("هل أنت متأكد من حذف المادة نهائياً من جميع الشعب؟ هذه الخطوة ستحذف التقدم والروابط الخاصة بالمادة.")) return;
  const idx = appData.subjects.indexOf(subject);
  if (idx > -1) appData.subjects.splice(idx, 1);
  for (let i = 1; i <= appData.sections; i++) {
    if (appData.progress && appData.progress[i]) delete appData.progress[i][subject];
    if (appData.liveLinks && appData.liveLinks[i]) delete appData.liveLinks[i][subject];
  }
  saveData();
  render();
}
function addSubject() {
  const name = document.getElementById("new-subject-name").value.trim();
  if (!name) return;
  if (appData.subjects.includes(name)) {
    alert("المادة موجودة مسبقاً");
    return;
  }
  appData.subjects.push(name);
  for (let i = 1; i <= appData.sections; i++) {
    if (!appData.progress[i]) appData.progress[i] = {};
    appData.progress[i][name] = { current: 1, total: 20 };
    if (!appData.liveLinks[i]) appData.liveLinks[i] = {};
    appData.liveLinks[i][name] = { link: "", from: "", to: "" };
  }
  document.getElementById("new-subject-name").value = "";
  saveData();
  render();
}
function selectNewsAttachmentType(type) {
  console.log("selectNewsAttachmentType called with type:", type);
  try {
    const imgSec = document.getElementById("news-attachment-image-section");
    const linkSec = document.getElementById("news-attachment-link-section");
    const fileSec = document.getElementById("news-attachment-file-section");
    if (imgSec) imgSec.style.display = "none";
    if (linkSec) linkSec.style.display = "none";
    if (fileSec) fileSec.style.display = "none";
    if (type === "image") {
      if (imgSec) {
        imgSec.style.display = "block";
        console.log("News image section shown");
      }
      const imgInput = document.getElementById("news-attachment-image-input");
      if (imgInput) {
        imgInput.onchange = handleNewsImageAttachment;
      }
    } else if (type === "link") {
      if (linkSec) {
        linkSec.style.display = "block";
        console.log("News link section shown");
      }
    } else if (type === "file") {
      if (fileSec) {
        fileSec.style.display = "block";
        console.log("News file section shown");
      }
      const fileInput = document.getElementById("news-attachment-file-input");
      if (fileInput) {
        fileInput.onchange = handleNewsFileAttachment;
      }
    }
  } catch (e) {
    console.error("selectNewsAttachmentType error:", e);
  }
}
function handleNewsImageAttachment(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    currentNewsAttachment = {
      type: "image",
      name: file.name,
      data: event.target.result
    };
    const preview = document.getElementById("news-attachment-image-preview");
    if (preview) {
      preview.innerHTML = `<img src="${safeImgSrc(event.target.result)}" style="max-width:100%; border-radius:8px;">`;
    }
    console.log("News image attachment set");
  };
  reader.readAsDataURL(file);
}
function handleNewsFileAttachment(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const binaryString = event.target.result;
    let base64 = "";
    const bytes = new Uint8Array(binaryString);
    for (let i = 0; i < bytes.byteLength; i++) {
      base64 += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(base64);
    currentNewsAttachment = {
      type: "file",
      name: file.name,
      size: file.size,
      mimeType: file.type,
      data: base64
    };
    const preview = document.getElementById("news-attachment-file-preview");
    if (preview) {
      preview.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${esc(file.name)} (${(file.size / 1024).toFixed(2)} KB)`;
    }
    console.log("News file attachment set");
  };
  reader.readAsArrayBuffer(file);
}
function clearNewsAttachment() {
  currentNewsAttachment = null;
  document.getElementById("news-attachment-image-section").style.display = "none";
  document.getElementById("news-attachment-link-section").style.display = "none";
  document.getElementById("news-attachment-file-section").style.display = "none";
  const imgInput = document.getElementById("news-attachment-image-input");
  const fileInput = document.getElementById("news-attachment-file-input");
  const linkInput = document.getElementById("news-attachment-link-input");
  if (imgInput) imgInput.value = "";
  if (fileInput) fileInput.value = "";
  if (linkInput) linkInput.value = "";
  document.getElementById("news-attachment-image-preview").innerHTML = "";
  document.getElementById("news-attachment-file-preview").innerHTML = "";
  console.log("News attachment cleared");
}
function attachmentOwnerList(type) {
  if (type === "assignment") return appData.assignments[selectedSection];
  if (type === "exam") return appData.exams[selectedSection];
  if (type === "news") return appData.news;
  if (type === "important") return appData.importantLinks;
  return null;
}
function viewAttachmentImage(type, itemIndex, attIndex) {
  const list = attachmentOwnerList(type);
  if (!list) return;
  const item = list[itemIndex];
  if (!item || !Array.isArray(item.attachments)) return;
  const att = item.attachments[attIndex];
  if (!att || att.type !== "image") return;
  viewImage(att.data);
}
window.viewAttachmentImage = viewAttachmentImage;
window.attachmentOwnerList = attachmentOwnerList;
function downloadAttachment(type, itemIndex, attIndex) {
  const list = attachmentOwnerList(type);
  if (!list) return;
  const item = list[itemIndex];
  if (!item || !Array.isArray(item.attachments)) return;
  const att = item.attachments[attIndex];
  if (!att || att.type !== "file") return;
  let dataBlob = null;
  if (att.data instanceof ArrayBuffer) dataBlob = new Blob([att.data]);
  else {
    const binaryString = atob(att.data.split(",")[1] || att.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    dataBlob = new Blob([bytes]);
  }
  const url = URL.createObjectURL(dataBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.name || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function downloadNewsFile(itemIndex, attIndex) {
  downloadAttachment("news", itemIndex, attIndex);
}
function renderNews() {
  const container = document.getElementById("news-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع الأخبار";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllItems("الأخبار", () => appData.news);
    container.appendChild(clear);
  }
  if (appData.news.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا توجد أخبار حالياً</p>');
    return;
  }
  appData.news.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    let attachmentsHtml = "";
    if (Array.isArray(item.attachments) && item.attachments.length > 0) {
      item.attachments.forEach((att, ai) => {
        if (att.type === "image") {
          attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${safeImgSrc(att.data)}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewAttachmentImage('news', ${Number(index)}, ${Number(ai)})" >
                                </div>
                            `;
        } else if (att.type === "link") {
          attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer nofollow" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
        } else if (att.type === "file") {
          attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('news', ${Number(index)}, ${Number(ai)})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${esc(att.name || "ملف")}</span>
                                </div>
                            `;
        }
      });
    }
    div.innerHTML = `
                    <div class="data-header">
                        <h3 class="editable-value">${esc(item.title)}</h3>
                        <button class="btn-sm btn-delete" onclick="deleteNews(${Number(index)})">حذف</button>
                    </div>
                    <div class="editable-value post-body rich-text">${esc(item.content)}</div>
                    ${attachmentsHtml}
                    <div class="editable-field">
                        <label>العنوان:</label>
                        <input class="editable-input" value="${esc(item.title)}" onchange="updateNews(${Number(index)}, 'title', this.value)" style="margin-bottom: 10px;">
                        <label>المحتوى:</label>
                        <textarea class="editable-textarea" onchange="updateNews(${Number(index)}, 'content', this.value)" style="min-height: 160px;">${esc(item.content)}</textarea>
                    </div>
                `;
    container.appendChild(div);
  });
}
function addNews() {
  const title = document.getElementById("new-news-title").value;
  const content = document.getElementById("new-news-content").value;
  if (title && content) {
    const attachments = Array.isArray(newNewsAttachments) ? newNewsAttachments.slice() : [];
    if (currentNewsAttachment) {
      attachments.push(currentNewsAttachment);
      currentNewsAttachment = null;
    }
    const linkInputPending = document.getElementById("news-attachment-link-input");
    if (linkInputPending && linkInputPending.value) {
      attachments.push({ type: "link", url: linkInputPending.value });
      linkInputPending.value = "";
    }
    const newsObj = {
      id: Date.now(),
      title,
      content,
      attachments
    };
    appData.news.push(newsObj);
    document.getElementById("new-news-title").value = "";
    document.getElementById("new-news-content").value = "";
    clearNewsAttachment();
    newNewsAttachments = [];
    renderNewNewsAttachmentsList();
    saveData();
    render();
    try {
      renderNews();
    } catch (e) {
      console.warn("renderNews error", e);
    }
  }
}
function updateNews(index, key, val) {
  appData.news[index][key] = val;
  saveData();
  render();
}
function deleteNews(index) {
  if (confirm("حذف هذا الخبر؟")) {
    appData.news.splice(index, 1);
    saveData();
    render();
  }
}
function renderImportantLinks() {
  const container = document.getElementById("important-links-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع الروابط المهمة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllItems("الروابط المهمة", () => appData.importantLinks);
    container.appendChild(clear);
  }
  if (appData.importantLinks.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا توجد روابط مهمة حالياً</p>');
    return;
  }
  appData.importantLinks.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    let attachmentsHtml = "";
    if (Array.isArray(item.attachments) && item.attachments.length > 0) {
      item.attachments.forEach((att, ai) => {
        if (att.type === "image") {
          attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${safeImgSrc(att.data)}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewAttachmentImage('important', ${Number(index)}, ${Number(ai)})" >
                                </div>
                            `;
        } else if (att.type === "link") {
          attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer nofollow" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
        } else if (att.type === "file") {
          attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('important', ${Number(index)}, ${Number(ai)})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${esc(att.name || "ملف")}</span>
                                </div>
                            `;
        }
      });
    }
    div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value rich-text">${esc(item.title)}</h3>
                            <input class="editable-field editable-input" value="${esc(item.title)}" onchange="updateImportantLink(${Number(index)}, 'title', this.value)">
                        </div>
                        ${safeUrl(item.url) ? `<a href="${safeUrlAttr(item.url)}" target="_blank" rel="noopener noreferrer nofollow" class="btn-link editable-value">فتح الرابط ↗️</a>` : ``}
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${esc(item.url)}" placeholder="الرابط" onchange="updateImportantLink(${Number(index)}, 'url', this.value)">
                    </div>
                    ${attachmentsHtml}
                    <button class="btn-sm btn-delete" onclick="deleteImportantLink(${index})">حذف</button>
                `;
    container.appendChild(div);
  });
}
function addImportantLink() {
  const title = document.getElementById("new-link-title").value;
  const url = document.getElementById("new-link-url").value;
  if (title && url) {
    const attachments = Array.isArray(newLinkAttachments) ? newLinkAttachments.slice() : [];
    if (currentLinkAttachment) {
      attachments.push(currentLinkAttachment);
      currentLinkAttachment = null;
    }
    const linkInputPending = document.getElementById("link-attachment-link-input");
    if (linkInputPending && linkInputPending.value) {
      attachments.push({ type: "link", url: linkInputPending.value });
      linkInputPending.value = "";
    }
    appData.importantLinks.push({ id: Date.now(), title, url, attachments });
    document.getElementById("new-link-title").value = "";
    document.getElementById("new-link-url").value = "";
    newLinkAttachments = [];
    renderNewLinkAttachmentsList();
    saveData();
    render();
  }
}
function updateImportantLink(index, key, val) {
  appData.importantLinks[index][key] = val;
  saveData();
  render();
}
function deleteImportantLink(index) {
  if (confirm("حذف هذا الرابط؟")) {
    appData.importantLinks.splice(index, 1);
    saveData();
    render();
  }
}
function renderTeachers() {
  const container = document.getElementById("teachers-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع الأساتذة للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllSectionItems("الأساتذة", () => appData.teachers[selectedSection] || [], () => renderTeachers());
    container.appendChild(clear);
  }
  const list = appData.teachers[selectedSection] || [];
  if (!list || list.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا يوجد أساتذة مسجلين لهذه الشعبة حالياً</p>');
    return;
  }
  list.forEach((t, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${esc(t.name)}</h3>
                            <input class="editable-field editable-input" value="${esc(t.name)}" onchange="updateTeacher(${Number(index)}, 'name', this.value)">
                            <p class="editable-value rich-text" style="color:gray; font-size:0.9rem">${esc(t.role || "")}</p>
                            <input class="editable-field editable-input" value="${esc(t.role || "")}" onchange="updateTeacher(${Number(index)}, 'role', this.value)">
                            <p class="editable-value" style="color:gray; font-size:0.85rem; margin-top:5px;">${esc(t.phone || "")}</p>
                            <input class="editable-field editable-input" value="${esc(t.phone || "")}" onchange="updateTeacher(${Number(index)}, 'phone', this.value)">
                        </div>
                        <div style="text-align:left;">
                            ${safePhone(t.phone) ? `<a href="tel:${esc(safePhone(t.phone))}" class="btn-link editable-value">اتصال</a>` : ""}
                        </div>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteTeacher(${index})">حذف</button>
                `;
    container.appendChild(div);
  });
}
function addTeacher() {
  const name = document.getElementById("new-teacher-name").value.trim();
  const role = document.getElementById("new-teacher-role").value.trim();
  const phone = document.getElementById("new-teacher-phone").value.trim();
  if (!name) return;
  if (!appData.teachers[selectedSection]) appData.teachers[selectedSection] = [];
  appData.teachers[selectedSection].push({ id: Date.now(), name, role, phone });
  document.getElementById("new-teacher-name").value = "";
  document.getElementById("new-teacher-role").value = "";
  document.getElementById("new-teacher-phone").value = "";
  saveData();
  render();
  try {
    renderTeachers();
  } catch (e) {
    console.warn("renderTeachers error", e);
  }
}
function updateTeacher(index, key, val) {
  appData.teachers[selectedSection][index][key] = val;
  saveData();
  render();
}
function deleteTeacher(index) {
  if (confirm("حذف هذا الأستاذ؟")) {
    appData.teachers[selectedSection].splice(index, 1);
    saveData();
    render();
  }
}
function renderGroupLinks() {
  const container = document.getElementById("group-links-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع روابط المجموعات للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllSectionItems("روابط المجموعات", () => appData.groupLinks[selectedSection] || [], () => renderGroupLinks());
    container.appendChild(clear);
  }
  const list = appData.groupLinks[selectedSection] || [];
  if (!list || list.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا توجد روابط للمجموعات لهذه الشعبة حالياً</p>');
    return;
  }
  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value rich-text">${esc(item.title)}</h3>
                            <input class="editable-field editable-input" value="${esc(item.title)}" onchange="updateGroupLink(${Number(index)}, 'title', this.value)">
                        </div>
                        ${safeUrl(item.url) ? `<a href="${safeUrlAttr(item.url)}" target="_blank" rel="noopener noreferrer nofollow" class="btn-link editable-value">فتح الرابط ↗️</a>` : ``}
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${esc(item.url)}" placeholder="الرابط" onchange="updateGroupLink(${Number(index)}, 'url', this.value)">
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteGroupLink(${index})">حذف</button>
                `;
    container.appendChild(div);
  });
}
function addGroupLink() {
  const title = document.getElementById("new-group-title").value.trim();
  const url = document.getElementById("new-group-url").value.trim();
  if (!title || !url) return;
  if (!appData.groupLinks[selectedSection]) appData.groupLinks[selectedSection] = [];
  appData.groupLinks[selectedSection].push({ id: Date.now(), title, url });
  document.getElementById("new-group-title").value = "";
  document.getElementById("new-group-url").value = "";
  saveData();
  render();
  try {
    renderGroupLinks();
  } catch (e) {
    console.warn("renderGroupLinks error", e);
  }
}
function updateGroupLink(index, key, val) {
  appData.groupLinks[selectedSection][index][key] = val;
  saveData();
  render();
}
function deleteGroupLink(index) {
  if (confirm("حذف هذا الرابط؟")) {
    appData.groupLinks[selectedSection].splice(index, 1);
    saveData();
    render();
  }
}
function renderSettings() {
  updateFontButtons();
  updateColorSchemeButtons();
  setFontScale(userSettings.fontScale || 80);
  setLineHeight(userSettings.lineHeight || 17);
  updateAppearanceStates();
  renderSectionManagement();
  if (window.IS_OWNER) renderKnownAccounts();
}
function renderTeam() {
  const container = document.getElementById("team-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع أعضاء الفريق";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllItems("أعضاء الفريق", () => appData.team);
    container.appendChild(clear);
  }
  if (window.IS_ADMIN) {
    const preview = document.createElement("div");
    preview.className = "team-font-preview team-font-preview-centered";
    preview.innerHTML = '<small>معاينة الخط الحالي</small><strong style="font-family:var(--font-family)">المنارة الطلابية — فريق التطوير</strong>';
    container.appendChild(preview);
  }
  if (appData.team.length === 0) {
    const empty = document.createElement("p");
    empty.style.cssText = "color:var(--text-light);text-align:center;";
    empty.textContent = "لا يوجد أعضاء في الفريق حالياً";
    container.appendChild(empty);
    return;
  }
  appData.team.forEach((member, index) => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${esc(member.name)}</h3>
                            <input class="editable-field editable-input" value="${esc(member.name)}" onchange="updateTeam(${Number(index)}, 'name', this.value)">
                            <p class="editable-value rich-text" style="color:gray; font-size:0.9rem">${esc(member.role)}</p>
                            <input class="editable-field editable-input" value="${esc(member.role)}" onchange="updateTeam(${Number(index)}, 'role', this.value)">
                            <p class="editable-value rich-text" style="color:gray; font-size:0.85rem; margin-top:5px;">${esc(member.bio || "لا توجد معلومات")}</p>
                            <textarea class="editable-field editable-textarea" onchange="updateTeam(${Number(index)}, 'bio', this.value)" style="min-height: 90px; margin-top: 5px;">${esc(member.bio || "")}</textarea>
                        </div>
                        <div style="text-align:left;">
                            ${safePhone(member.whatsapp) ? `<a href="https://wa.me/${esc(safePhone(member.whatsapp).replace(/^\+/, ""))}" target="_blank" rel="noopener noreferrer" class="btn-link editable-value">واتس</a>` : ``}
                            <input class="editable-field editable-input" value="${esc(member.whatsapp)}" placeholder="رقم الواتس" onchange="updateTeam(${Number(index)}, 'whatsapp', this.value)">
                        </div>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteTeamMember(${index})">حذف</button>
                `;
    container.appendChild(div);
  });
}
let currentExamAttachment = null;
let newExamAttachments = [];
function selectExamAttachmentType(type) {
  document.getElementById("exam-attachment-image-section").style.display = type === "image" ? "block" : "none";
  document.getElementById("exam-attachment-link-section").style.display = type === "link" ? "block" : "none";
  document.getElementById("exam-attachment-file-section").style.display = type === "file" ? "block" : "none";
}
function clearExamAttachment() {
  currentExamAttachment = null;
  document.getElementById("exam-attachment-image-input").value = "";
  document.getElementById("exam-attachment-link-input").value = "";
  document.getElementById("exam-attachment-file-input").value = "";
  document.getElementById("exam-attachment-image-preview").innerHTML = "";
  document.getElementById("exam-attachment-file-preview").innerHTML = "";
  ["exam-attachment-image-section", "exam-attachment-link-section", "exam-attachment-file-section"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
}
function addCurrentExamAttachmentToNew() {
  const type = document.getElementById("exam-attachment-image-section").style.display !== "none" ? "image" : document.getElementById("exam-attachment-link-section").style.display !== "none" ? "link" : "file";
  if (type === "image") {
    const file = document.getElementById("exam-attachment-image-input").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newExamAttachments.push({ type: "image", data: e.target.result, name: file.name });
        clearExamAttachment();
        renderNewExamAttachmentsList();
      };
      reader.readAsDataURL(file);
    }
  } else if (type === "link") {
    const url = document.getElementById("exam-attachment-link-input").value;
    if (url) {
      newExamAttachments.push({ type: "link", url });
      clearExamAttachment();
      renderNewExamAttachmentsList();
    }
  } else if (type === "file") {
    const file = document.getElementById("exam-attachment-file-input").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newExamAttachments.push({ type: "file", data: e.target.result, name: file.name, url: file.name });
        clearExamAttachment();
        renderNewExamAttachmentsList();
      };
      reader.readAsArrayBuffer(file);
    }
  }
}
function renderNewExamAttachmentsList() {
  const container = document.getElementById("new-exam-attachments-list");
  container.innerHTML = "";
  newExamAttachments.forEach((att, idx) => {
    const div = document.createElement("div");
    div.style.cssText = "padding:8px; background:#e8f4f8; border-radius:6px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;";
    const typeLabel = att.type === "image" ? "📷 صورة" : att.type === "link" ? "🔗 رابط" : "📎 ملف";
    div.innerHTML = `<span>${esc(typeLabel)}</span><button type="button" class="btn-sm" style="background:#EF4444; color:white;" onclick="removeExamAttachment(${Number(idx)})">إزالة</button>`;
    container.appendChild(div);
  });
}
function removeExamAttachment(idx) {
  newExamAttachments.splice(idx, 1);
  renderNewExamAttachmentsList();
}
function renderExams() {
  const container = document.getElementById("exams-list");
  container.innerHTML = "";
  if (window.IS_ADMIN) {
    const clear = document.createElement("button");
    clear.className = "btn-sm btn-delete";
    clear.textContent = "حذف جميع الاختبارات للشعبة";
    clear.style.marginBottom = "12px";
    clear.onclick = () => deleteAllSectionItems("الاختبارات", () => appData.exams[selectedSection] || [], () => renderExams());
    container.appendChild(clear);
  }
  let exams = appData.exams[selectedSection] || [];
  const newSubEl = document.getElementById("new-exam-subject");
  if (newSubEl) {
    let opts = '<option value="">--- اختر مادة ---</option>';
    getSubjectsList().forEach((s) => {
      opts += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
    newSubEl.innerHTML = opts;
  }
  if (exams.length === 0) {
    container.insertAdjacentHTML("beforeend", '<p style="color:var(--text-light); text-align:center;">لا توجد اختبارات مسجلة لهذه الشعبة حالياً.</p>');
    return;
  }
  exams.forEach((exam, index) => {
    const div = document.createElement("div");
    div.className = "task-item";
    const dateLabel = exam.date ? new Date(exam.date).toLocaleDateString("ar-EG") : "";
    const subjectHtml = exam.subject ? `<div class="task-subject">${esc(exam.subject)}</div>` : "";
    let attachmentHtml = "";
    if (Array.isArray(exam.attachments) && exam.attachments.length > 0) {
      exam.attachments.forEach((att, ai) => {
        if (att.type === "image") {
          attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${safeImgSrc(att.data)}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewAttachmentImage('exam', ${Number(index)}, ${Number(ai)})">
                                </div>
                            `;
        } else if (att.type === "link") {
          attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${safeUrlAttr(att.url)}" target="_blank" rel="noopener noreferrer nofollow" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
        } else if (att.type === "file") {
          attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('exam', ${Number(index)}, ${Number(ai)})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${esc(att.name || att.url || "ملف")}</span>
                                </div>
                            `;
        }
      });
    }
    div.innerHTML = `
                    <div style="flex:1">
                        ${subjectHtml}
                        <div class="task-desc"><span class="editable-value rich-text">${esc(exam.title)}</span></div>
                        ${attachmentHtml}
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;"><small style="color:var(--text-light);">${esc(dateLabel)}</small></div>
                        <textarea class="editable-field editable-input" rows="3" onchange="updateExamTitle(${Number(index)}, this.value)">${esc(exam.title)}</textarea>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteExam(${index})">حذف</button>
                `;
    container.appendChild(div);
  });
}
function addExam() {
  const title = document.getElementById("new-exam-title").value;
  if (title) {
    if (!appData.exams[selectedSection]) appData.exams[selectedSection] = [];
    const dateInput = document.getElementById("new-exam-date") ? document.getElementById("new-exam-date").value : "";
    const subjInput = document.getElementById("new-exam-subject") ? document.getElementById("new-exam-subject").value : "";
    const dateVal = dateInput ? new Date(dateInput).getTime() : Date.now();
    const attachments = Array.isArray(newExamAttachments) ? newExamAttachments.slice() : [];
    const examObj = {
      id: Date.now(),
      title,
      date: dateVal,
      subject: subjInput || "",
      attachments
    };
    appData.exams[selectedSection].push(examObj);
    document.getElementById("new-exam-title").value = "";
    if (document.getElementById("new-exam-date")) document.getElementById("new-exam-date").value = "";
    if (document.getElementById("new-exam-subject")) document.getElementById("new-exam-subject").value = "";
    clearExamAttachment();
    newExamAttachments = [];
    renderNewExamAttachmentsList();
    saveData();
    renderExams();
  }
}
function updateExamTitle(index, newTitle) {
  if (appData.exams[selectedSection] && appData.exams[selectedSection][index]) {
    appData.exams[selectedSection][index].title = newTitle;
    saveData();
    renderExams();
  }
}
function deleteExam(index) {
  if (confirm("هل تريد حذف هذا الاختبار؟")) {
    appData.exams[selectedSection].splice(index, 1);
    saveData();
    renderExams();
  }
}
function addTeamMember() {
  const name = document.getElementById("new-team-name").value;
  const role = document.getElementById("new-team-role").value;
  const bio = document.getElementById("new-team-bio").value;
  const whatsapp = document.getElementById("new-team-whatsapp").value;
  console.log("addTeamMember called, name=", name, "role=", role, "whatsapp=", whatsapp);
  if (name && whatsapp) {
    appData.team.push({ id: Date.now(), name, role, bio, whatsapp });
    document.getElementById("new-team-name").value = "";
    document.getElementById("new-team-role").value = "";
    document.getElementById("new-team-bio").value = "";
    document.getElementById("new-team-whatsapp").value = "";
    saveData();
    render();
    try {
      renderTeam();
    } catch (e) {
      console.warn("renderTeam error", e);
    }
  }
}
function updateTeam(index, key, val) {
  appData.team[index][key] = val;
  saveData();
  render();
}
function deleteTeamMember(index) {
  if (confirm("حذف عضو الفريق؟")) {
    appData.team.splice(index, 1);
    saveData();
    render();
  }
}
let booksPackagesType = "books";
function switchBooksPackagesType(type) {
  booksPackagesType = type === "packages" ? "packages" : "books";
  const isBooks = booksPackagesType === "books";
  const booksTab = document.getElementById("booksTab");
  const packagesTab = document.getElementById("packagesTab");
  if (booksTab) booksTab.classList.toggle("active", isBooks);
  if (packagesTab) packagesTab.classList.toggle("active", !isBooks);
  const addTitle = document.getElementById("add-books-packages-title");
  if (addTitle) addTitle.innerText = isBooks ? "إضافة كتاب جديد" : "إضافة رزمة جديدة";
  const addInput = document.getElementById("new-books-packages-title");
  if (addInput) addInput.placeholder = isBooks ? "اسم الكتاب" : "اسم الرزمة";
  renderBooksPackages();
}
function renderBooksPackages() {
  const container = document.getElementById("books-packages-list");
  if (!container) return;
  const bt = document.getElementById("booksTab"), pt = document.getElementById("packagesTab");
  if (bt) bt.classList.toggle("active", booksPackagesType === "books");
  if (pt) pt.classList.toggle("active", booksPackagesType === "packages");
  container.innerHTML = "";
  try {
    const raw = booksPackagesType === "books" ? appData.books : appData.packages;
    const list = asArray(raw);
    if (window.IS_ADMIN) {
      const clear = document.createElement("button");
      clear.className = "btn-sm btn-delete";
      clear.textContent = booksPackagesType === "books" ? "حذف جميع الكتب" : "حذف جميع الرزم";
      clear.style.marginBottom = "12px";
      clear.onclick = () => deleteAllItems(booksPackagesType === "books" ? "الكتب" : "الرزم", () => booksPackagesType === "books" ? appData.books : appData.packages);
      container.appendChild(clear);
    }
    if (list.length === 0) {
      container.insertAdjacentHTML("beforeend", `<p class="empty-note">لا يوجد ${booksPackagesType === "books" ? "كتب" : "رزم"} حالياً.</p>`);
      return;
    }
    list.forEach((item, index) => {
      if (!item) return;
      const div = document.createElement("div");
      div.className = "data-card";
      div.innerHTML = `
                    <div class="data-header">
                        <h3 class="editable-value rich-text">${esc(item.title)}</h3>
                        ${safeUrl(item.link) ? `<a href="${safeUrlAttr(item.link)}" target="_blank" rel="noopener noreferrer" class="btn-link editable-value">تحميل ⬇️</a>` : ``}
                        <button class="btn-sm btn-delete" onclick="deleteBooksPackage(${Number(index)})">حذف</button>
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${esc(item.title)}" placeholder="الاسم" onchange="updateBooksPackage(${Number(index)}, 'title', this.value)">
                        <input class="editable-input" value="${esc(item.link)}" placeholder="رابط التحميل" onchange="updateBooksPackage(${Number(index)}, 'link', this.value)">
                    </div>
                `;
      container.appendChild(div);
    });
  } catch (e) {
    console.warn("renderBooksPackages error", e);
    container.innerHTML = '<p class="empty-note">تعذر عرض القائمة، اضغط زر التحديث.</p>';
  }
}
function addBooksPackage() {
  const title = document.getElementById("new-books-packages-title").value;
  const link = document.getElementById("new-books-packages-link").value;
  console.log("addBooksPackage called, type=", booksPackagesType, "title=", title, "link=", link);
  if (title && link) {
    let arr = booksPackagesType === "books" ? appData.books : appData.packages;
    if (!arr) {
      if (booksPackagesType === "books") appData.books = [];
      else appData.packages = [];
      arr = booksPackagesType === "books" ? appData.books : appData.packages;
    }
    arr.push({ id: Date.now(), title, link });
    document.getElementById("new-books-packages-title").value = "";
    document.getElementById("new-books-packages-link").value = "";
    saveData();
    render();
    try {
      renderBooksPackages();
    } catch (e) {
      console.warn("renderBooksPackages error", e);
    }
  }
}
function updateBooksPackage(index, key, val) {
  const arr = booksPackagesType === "books" ? appData.books : appData.packages;
  if (!arr || !arr[index]) return;
  arr[index][key] = val;
  saveData();
  render();
  renderBooksPackages();
}
function deleteBooksPackage(index) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    const arr = booksPackagesType === "books" ? appData.books : appData.packages;
    arr.splice(index, 1);
    saveData();
    render();
    renderBooksPackages();
  }
}
document.addEventListener("DOMContentLoaded", function() {
  startSplashSequence();
  if (window.APP_ROLE === "admin" && window.ADMIN_VERIFIED !== true) return;
  try {
    switchBooksPackagesType("books");
  } catch (e) {
  }
  try {
    render();
  } catch (e) {
    console.warn("render", e);
  }
});
function startSplashSequence() {
  try {
    const overlay = document.getElementById("splash-overlay");
    const logo = document.getElementById("splash-logo");
    const text = document.getElementById("splash-text");
    const circle = document.getElementById("splash-circle");
    if (!overlay || !logo || !text || !circle) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      logo.classList.add("scale-up");
    }, 80);
    setTimeout(() => {
      text.classList.add("show");
    }, 650);
    setTimeout(() => {
      const rect = logo.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      circle.style.left = cx + "px";
      circle.style.top = cy + "px";
      logo.classList.add("fade-out");
      text.classList.remove("show");
      requestAnimationFrame(() => {
        circle.classList.add("expand");
      });
    }, 1800);
    setTimeout(() => {
      overlay.classList.add("hidden");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      setTimeout(() => {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 500);
    }, 2600);
  } catch (e) {
    console.warn("splash error", e);
    const overlay = document.getElementById("splash-overlay");
    if (overlay) overlay.remove();
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }
}
window.diagnose = function() {
  console.clear();
  console.log("%c🔍 تقرير التشخيص الشامل", "font-size:18px; font-weight:bold; color:blue;");
  console.log("%c=" + "=".repeat(60), "color:blue;");
  console.log("%c📡 حالة Firebase", "font-size:14px; font-weight:bold; color:green;");
  try {
    const testRef = firebase.database().ref("appData");
    console.log("✅ Firebase Database متصل");
  } catch (e) {
    console.error("❌ خطأ في Firebase:", e.message);
  }
  console.log("%c💾 Local Storage", "font-size:14px; font-weight:bold; color:green;");
  const localData = localStorage.getItem("collegeAppData");
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      console.log("✅ البيانات موجودة في localStorage");
      console.log("📊 عدد الشعب:", parsed.sections || "غير محدد");
      console.log("📚 عدد المواد:", parsed.subjects ? parsed.subjects.length : 0);
      console.log("📝 عدد الواجبات:", Object.keys(parsed.assignments || {}).reduce((sum, k) => sum + (parsed.assignments[k] ? parsed.assignments[k].length : 0), 0));
    } catch (e) {
      console.error("❌ خطأ في قراءة localStorage:", e.message);
    }
  } else {
    console.warn("⚠️ لا توجد بيانات في localStorage");
  }
  console.log("%c📦 بيانات التطبيق الحالية", "font-size:14px; font-weight:bold; color:green;");
  console.log("الشعبة المختارة:", selectedSection);
  console.log("الصفحة الحالية:", currentView);
  console.log("وضع التعديل:", isEditMode ? "✅ مفعّل" : "❌ معطّل");
  console.log("%c🏗️ هيكل البيانات", "font-size:14px; font-weight:bold; color:green;");
  console.log("تقدم الشعبة " + selectedSection + ":", appData.progress[selectedSection] || "فارغ");
  console.log("واجبات الشعبة " + selectedSection + ":", appData.assignments[selectedSection] || "فارغ");
  console.log("روابط الحصص للشعبة " + selectedSection + ":", appData.liveLinks[selectedSection] || "فارغ");
  console.log("%c🌐 حالة الاتصال", "font-size:14px; font-weight:bold; color:green;");
  console.log("الاتصال بالإنترنت:", navigator.onLine ? "✅ متصل" : "❌ منقطع");
  console.log("%c🖥️ معلومات المتصفح", "font-size:14px; font-weight:bold; color:green;");
  console.log("المتصفح:", navigator.userAgent);
  console.log("%c=" + "=".repeat(60), "color:blue;");
  console.log("%c💡 نصائح:", "font-size:12px; font-weight:bold;");
  console.log("- استخدم appData للوصول إلى البيانات الحالية");
  console.log("- استخدم saveData() لحفظ التغييرات");
  console.log("- استخدم render() لتحديث الصفحة");
  console.log("- اكتب diagnose() لتشغيل هذا التقرير مرة أخرى");
};
window.addAssignment = addAssignment;
window.addBooksPackage = addBooksPackage;
window.addTeamMember = addTeamMember;
window.addSupport = addSupport;
window.addSummary = addSummary;
window.addNews = addNews;
window.addImportantLink = addImportantLink;
window.addTeacher = addTeacher;
window.addGroupLink = addGroupLink;
window.selectAttachmentType = selectAttachmentType;
window.clearAttachment = clearAttachment;
window.viewImage = viewImage;
window.downloadFile = downloadFile;
window.handleImageAttachment = handleImageAttachment;
window.handleFileAttachment = handleFileAttachment;
window.selectNewsAttachmentType = selectNewsAttachmentType;
window.clearNewsAttachment = clearNewsAttachment;
window.downloadNewsFile = downloadNewsFile;
window.handleNewsImageAttachment = handleNewsImageAttachment;
window.handleNewsFileAttachment = handleNewsFileAttachment;
if (!(window.APP_ROLE === "admin" && window.ADMIN_VERIFIED !== true)) {
  try {
    render();
  } catch (e) {
    console.warn("initial render", e);
  }
}
(function() {
  const promptEl = document.getElementById("install-prompt");
  const installBtn = document.getElementById("install-btn");
  const hideBtn = document.getElementById("hide-btn");
  let deferredPrompt = null;
  function isAppInstalled() {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) return true;
      return localStorage.getItem("appInstalled") === "true";
    } catch (e) {
      return false;
    }
  }
  function showPrompt() {
    if (isAppInstalled()) return;
    if (!deferredPrompt) return;
    promptEl.classList.remove("hidden");
  }
  function hidePrompt() {
    promptEl.classList.add("hidden");
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPrompt();
  });
  if (!promptEl || !installBtn || !hideBtn) return;
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      hidePrompt();
      deferredPrompt = null;
    } catch (err) {
      console.warn("install prompt error", err);
    }
  });
  hideBtn.addEventListener("click", () => {
    hidePrompt();
  });
  window.addEventListener("appinstalled", () => {
    try {
      localStorage.setItem("appInstalled", "true");
    } catch (e) {
    }
    hidePrompt();
    deferredPrompt = null;
  });
  document.addEventListener("DOMContentLoaded", () => {
    if (isAppInstalled()) return;
    if (deferredPrompt) showPrompt();
  });
  Object.assign(window, { setFont, setColorScheme, setFontScale, setLineHeight, toggleHighContrast, toggleReducedMotion, toggleCompactMode, resetAppearanceSettings, showSection, goBack, setSection, openManageSubjects, addSubject, deleteSubject, addNewSection, renameSection, deleteSection, grantAdminByEmail, grantAdmin, revokeAdmin, renderKnownAccounts, toggleWeeklySchedule, weeklyAddNew, render });
})();
var DHIKR_LIST = [
  { t: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", h: "سيد الاستغفار", s: "رواه البخاري" },
  { t: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", h: "آية الكرسي", s: "سورة البقرة، الآية ٢٥٥" },
  { t: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي، يَفْقَهُوا قَوْلِي", h: "دعاء موسى عليه السلام", s: "سورة طه، الآيات ٢٥ - ٢٨" },
  { t: "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا", h: "دعاء طلب العلم", s: "رواه الترمذي وابن ماجه" },
  { t: "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", h: "دعاء ذي النون", s: "سورة الأنبياء، الآية ٨٧" },
  { t: "لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ", h: "دعاء الكرب", s: "متفق عليه" },
  { t: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ", h: "دعاء الهمّ والحزن", s: "رواه البخاري" },
  { t: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", h: "دعاء العفو", s: "رواه الترمذي" },
  { t: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَىٰ دِينِكَ", h: "دعاء الثبات", s: "رواه الترمذي" },
  { t: "اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", h: "دعاء الإعانة على العبادة", s: "رواه أبو داود والنسائي" },
  { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", h: "كلمتان خفيفتان على اللسان", s: "متفق عليه" },
  { t: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", h: "دعاء جامع", s: "سورة البقرة، الآية ٢٠١" },
  { t: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", h: "التوكل على الله", s: "سورة التوبة، الآية ١٢٩" },
  { t: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ", h: "الاستغفار", s: "رواه أبو داود والترمذي" },
  { t: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَىٰ وَالتُّقَىٰ وَالْعَفَافَ وَالْغِنَىٰ", h: "دعاء الهدى والتقى", s: "رواه مسلم" },
  { t: "اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ", h: "دعاء إصلاح الأحوال", s: "رواه مسلم" },
  { t: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَٰهَ إِلَّا أَنْتَ", h: "دعاء الرجاء", s: "رواه أبو داود" },
  { t: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", h: "أحبّ الكلام إلى الله", s: "رواه مسلم" },
  { t: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", h: "كنز من كنوز الجنة", s: "متفق عليه" }
];
var dhikrIndex = -1, dhikrTimer = null;
function showDhikr(step) {
  var card = document.getElementById("dhikr-card");
  if (!card) return;
  if (dhikrIndex < 0) dhikrIndex = Math.floor(Math.random() * DHIKR_LIST.length);
  else dhikrIndex = (dhikrIndex + step + DHIKR_LIST.length) % DHIKR_LIST.length;
  var d = DHIKR_LIST[dhikrIndex];
  var body = card.querySelector(".dhikr-body");
  body.classList.add("fade");
  setTimeout(function() {
    card.querySelector(".dhikr-title").textContent = d.h;
    card.querySelector(".dhikr-text").textContent = d.t;
    card.querySelector(".dhikr-src").textContent = d.s;
    card.classList.toggle("long", d.t.length > 170);
    body.classList.remove("fade");
  }, 260);
}
function initDhikr() {
  if (typeof DHIKR_LIST === "undefined" || !DHIKR_LIST || !DHIKR_LIST.length) return;
  var home = document.getElementById("home");
  if (!home) return;
  if (!document.getElementById("dhikr-card")) {
    var card = document.createElement("div");
    card.id = "dhikr-card";
    card.className = "dhikr-card";
    card.innerHTML = '<div class="dhikr-body"><div class="dhikr-title"></div><p class="dhikr-text"></p><div class="dhikr-src"></div></div><button type="button" class="dhikr-next" aria-label="التالي" title="التالي">‹</button>';
    card.querySelector(".dhikr-next").onclick = function() {
      showDhikr(1);
      resetDhikrTimer();
    };
    home.insertBefore(card, home.firstChild);
    showDhikr(0);
    resetDhikrTimer();
  }
}
function resetDhikrTimer() {
  clearInterval(dhikrTimer);
  dhikrTimer = setInterval(function() {
    if (document.visibilityState === "visible") showDhikr(1);
  }, 3 * 60 * 1e3);
}
