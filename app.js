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
  ).join("") || '<option value="">（未有旅行團）</option>';
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
  const t = currentTour();
  $("tour-title").textContent = t ? `${t.name}${t.destination ? " · " + t.destination : ""}${t.start_date ? "（" + t.start_date + "）" : ""}` : "團概覽";
  const st = t ? DB.stats(t.id) : { count: 0, collected: 0, outstanding: 0, unpaid: 0, rooms: 0 };
  $("st-count").textContent = st.count;
  $("st-collected").textContent = st.collected;
  $("st-outstanding").textContent = st.outstanding;
  $("st-unpaid").textContent = st.unpaid;
  $("st-rooms").textContent = st.rooms;
}

// ---- members -----------------------------------------------------------------
function statusPill(status) {
  return `<span class="pill pill-${status}">${MEMBER_STATUS_LABELS[status]}</span>`;
}
function renderMembers() {
  const t = currentTour();
  const rows = t ? DB.members(t.id).map((m) => {
    const status = memberStatus(m);
    const link = DB.chaseLink(m);
    const room = DB.roomOfMember(t.id, m.id);
    return `<tr>
      <td>${esc(m.name)}</td><td>${esc(m.phone)}</td>
      <td>${m.price}</td><td>${m.deposit_paid}</td><td>${memberBalance(m)}</td>
      <td>${statusPill(status)}</td>
      <td>${room ? esc(room.label) : "<span class='muted'>未編房</span>"}</td>
      <td><div class="row-actions">
        ${link ? `<a href="${link}" target="_blank" rel="noopener">📲 追款</a>` : ""}
        <button data-act="pay" data-id="${m.id}">＋ 付款</button>
        <button data-act="edit" data-id="${m.id}">編輯</button>
        <button data-act="del" data-id="${m.id}" style="color:var(--red)">刪除</button>
      </div></td></tr>`;
  }).join("") : "";
  $("member-rows").innerHTML = rows || `<tr><td colspan="8" class="muted">未有團員</td></tr>`;
}
$("member-rows").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const m = DB.getMember(btn.dataset.id);
  if (!m) return;
  if (btn.dataset.act === "edit") openMemberDialog(m);
  if (btn.dataset.act === "del" && confirm(`刪除團員「${m.name}」？`)) {
    DB.deleteMember(m.id); renderAll();
  }
  if (btn.dataset.act === "pay") {
    $("pay-info").textContent = `${m.name}：已付 ${m.deposit_paid}，尚欠 ${memberBalance(m)}`;
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
  if (!currentTour()) { alert("請先新增旅行團"); return; }
  const t = DB.getTour(currentTourId);
  $("dlg-member-title").textContent = m ? "編輯團員" : "新增團員";
  $("member-id").value = m ? m.id : "";
  $("member-name").value = m ? m.name : "";
  $("member-phone").value = m ? m.phone : "";
  $("member-price").value = m ? m.price : t.price_per_person;
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
  if (!currentTour()) { alert("請先新增旅行團"); return; }
  $("room-label").value = "";
  $("dlg-room").showModal();
});
$("btn-room-save").addEventListener("click", () => {
  if (!$("room-label").value.trim()) return;
  DB.saveRoom({ tour_id: currentTourId, label: $("room-label").value.trim(), type: $("room-type").value });
  renderAll();
});
function renderRooms() {
  const t = currentTour();
  if (!t) { $("room-list").innerHTML = ""; $("unassigned-list").innerHTML = ""; return; }
  const members = DB.members(t.id);
  const byId = Object.fromEntries(members.map((m) => [String(m.id), m]));
  $("room-list").innerHTML = DB.rooms(t.id).map((r) => {
    const chips = (r.member_ids || []).map((id) => {
      const m = byId[String(id)];
      return m ? `<span class="member-chip">${esc(m.name)}<button data-room="${r.id}" data-m="${m.id}" title="移出">✕</button></span>` : "";
    }).join("");
    const opts = members.map((m) =>
      `<option value="${m.id}">${esc(m.name)}</option>`).join("");
    return `<div class="room-box">
      <h3>${esc(r.label)} <span class="muted">（${esc(r.type)} · ${(r.member_ids || []).length} 人）</span></h3>
      <div>${chips || '<span class="muted">未有人</span>'}</div>
      <div class="toolbar" style="margin-top:0.5rem">
        <select data-addroom="${r.id}"><option value="">＋ 加入團員…</option>${opts}</select>
        <button data-roomdel="${r.id}" style="color:var(--red)">刪除房間</button>
      </div></div>`;
  }).join("") || '<p class="muted">未有房間</p>';
  $("unassigned-list").innerHTML = DB.unassignedMembers(t.id).map((m) =>
    `<span class="member-chip">${esc(m.name)}</span>`).join("") || '<span class="muted">全部已編房</span>';
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
  if (del && confirm("刪除此房間？")) { DB.deleteRoom(del.dataset.roomdel); renderAll(); }
});

// ---- tours ---------------------------------------------------------------------
$("btn-tour-new").addEventListener("click", () => {
  $("dlg-tour-title").textContent = "新增旅行團";
  $("tour-id").value = ""; $("tour-name").value = ""; $("tour-dest").value = "";
  $("tour-start").value = ""; $("tour-end").value = "";
  $("tour-price").value = ""; $("tour-deposit").value = "";
  $("dlg-tour").showModal();
});
$("btn-tour-edit").addEventListener("click", () => {
  const t = currentTour();
  if (!t) { alert("請先新增旅行團"); return; }
  $("dlg-tour-title").textContent = "編輯旅行團";
  $("tour-id").value = t.id; $("tour-name").value = t.name; $("tour-dest").value = t.destination;
  $("tour-start").value = t.start_date; $("tour-end").value = t.end_date;
  $("tour-price").value = t.price_per_person; $("tour-deposit").value = t.deposit_per_person;
  $("dlg-tour").showModal();
});
$("btn-tour-save").addEventListener("click", () => {
  if (!$("tour-name").value.trim()) return;
  const t = DB.saveTour({
    id: $("tour-id").value || undefined,
    name: $("tour-name").value.trim(),
    destination: $("tour-dest").value.trim(),
    start_date: $("tour-start").value,
    end_date: $("tour-end").value,
    price_per_person: $("tour-price").value,
    deposit_per_person: $("tour-deposit").value,
  });
  currentTourId = t.id;
  refreshTourSelect();
});
$("btn-tour-delete").addEventListener("click", () => {
  const t = currentTour();
  if (!t || !confirm(`刪除旅行團「${t.name}」及所有團員和房間？`)) return;
  DB.deleteTour(t.id);
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
  alert("已儲存");
});

// ---- init ------------------------------------------------------------------------
loadSettings();
refreshTourSelect();
