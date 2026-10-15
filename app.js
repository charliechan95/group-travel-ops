/* Group Travel Rooming + Deposit Ops — UI. Plain, functional, no extras. */
"use strict";

let currentTourId = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

function currentTour() {
  return currentTourId ? DB.getTour(currentTourId) : null;
}

/* ---- i18n display helpers ----------------------------------------------------
   Canonical stored values (statuses, room types, tour/member/room data) are kept
   as-is; only their display goes through t(). */
const STATUS_LABEL_KEY = {
  unpaid: "status_unpaid", deposit: "status_deposit", paid: "status_paid",
};
function statusLabel(s) {
  const k = STATUS_LABEL_KEY[s];
  return k ? t(k) : (s || "");
}

// ---- tabs ------------------------------------------------------------------
document.querySelectorAll(".tabs button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".view").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $("view-" + b.dataset.tab).classList.add("active");
  });
});

// ---- tour selector ---------------------------------------------------------
function refreshTourSelect() {
  const tours = DB.tours();
  const sel = $("tour-select");
  sel.innerHTML = tours.map((t) =>
    `<option value="${t.id}"${String(t.id) === String(currentTourId) ? " selected" : ""}>${esc(t.name)}${t.destination ? " · " + esc(t.destination) : ""}</option>`
  ).join("") || `<option value="">${t("opt_no_tours")}</option>`;
  if (!tours.length) currentTourId = null;
  else if (!tours.some((t) => String(t.id) === String(currentTourId))) currentTourId = tours[0].id;
  renderAll();
}
$("tour-select").addEventListener("change", (e) => {
  currentTourId = e.target.value || null;
  renderAll();
});

function renderAll() {
  renderDashboard();
  renderMembers();
  renderRooms();
}

// ---- dashboard ---------------------------------------------------------------
function renderDashboard() {
  const tour = currentTour();
  $("tour-title").textContent = tour ? `${tour.name}${tour.destination ? " · " + tour.destination : ""}${tour.start_date ? "（" + tour.start_date + "）" : ""}` : t("dash_title");
  const st = tour ? DB.stats(tour.id) : { count: 0, collected: 0, outstanding: 0, unpaid: 0, rooms: 0 };
  $("st-count").textContent = st.count;
  $("st-collected").textContent = st.collected;
  $("st-outstanding").textContent = st.outstanding;
  $("st-unpaid").textContent = st.unpaid;
  $("st-rooms").textContent = st.rooms;
}

// ---- members -----------------------------------------------------------------
function statusPill(status) {
  return `<span class="pill pill-${status}">${statusLabel(status)}</span>`;
}
function renderMembers() {
  const tour = currentTour();
  const rows = tour ? DB.members(tour.id).map((m) => {
    const status = memberStatus(m);
    const link = DB.chaseLink(m);
    const room = DB.roomOfMember(tour.id, m.id);
    return `<tr>
      <td>${esc(m.name)}</td><td>${esc(m.phone)}</td>
      <td>${m.price}</td><td>${m.deposit_paid}</td><td>${memberBalance(m)}</td>
      <td>${statusPill(status)}</td>
      <td>${room ? esc(room.label) : `<span class='muted'>${t("room_unassigned")}</span>`}</td>
      <td><div class="row-actions">
        ${link ? `<a href="${link}" target="_blank" rel="noopener">${t("btn_chase")}</a>` : ""}
        <button data-act="pay" data-id="${m.id}">${t("btn_pay")}</button>
        <button data-act="edit" data-id="${m.id}">${t("btn_edit")}</button>
        <button data-act="del" data-id="${m.id}" style="color:var(--red)">${t("btn_delete")}</button>
      </div></td></tr>`;
  }).join("") : "";
  $("member-rows").innerHTML = rows || `<tr><td colspan="8" class="muted">${t("no_members")}</td></tr>`;
}
$("member-rows").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const m = DB.getMember(btn.dataset.id);
  if (!m) return;
  if (btn.dataset.act === "edit") openMemberDialog(m);
  if (btn.dataset.act === "del" && confirm(t("confirm_del_member").replace("{name}", m.name))) {
    DB.deleteMember(m.id); renderAll();
  }
  if (btn.dataset.act === "pay") {
    $("pay-info").textContent = t("pay_info_tmpl").replace("{name}", m.name)
      .replace("{paid}", m.deposit_paid).replace("{due}", memberBalance(m));
    $("pay-amount").value = "";
    payTargetId = m.id;
    $("dlg-pay").showModal();
  }
});
let payTargetId = null;
$("btn-pay-save").addEventListener("click", () => {
  const amt = +$("pay-amount").value;
  if (!amt || amt <= 0 || !payTargetId) return;
  DB.recordPayment(payTargetId, amt);
  renderAll();
});
$("btn-member-new").addEventListener("click", () => openMemberDialog(null));
function openMemberDialog(m) {
  if (!currentTour()) { alert(t("alert_need_tour")); return; }
  const tour = DB.getTour(currentTourId);
  $("dlg-member-title").textContent = t(m ? "dlg_member_edit" : "dlg_member_new");
  $("member-id").value = m ? m.id : "";
  $("member-name").value = m ? m.name : "";
  $("member-phone").value = m ? m.phone : "";
  $("member-price").value = m ? m.price : tour.price_per_person;
  $("member-paid").value = m ? m.deposit_paid : 0;
  $("member-notes").value = m ? m.notes : "";
  $("dlg-member").showModal();
}
$("btn-member-save").addEventListener("click", () => {
  if (!$("member-name").value.trim()) return;
  DB.saveMember({
    id: $("member-id").value || undefined,
    tour_id: currentTourId,
    name: $("member-name").value.trim(),
    phone: $("member-phone").value.trim(),
    price: $("member-price").value,
    deposit_paid: $("member-paid").value,
    notes: $("member-notes").value.trim(),
  });
  renderAll();
});

