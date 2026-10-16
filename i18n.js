/* i18n — EN / 繁中 language switch for the group travel rooming + deposit ops app.
   UI language only; user data is never translated. Persisted per browser. */
"use strict";

const I18N = {
  zh: {
    title: "旅行團房間＋訂金管理",
    brand: "🧳 旅行團管理",
    tab_tours: "團", tab_members: "團員",
    tab_rooms: "房間", tab_settings: "設定",
    lbl_select_tour: "選擇旅行團：", btn_tour_new: "＋ 新增旅行團",
    dash_title: "團概覽",
    card_members: "團員人數", card_collected: "已收款 (HKD)",
    card_outstanding: "尚欠 (HKD)", card_unpaid_n: "未付人數",
    card_rooms: "房間數",
    btn_tour_edit: "✏️ 編輯此團", btn_tour_delete: "🗑 刪除此團",
    members_title: "團員名單", btn_member_new: "＋ 新增團員",
    th_name: "姓名", th_phone: "電話", th_price: "團費", th_paid: "已付",
    th_balance: "尚欠", th_status: "狀態", th_room: "房間", th_actions: "操作",
    rooms_title: "房間編排", btn_room_new: "＋ 新增房間",
    rooms_unassigned_title: "未編房團員",
    settings_title: "設定",
    lbl_operator: "公司／操作員名稱",
    lbl_fps_id: "FPS 轉數 ID",
    lbl_fps_name: "FPS 登記姓名",
    lbl_chase_msg: "WhatsApp 追款訊息",
    settings_vars: "可用變數：{operator} {tour} {price} {deposit} {due} {fps_id} {fps_name}",
    btn_save_settings: "儲存設定",
    settings_backup_title: "備份／還原",
    btn_export: "匯出備份 (JSON)", btn_import: "匯入備份…",
    alert_import_ok: "備份已還原",
    alert_import_bad: "備份檔案格式不正確，未還原任何資料",
    dlg_tour_new: "新增旅行團", dlg_tour_edit: "編輯旅行團",
    lbl_tour_name: "團名", lbl_tour_dest: "目的地",
    lbl_tour_start: "出發日期", lbl_tour_end: "回程日期",
    lbl_tour_price: "每人團費 (HKD)", lbl_tour_deposit: "每人訂金 (HKD)",
    btn_save: "儲存", btn_cancel: "取消",
    dlg_member_new: "新增團員", dlg_member_edit: "編輯團員",
    lbl_member_name: "姓名", lbl_member_phone: "電話",
    ph_phone_8: "8位數字",
    lbl_member_price: "團費 (HKD)", lbl_member_paid: "已付金額 (HKD)",
    lbl_member_notes: "備註",
    dlg_room_new: "新增房間", dlg_room_edit: "編輯房間",
    lbl_room_label: "房號／標籤", ph_room_label: "例：301",
    lbl_room_type: "房型",
    dlg_pay_title: "記錄付款", lbl_pay_amount: "金額 (HKD)",
    opt_no_tours: "（未有旅行團）",
    status_unpaid: "未付", status_deposit: "已付訂金", status_paid: "已付清",
    room_unassigned: "未編房",
    btn_chase: "📲 追款", btn_pay: "＋ 付款",
    btn_edit: "編輯", btn_delete: "刪除",
    no_members: "未有團員",
    confirm_del_member: "刪除團員「{name}」？",
    pay_info_tmpl: "{name}：已付 {paid}，尚欠 {due}",
    alert_need_tour: "請先新增旅行團",
    tip_remove: "移出",
    room_head_tmpl: "（{type} · {n} 人）",
    room_empty: "未有人",
    opt_add_member: "＋ 加入團員…",
    btn_room_delete: "刪除房間",
    no_rooms: "未有房間",
    rooms_all_assigned: "全部已編房",
    confirm_del_room: "刪除此房間？",
    confirm_del_tour: "刪除旅行團「{name}」及所有團員和房間？",
    alert_saved: "已儲存",
  },
  en: {
    title: "Group Tour Rooms & Deposits",
    brand: "🧳 Group Tour Ops",
    tab_tours: "Tours", tab_members: "Members",
    tab_rooms: "Rooms", tab_settings: "Settings",
    lbl_select_tour: "Select tour: ", btn_tour_new: "＋ New tour",
    dash_title: "Tour overview",
    card_members: "Members", card_collected: "Collected (HKD)",
    card_outstanding: "Balance due (HKD)", card_unpaid_n: "Unpaid members",
    card_rooms: "Rooms",
    btn_tour_edit: "✏️ Edit this tour", btn_tour_delete: "🗑 Delete this tour",
    members_title: "Member list", btn_member_new: "＋ New member",
    th_name: "Name", th_phone: "Phone", th_price: "Fee", th_paid: "Paid",
    th_balance: "Balance", th_status: "Status", th_room: "Room", th_actions: "Actions",
    rooms_title: "Room assignments", btn_room_new: "＋ New room",
    rooms_unassigned_title: "Unassigned members",
    settings_title: "Settings",
    lbl_operator: "Company / operator name",
    lbl_fps_id: "FPS transfer ID",
    lbl_fps_name: "FPS account name",
    lbl_chase_msg: "WhatsApp payment-chase message",
    settings_vars: "Available variables: {operator} {tour} {price} {deposit} {due} {fps_id} {fps_name}",
    btn_save_settings: "Save settings",
    settings_backup_title: "Backup & restore",
    btn_export: "Export backup (JSON)", btn_import: "Import backup…",
    alert_import_ok: "Backup restored",
    alert_import_bad: "Invalid backup file — nothing was restored",
    dlg_tour_new: "New tour", dlg_tour_edit: "Edit tour",
    lbl_tour_name: "Tour name", lbl_tour_dest: "Destination",
    lbl_tour_start: "Departure date", lbl_tour_end: "Return date",
    lbl_tour_price: "Fee per person (HKD)", lbl_tour_deposit: "Deposit per person (HKD)",
    btn_save: "Save", btn_cancel: "Cancel",
    dlg_member_new: "New member", dlg_member_edit: "Edit member",
    lbl_member_name: "Name", lbl_member_phone: "Phone",
    ph_phone_8: "8 digits",
    lbl_member_price: "Fee (HKD)", lbl_member_paid: "Amount paid (HKD)",
    lbl_member_notes: "Notes",
    dlg_room_new: "New room", dlg_room_edit: "Edit room",
    lbl_room_label: "Room no. / label", ph_room_label: "e.g. 301",
    lbl_room_type: "Room type",
    dlg_pay_title: "Record payment", lbl_pay_amount: "Amount (HKD)",
    opt_no_tours: "(No tours yet)",
    status_unpaid: "Unpaid", status_deposit: "Deposit paid", status_paid: "Fully paid",
    room_unassigned: "Unassigned",
    btn_chase: "📲 Chase", btn_pay: "＋ Payment",
    btn_edit: "Edit", btn_delete: "Delete",
    no_members: "No members yet",
    confirm_del_member: "Delete member “{name}”?",
    pay_info_tmpl: "{name}: paid {paid}, balance {due}",
    alert_need_tour: "Please add a tour first",
    tip_remove: "Remove",
    room_head_tmpl: "({type} · {n} ppl)",
    room_empty: "Empty",
    opt_add_member: "＋ Add member…",
    btn_room_delete: "Delete room",
    no_rooms: "No rooms yet",
    rooms_all_assigned: "All assigned",
    confirm_del_room: "Delete this room?",
    confirm_del_tour: "Delete tour “{name}” and all members and rooms?",
    alert_saved: "Saved",
  },
};

let LANG = "zh";
try {
  LANG = localStorage.getItem("gto_lang") === "en" ? "en" : "zh";
} catch { /* storage unavailable: keep default */ }

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || I18N.zh[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll("[data-lang-btn]").forEach((b) =>
    b.classList.toggle("active", b.dataset.langBtn === LANG));
  document.documentElement.lang = LANG === "zh" ? "zh-Hant" : "en";
  document.title = t("title");
}

function setLang(next) {
  if (next !== "zh" && next !== "en") return;
  LANG = next;
  try { localStorage.setItem("gto_lang", LANG); } catch { /* ignore */ }
  applyI18n();
  if (typeof renderAll === "function") renderAll();
  if (typeof window.onLangChange === "function") window.onLangChange();
}

document.querySelectorAll("[data-lang-btn]").forEach((b) =>
  b.addEventListener("click", () => setLang(b.dataset.langBtn)));
