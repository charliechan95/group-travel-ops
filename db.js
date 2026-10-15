/* Group Travel Rooming + Deposit Ops — static data layer.
   localStorage-backed, no backend. WhatsApp via wa.me deep links (manual send). */
"use strict";

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
      return fallback;
    }
  },
  _write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  _nextId() {
    const n = (parseInt(localStorage.getItem("gt_seq") || "0", 10) || 0) + 1;
    localStorage.setItem("gt_seq", String(n));
    return n;
  },

  // ---- Settings ------------------------------------------------------------
  settings() {
    const stored = this._read("gt_settings", {});
    return { ...DEFAULT_SETTINGS, ...stored };
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
    const room = {
      id: data.id ? +data.id : this._nextId(),
      tour_id: +data.tour_id,
      label: data.label || "",
      type: data.type || "Twin",
      member_ids: data.member_ids || [],
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

  // ---- WhatsApp ------------------------------------------------------------
  chaseLink(member) {
    const s = this.settings();
    const tour = this.getTour(member.tour_id);
    const due = memberBalance(member);
    const text = (s.chase_message || "")
      .replace("{operator}", s.operator_name || "")
      .replace("{tour}", tour ? tour.name : "")
      .replace("{price}", tour ? tour.price_per_person : "")
      .replace("{deposit}", tour ? tour.deposit_per_person : "")
      .replace("{due}", due)
      .replace("{fps_id}", s.fps_id || "")
      .replace("{fps_name}", s.fps_name || "");
    const phone = normPhone(member.phone);
    return phone ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(text) : "";
  },
};

// Export for node tests
if (typeof module !== "undefined") module.exports = { DB, memberBalance, memberStatus, MEMBER_STATUS_LABELS, normPhone, DEFAULT_SETTINGS };
