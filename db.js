/* Group Travel Rooming + Deposit Ops — static data layer.
   localStorage-backed, no backend. WhatsApp via wa.me deep links (manual send). */
"use strict";

function _lang() {
  try { return localStorage.getItem("gto_lang") || "zh"; } catch { return "zh"; }
}
function _en() { return _lang() === "en"; }
// English default for the WhatsApp chase message, used only until the user saves their own.
// A user's saved custom text is never overridden.
const EN_CHASE_MESSAGE =
  "{operator} here: the tour \u201c{tour}\u201d you joined costs {price} per person, " +
  "deposit is {deposit} per person, and your balance is {due}. " +
  "Please pay by FPS to {fps_id} ({fps_name}) and send us the payment screenshot. Thank you!";

/* Tracks keys whose stored JSON failed to parse. A flagged key is never
   silently overwritten: _write refuses and surfaces an error, so corrupt
   real data can't be destroyed by a routine save. Flags clear on import
   (validated restore) or when the user fixes the data. */
const _corruptedKeys = new Set();

/* User-visible storage failure, in the app's alert pattern and language. */
function _storageError(kind, key) {
  const msg = _en()
    ? kind === "corrupt"
      ? "Data error: the saved data for this section is damaged and was NOT overwritten. Please export what you can, then restore from a backup."
      : "Save failed: browser storage is unavailable or full. Your changes were NOT saved."
    : kind === "corrupt"
      ? "資料錯誤：此部分的儲存資料已損毀，未被覆寫。請先匯出可用資料，再從備份還原。"
      : "儲存失敗：瀏覽器儲存空間不足或無法使用，您的更改尚未儲存。";
  try { alert(msg); } catch { /* no alert surface (tests) */ }
  throw new Error("gto-" + kind + ":" + key);
}

/* ---- derived member maths (shared by UI and tests) ------------------------- */
function memberBalance(m) {
  return Math.round(((+m.price || 0) - (+m.deposit_paid || 0)) * 100) / 100;
}
function memberStatus(m) {
  const price = +m.price || 0;
  const paid = +m.deposit_paid || 0;
  if (paid <= 0) return "unpaid";
  if (paid < price) return "deposit";
  return "paid";
}
const MEMBER_STATUS_LABELS = { unpaid: "未付", deposit: "已付訂金", paid: "已付清" };

const DEFAULT_SETTINGS = {
  operator_name: "",
  fps_id: "",
  fps_name: "",
  chase_message:
    "{operator}提醒您：您報名的「{tour}」團費每位 {price} 元，" +
    "訂金每位 {deposit} 元，尚欠 {due} 元。請 FPS 轉數至 {fps_id} ({fps_name})，" +
    "並回傳付款截圖，謝謝！",
};

function normPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 8) return "852" + d;
  return d;
}

