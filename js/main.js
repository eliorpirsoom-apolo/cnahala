/* ============================================================
   שיא הנחלה – לוגיקת דף הנחיתה (ללא תלויות חיצוניות)
   ============================================================ */
(function () {
  "use strict";
  var C = window.LP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- contact links from config ---------- */
  var telDigits = (C.phone || "").replace(/[^\d+]/g, "");
  $$("[data-tel]").forEach(function (a) { a.href = "tel:" + telDigits; a.addEventListener("click", function () { track("Contact", { method: "phone" }); }); });
  $$("[data-phone-text]").forEach(function (s) { s.textContent = C.phone || ""; });
  $$("[data-mail]").forEach(function (a) { a.href = "mailto:" + (C.email || ""); });
  $$("[data-mail-text]").forEach(function (s) { s.textContent = C.email || ""; });
  var waUrl = "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(C.whatsappText || "");
  $$("[data-wa]").forEach(function (a) {
    a.href = waUrl; a.target = "_blank"; a.rel = "noopener";
    a.addEventListener("click", function () { track("Contact", { method: "whatsapp" }); });
  });
  $$("[data-year]").forEach(function (s) { s.textContent = new Date().getFullYear(); });

  /* ---------- tracking bootstrap ---------- */
  if (C.facebookPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", C.facebookPixelId); fbq("track", "PageView");
  }
  if (C.gtmId) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtm.js?id=" + C.gtmId; document.head.appendChild(g);
  }
  function track(name, params) {
    try { if (window.fbq) fbq("track", name, params || {}); } catch (e) {}
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name.toLowerCase(), params: params || {} }); } catch (e) {}
    try { if (name === "Lead" && window.gtag && C.googleAdsConversion) gtag("event", "conversion", { send_to: C.googleAdsConversion }); } catch (e) {}
  }

  /* ---------- UTM capture ---------- */
  var utm = {};
  try {
    var qs = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(function (k) { if (qs.get(k)) utm[k] = qs.get(k); });
    if (Object.keys(utm).length) sessionStorage.setItem("lp_utm", JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem("lp_utm") || "{}");
  } catch (e) {}

  /* ---------- lead forms ---------- */
  function validPhone(v) {
    var d = v.replace(/\D/g, "");
    return /^(0?5\d{8}|0?[2-9]\d{7}|9725\d{8})$/.test(d);
  }
  $$("[data-lead-form]").forEach(function (form) {
    var btn = $("button[type=submit]", form);
    var err = $(".form__error", form);
    var success = form.parentElement.querySelector(".lead-form__success");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.hidden = true;
      $$("input", form).forEach(function (i) { i.classList.remove("is-invalid"); });

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var problems = [];
      if (name.length < 2) { problems.push("נא להזין שם מלא"); form.name.classList.add("is-invalid"); }
      if (!validPhone(phone)) { problems.push("נא להזין מספר טלפון תקין"); form.phone.classList.add("is-invalid"); }
      if (form.email && form.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) { problems.push("כתובת האימייל אינה תקינה"); form.email.classList.add("is-invalid"); }
      if (!form.consent.checked) problems.push("יש לאשר את תנאי יצירת הקשר");
      if (problems.length) { err.textContent = problems[0]; err.hidden = false; return; }

      var payload = {
        name: name,
        phone: phone,
        email: form.email ? form.email.value.trim() : "",
        rooms: form.rooms ? form.rooms.value : "",
        project: "שיא הנחלה - נתיבות",
        source: form.getAttribute("data-source") || "",
        page: location.href,
        referrer: document.referrer,
        time: new Date().toISOString()
      };
      for (var k in utm) payload[k] = utm[k];

      btn.classList.add("is-loading");
      send(payload).then(function () {
        form.hidden = true;
        if (success) success.hidden = false;
        track("Lead", { content_name: "שיא הנחלה", content_category: payload.rooms || "lead" });
        try { success.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
      }).catch(function () {
        err.textContent = "אירעה שגיאה בשליחה. נסו שוב או התקשרו אלינו: " + (C.phone || "");
        err.hidden = false;
      }).then(function () { btn.classList.remove("is-loading"); });
    });
  });

  function send(payload) {
    if (!C.leadWebhook) {
      console.info("[LP demo] leadWebhook לא מוגדר ב-js/config.js. הליד:", payload);
      return new Promise(function (r) { setTimeout(r, 600); });
    }
    return fetch(C.leadWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); });
  }

  /* ---------- prefill room type from type cards ---------- */
  $$("[data-prefill]").forEach(function (a) {
    a.addEventListener("click", function () {
      var sel = $("#h-rooms"); if (!sel) return;
      var val = a.getAttribute("data-prefill");
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === val) { sel.selectedIndex = i; break; }
    });
  });

  /* ---------- floor plan tabs ---------- */
  var planImg = $("#plan-img"), planCap = $("#plan-caption");
  var base = C.assetBase || "https://crp.co.il/wp-content/uploads/2026/02/";
  $$(".plans__tabs [data-plan]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".plans__tabs [data-plan]").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      tab.setAttribute("aria-selected", "true");
      var code = tab.getAttribute("data-plan");
      planImg.src = base + code + ".webp";
      planImg.alt = "תוכנית " + tab.textContent;
      planCap.textContent = tab.textContent.replace(" · ", " - ");
      track("ViewContent", { content_name: "plan " + code });
    });
  });

  /* ---------- gallery controls ---------- */
  var track_ = $("[data-gallery]");
  function slide(dir) {
    if (!track_) return;
    var w = track_.querySelector("img").getBoundingClientRect().width + 14;
    track_.scrollBy({ left: dir * w * (document.dir === "rtl" ? -1 : 1), behavior: "smooth" });
  }
  var prev = $("[data-gal-prev]"), next = $("[data-gal-next]");
  if (prev) prev.addEventListener("click", function () { slide(-1); });
  if (next) next.addEventListener("click", function () { slide(1); });

  /* ---------- rewrite image base if assets are local ---------- */
  var defaultBase = "https://crp.co.il/wp-content/uploads/2026/02/";
  if (C.assetBase && C.assetBase !== defaultBase) {
    $$("img").forEach(function (img) { if (img.src.indexOf(defaultBase) === 0) img.src = C.assetBase + img.src.slice(defaultBase.length); });
  }
})();