// ---- rooms -------------------------------------------------------------------
$("btn-room-new").addEventListener("click", () => {
  if (!currentTour()) { alert(t("alert_need_tour")); return; }
  $("room-label").value = "";
  $("dlg-room").showModal();
});
$("btn-room-save").addEventListener("click", () => {
  if (!$("room-label").value.trim()) return;
  DB.saveRoom({ tour_id: currentTourId, label: $("room-label").value.trim(), type: $("room-type").value });
  renderAll();
});
function renderRooms() {
  const tour = currentTour();
  if (!tour) { $("room-list").innerHTML = ""; $("unassigned-list").innerHTML = ""; return; }
  const members = DB.members(tour.id);
  const byId = Object.fromEntries(members.map((m) => [String(m.id), m]));
  $("room-list").innerHTML = DB.rooms(tour.id).map((r) => {
    const chips = (r.member_ids || []).map((id) => {
      const m = byId[String(id)];
      return m ? `<span class="member-chip">${esc(m.name)}<button data-room="${r.id}" data-m="${m.id}" title="${t("tip_remove")}">✕</button></span>` : "";
    }).join("");
    const opts = members.map((m) =>
      `<option value="${m.id}">${esc(m.name)}</option>`).join("");
    return `<div class="room-box">
      <h3>${esc(r.label)} <span class="muted">${t("room_head_tmpl").replace("{type}", esc(r.type)).replace("{n}", (r.member_ids || []).length)}</span></h3>
      <div>${chips || `<span class="muted">${t("room_empty")}</span>`}</div>
      <div class="toolbar" style="margin-top:0.5rem">
        <select data-addroom="${r.id}"><option value="">${t("opt_add_member")}</option>${opts}</select>
        <button data-roomdel="${r.id}" style="color:var(--red)">${t("btn_room_delete")}</button>
      </div></div>`;
  }).join("") || `<p class="muted">${t("no_rooms")}</p>`;
  $("unassigned-list").innerHTML = DB.unassignedMembers(tour.id).map((m) =>
    `<span class="member-chip">${esc(m.name)}</span>`).join("") || `<span class="muted">${t("rooms_all_assigned")}</span>`;
}
$("room-list").addEventListener("change", (e) => {
  const sel = e.target.closest("select[data-addroom]");
  if (!sel || !sel.value) return;
  DB.assignMember(currentTourId, sel.dataset.addroom, sel.value);
  renderAll();
});
$("room-list").addEventListener("click", (e) => {
  const rm = e.target.closest("button[data-room]");
  if (rm) { DB.unassignMember(currentTourId, rm.dataset.m); renderAll(); return; }
  const del = e.target.closest("button[data-roomdel]");
  if (del && confirm(t("confirm_del_room"))) { DB.deleteRoom(del.dataset.roomdel); renderAll(); }
});

// ---- tours ---------------------------------------------------------------------
$("btn-tour-new").addEventListener("click", () => {
  $("dlg-tour-title").textContent = t("dlg_tour_new");
  $("tour-id").value = ""; $("tour-name").value = ""; $("tour-dest").value = "";
  $("tour-start").value = ""; $("tour-end").value = "";
  $("tour-price").value = ""; $("tour-deposit").value = "";
  $("dlg-tour").showModal();
});
$("btn-tour-edit").addEventListener("click", () => {
  const tour = currentTour();
  if (!tour) { alert(t("alert_need_tour")); return; }
  $("dlg-tour-title").textContent = t("dlg_tour_edit");
  $("tour-id").value = tour.id; $("tour-name").value = tour.name; $("tour-dest").value = tour.destination;
  $("tour-start").value = tour.start_date; $("tour-end").value = tour.end_date;
  $("tour-price").value = tour.price_per_person; $("tour-deposit").value = tour.deposit_per_person;
  $("dlg-tour").showModal();
});
$("btn-tour-save").addEventListener("click", () => {
  if (!$("tour-name").value.trim()) return;
  const tour = DB.saveTour({
    id: $("tour-id").value || undefined,
    name: $("tour-name").value.trim(),
    destination: $("tour-dest").value.trim(),
    start_date: $("tour-start").value,
    end_date: $("tour-end").value,
    price_per_person: $("tour-price").value,
    deposit_per_person: $("tour-deposit").value,
  });
  currentTourId = tour.id;
  refreshTourSelect();
});
$("btn-tour-delete").addEventListener("click", () => {
  const tour = currentTour();
  if (!tour || !confirm(t("confirm_del_tour").replace("{name}", tour.name))) return;
  DB.deleteTour(tour.id);
  currentTourId = null;
  refreshTourSelect();
});

// ---- settings --------------------------------------------------------------------
function loadSettings() {
  const s = DB.settings();
  $("set-operator").value = s.operator_name;
  $("set-fps-id").value = s.fps_id;
  $("set-fps-name").value = s.fps_name;
  $("set-chase").value = s.chase_message;
}
$("frm-settings").addEventListener("submit", (e) => {
  e.preventDefault();
  DB.saveSettings({
    operator_name: $("set-operator").value.trim(),
    fps_id: $("set-fps-id").value.trim(),
    fps_name: $("set-fps-name").value.trim(),
    chase_message: $("set-chase").value,
  });
  alert(t("alert_saved"));
});

// ---- init ------------------------------------------------------------------------
loadSettings();
applyI18n();
refreshTourSelect();