const DB = {
  _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      // Parse failed: the stored data is corrupt but REAL — flag it so the
      // next _write refuses to overwrite it. Never silently wipe.
      _corruptedKeys.add(key);
      return fallback;
    }
  },
  _write(key, value) {
    if (_corruptedKeys.has(key)) _storageError("corrupt", key);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      _storageError("full", key);
    }
  },
  // Cleared only by a validated import/restore (or tests): never auto-cleared.
  _clearCorrupt(key) {
    _corruptedKeys.delete(key);
  },
  _nextId() {
    const n = (parseInt(localStorage.getItem("gt_seq") || "0", 10) || 0) + 1;
    localStorage.setItem("gt_seq", String(n));
    return n;
  },

  // ---- Settings ------------------------------------------------------------
  settings() {
    const stored = this._read("gt_settings", {});
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    if (!("chase_message" in stored) && _en()) {
      merged.chase_message = EN_CHASE_MESSAGE;
    }
    return merged;
  },
  saveSettings(data) {
    const stored = this._read("gt_settings", {});
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      if (k in data) stored[k] = data[k];
    }
    this._write("gt_settings", stored);
  },

  // ---- Tours ---------------------------------------------------------------
  tours() {
    return this._read("gt_tours", []);
  },
  getTour(id) {
    return this.tours().find((t) => String(t.id) === String(id)) || null;
  },
  saveTour(data) {
    const list = this.tours();
    const tour = {
      id: data.id ? +data.id : this._nextId(),
      name: data.name || "",
      destination: data.destination || "",
      start_date: data.start_date || "",
      end_date: data.end_date || "",
      price_per_person: +data.price_per_person || 0,
      deposit_per_person: +data.deposit_per_person || 0,
    };
    const i = list.findIndex((t) => String(t.id) === String(tour.id));
    if (i >= 0) list[i] = tour; else list.push(tour);
    this._write("gt_tours", list);
    return tour;
  },
  deleteTour(id) {
    this._write("gt_tours", this.tours().filter((t) => String(t.id) !== String(id)));
    this._write("gt_members", this.members().filter((m) => String(m.tour_id) !== String(id)));
    this._write("gt_rooms", this.rooms().filter((r) => String(r.tour_id) !== String(id)));
  },

  // ---- Members -------------------------------------------------------------
  members(tourId) {
    let list = this._read("gt_members", []);
    if (tourId !== undefined && tourId !== null && tourId !== "")
      list = list.filter((m) => String(m.tour_id) === String(tourId));
    return list;
  },
  getMember(id) {
    return this._read("gt_members", []).find((m) => String(m.id) === String(id)) || null;
  },
  saveMember(data) {
    const list = this._read("gt_members", []);
    const tour = this.getTour(data.tour_id);
    const member = {
      id: data.id ? +data.id : this._nextId(),
      tour_id: +data.tour_id,
      name: data.name || "",
      phone: data.phone || "",
      notes: data.notes || "",
      price: data.price !== undefined && data.price !== "" ? +data.price
        : (tour ? +tour.price_per_person || 0 : 0),
      deposit_paid: data.deposit_paid !== undefined && data.deposit_paid !== ""
        ? +data.deposit_paid : 0,
    };
    const i = list.findIndex((m) => String(m.id) === String(member.id));
    if (i >= 0) list[i] = member; else list.push(member);
    this._write("gt_members", list);
    return member;
  },
  recordPayment(id, amount) {
    const list = this._read("gt_members", []);
    const m = list.find((x) => String(x.id) === String(id));
    if (!m) return null;
    m.deposit_paid = Math.round(((+m.deposit_paid || 0) + (+amount || 0)) * 100) / 100;
    this._write("gt_members", list);
    return m;
  },
  deleteMember(id) {
    this._write("gt_members", this._read("gt_members", []).filter((m) => String(m.id) !== String(id)));
    // also drop from any room assignment
    const rooms = this._read("gt_rooms", []);
    for (const r of rooms) r.member_ids = (r.member_ids || []).filter((x) => String(x) !== String(id));
    this._write("gt_rooms", rooms);
  },

  // ---- Rooms ---------------------------------------------------------------
  rooms(tourId) {
    let list = this._read("gt_rooms", []);
    if (tourId !== undefined && tourId !== null && tourId !== "")
      list = list.filter((r) => String(r.tour_id) === String(tourId));
    return list;
  },
  saveRoom(data) {
    const list = this._read("gt_rooms", []);
    const existing = data.id ? list.find((r) => String(r.id) === String(data.id)) : null;
    const room = {
      id: data.id ? +data.id : this._nextId(),
      tour_id: +data.tour_id,
      label: data.label || "",
      type: data.type || "Twin",
      // On edit, keep the existing assignments unless a new list is given.
      member_ids: data.member_ids !== undefined ? data.member_ids
        : (existing ? existing.member_ids || [] : []),
    };
    const i = list.findIndex((r) => String(r.id) === String(room.id));
    if (i >= 0) list[i] = room; else list.push(room);
    this._write("gt_rooms", list);
    return room;
  },
  deleteRoom(id) {
    this._write("gt_rooms", this._read("gt_rooms", []).filter((r) => String(r.id) !== String(id)));
  },
  // One-room rule: a member belongs to at most one room in a tour.
  assignMember(tourId, roomId, memberId) {
    const list = this._read("gt_rooms", []);
    for (const r of list) {
      if (String(r.tour_id) !== String(tourId)) continue;
      r.member_ids = (r.member_ids || []).filter((x) => String(x) !== String(memberId));
      if (String(r.id) === String(roomId)) r.member_ids.push(+memberId);
    }
    this._write("gt_rooms", list);
  },
  unassignMember(tourId, memberId) {
    this.assignMember(tourId, null, memberId);
  },
  roomOfMember(tourId, memberId) {
    const r = this.rooms(tourId).find((x) => (x.member_ids || []).some((m) => String(m) === String(memberId)));
    return r || null;
  },
  unassignedMembers(tourId) {
    const assigned = new Set();
    for (const r of this.rooms(tourId))
      for (const m of (r.member_ids || [])) assigned.add(String(m));
    return this.members(tourId).filter((m) => !assigned.has(String(m.id)));
  },

  // ---- Dashboard stats -----------------------------------------------------
  stats(tourId) {
    const members = this.members(tourId);
    let collected = 0, outstanding = 0, unpaid = 0;
    for (const m of members) {
      const paid = +m.deposit_paid || 0;
      collected += paid;
      const bal = memberBalance(m);
      if (bal > 0) { outstanding += bal; if (memberStatus(m) === "unpaid") unpaid++; }
    }
    return {
      count: members.length,
      collected: Math.round(collected * 100) / 100,
      outstanding: Math.round(outstanding * 100) / 100,
      unpaid,
      rooms: this.rooms(tourId).length,
    };
  },

  // ---- Backup / restore ------------------------------------------------------
  // Export everything as one JSON object (downloaded by the Settings UI).
  exportData() {
    return {
      app: "group-travel-ops",
      version: 1,
      exported_at: new Date().toISOString(),
      tours: this.tours(),
      members: this._read("gt_members", []),
      rooms: this._read("gt_rooms", []),
      settings: this._read("gt_settings", {}),
      seq: parseInt(localStorage.getItem("gt_seq") || "0", 10) || 0,
    };
  },
  // Shape check BEFORE anything is written. Returns true only when the
  // object looks like one of our exports.
  _validBackup(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    if (!Array.isArray(obj.tours) || !Array.isArray(obj.members) || !Array.isArray(obj.rooms)) return false;
    if (obj.settings !== undefined && (typeof obj.settings !== "object" || obj.settings === null || Array.isArray(obj.settings))) return false;
    for (const t of obj.tours)
      if (!t || typeof t !== "object" || t.id === undefined) return false;
    for (const m of obj.members)
      if (!m || typeof m !== "object" || m.id === undefined || m.tour_id === undefined) return false;
    for (const r of obj.rooms)
      if (!r || typeof r !== "object" || r.id === undefined || r.tour_id === undefined) return false;
    return true;
  },
  // Restore from a validated export. Returns false and writes NOTHING when
  // the shape is wrong; also the only path that clears corruption flags.
  importData(obj) {
    if (!this._validBackup(obj)) return false;
    for (const k of ["gt_tours", "gt_members", "gt_rooms", "gt_settings"]) this._clearCorrupt(k);
    this._write("gt_tours", obj.tours);
    this._write("gt_members", obj.members);
    this._write("gt_rooms", obj.rooms);
    this._write("gt_settings", obj.settings || {});
    try { localStorage.setItem("gt_seq", String(+obj.seq || 0)); } catch { /* keep old seq */ }
    return true;
  },

  // ---- WhatsApp ------------------------------------------------------------
  chaseLink(member) {
    const s = this.settings();
    const tour = this.getTour(member.tour_id);
    // Fee, paid and due figures ALL come from the member's own numbers so
    // price - paid === due exactly, even for a customized fee.
    const price = +member.price || 0;
    const paid = +member.deposit_paid || 0;
    const due = memberBalance(member);
    const text = (s.chase_message || "")
      .replace("{operator}", s.operator_name || "")
      .replace("{tour}", tour ? tour.name : "")
      .replace("{price}", price)
      .replace("{deposit}", paid)
      .replace("{due}", due)
      .replace("{fps_id}", s.fps_id || "")
      .replace("{fps_name}", s.fps_name || "");
    const phone = normPhone(member.phone);
    return phone ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(text) : "";
  },
};

// Export for node tests
if (typeof module !== "undefined") module.exports = { DB, memberBalance, memberStatus, MEMBER_STATUS_LABELS, normPhone, DEFAULT_SETTINGS };
