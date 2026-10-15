# 旅行團房間＋訂金管理 (Group Travel Rooming + Deposit Ops) v1

Static single-page app for small tour operators. All data in browser localStorage.
No backend, no paid APIs. WhatsApp chasing via wa.me deep links (owner taps send manually).

## Job it does
1. 建立旅行團（團名、目的地、日期、每人團費、每人訂金）
2. 加入團員（自動帶入團費，可個別修改；記錄付款）
3. WhatsApp 一鍵追款：預填訊息含團名、金額、FPS 資料
4. 房間編排：團員只可同時入一間房；未編房名單一目了然
5. 每團概覽：團員人數、已收款、尚欠、未付人數、房間數

## Files
- index.html, db.js (data layer + WhatsApp link builder), app.js, style.css, vercel.json

## Deploy
Static root with vercel.json (cleanUrls) — deploy the folder on Vercel as-is.
