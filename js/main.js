/* ============================================================
   שיא הנחלה – לוגיקת דף הנחיתה (ללא תלויות חיצוניות)
   ============================================================ */
(function () {
  "use strict";
  var C = window.LP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RTL = document.documentElement.dir === "rtl";

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

  /* ---------- mobile menu ---------- */
  var menu = $("[data-menu]"), menuBtn = $("[data-menu-toggle]");
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", function () { menu.hidden = !menu.hidden; });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.hidden = true; }); });
  }

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

  /* ---------- lead form ---------- */
  function validPhone(v) {
    var d = v.replace(/\D/g, "");
    return /^(0?5\d{8}|0?[2-9]\d{7}|9725\d{8})$/.test(d);
  }
  $$("[data-lead-form]").forEach(function (form) {
    var btn = $("button[type=submit]", form);
    var err = $(".cf__error", form);
    var success = form.parentElement.querySelector(".cf__success");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.hidden = true;
      $$("input", form).forEach(function (i) { i.classList.remove("is-invalid"); });

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var email = form.email ? form.email.value.trim() : "";
      var problems = [];
      if (name.length < 2) { problems.push("נא להזין שם מלא"); form.name.classList.add("is-invalid"); }
      if (!validPhone(phone)) { problems.push("נא להזין מספר טלפון תקין"); form.phone.classList.add("is-invalid"); }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { problems.push("כתובת האימייל אינה תקינה"); form.email.classList.add("is-invalid"); }
      if (!form.consent.checked) problems.push("יש לאשר את תנאי השימוש ומדיניות הפרטיות");
      if (problems.length) { err.textContent = problems[0]; err.hidden = false; return; }

      var payload = {
        name: name, phone: phone, email: email,
        project: "שיא הנחלה - נתיבות",
        source: form.getAttribute("data-source") || "",
        page: location.href, referrer: document.referrer, time: new Date().toISOString()
      };
      for (var k in utm) payload[k] = utm[k];

      btn.classList.add("is-loading");
      send(payload).then(function () {
        form.hidden = true;
        if (success) success.hidden = false;
        track("Lead", { content_name: "שיא הנחלה" });
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
    return fetch(C.leadWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); });
  }

  /* ---------- hero fade slider ---------- */
  var hero = $("[data-hero]"), dotsWrap = $("[data-hero-dots]");
  if (hero) {
    var slides = $$("img", hero), idx = 0, timer;
    slides.forEach(function (_, i) {
      var d = document.createElement("span"); if (i === 0) d.classList.add("is-active");
      d.addEventListener("click", function () { go(i); restart(); });
      dotsWrap.appendChild(d);
    });
    var dots = $$("span", dotsWrap);
    function go(i) {
      slides[idx].classList.remove("is-active"); dots[idx].classList.remove("is-active");
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add("is-active"); dots[idx].classList.add("is-active");
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 5000); }
    restart();
  }

  /* ---------- scroll-snap sliders (gallery + plans) ---------- */
  function slider(root, trackSel, itemSel, opts) {
    if (!root) return;
    var track = $(trackSel, root), items = $$(itemSel, track);
    var progress = root.parentElement.querySelector("[data-progress]");
    function step() { var r = items[0].getBoundingClientRect(); return r.width + (opts.gap || 0); }
    function scrollBy(dir) { track.scrollBy({ left: dir * step() * (RTL ? -1 : 1), behavior: "smooth" }); }
    var prev = $("[data-prev]", root), next = $("[data-next]", root);
    if (prev) prev.addEventListener("click", function () { scrollBy(-1); });
    if (next) next.addEventListener("click", function () { scrollBy(1); });

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var pos = Math.abs(track.scrollLeft);
      var ratio = max > 0 ? Math.min(1, pos / max) : 0;
      if (progress) {
        var w = Math.max(12, (track.clientWidth / track.scrollWidth) * 100);
        progress.style.width = w + "%";
        progress.style.insetInlineStart = (ratio * (100 - w)) + "%";
      }
      if (opts.center) {
        var cx = track.getBoundingClientRect().left + track.clientWidth / 2, best = null, bd = 1e9;
        items.forEach(function (it) {
          var r = it.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - cx);
          if (d < bd) { bd = d; best = it; }
        });
        items.forEach(function (it) { it.classList.toggle("is-center", it === best); });
      }
    }
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    if (opts.center) {
      // start on the first slide, centered
      requestAnimationFrame(function () {
        var first = items[0], r = first.getBoundingClientRect(), tr = track.getBoundingClientRect();
        track.scrollLeft += (r.left + r.width / 2) - (tr.left + tr.width / 2);
        update();
      });
    }
  }
  slider($("[data-gallery]"), ".design__track", "figure", { gap: 24, center: true });
  slider($("[data-plans]"), ".plans__track", "article", { gap: 22 });

  /* ---------- lightbox ---------- */
  var lb = $("[data-lightbox-root]");
  if (lb) {
    var lbImg = $("img", lb);
    $$("[data-lightbox]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault(); lbImg.src = a.href; lbImg.alt = $("img", a).alt; lb.hidden = false; document.body.style.overflow = "hidden";
        track("ViewContent", { content_name: lbImg.alt });
      });
    });
    function close() { lb.hidden = true; document.body.style.overflow = ""; }
    $("[data-lightbox-close]", lb).addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) close(); });
  }

  /* ---------- rewrite image base if assets are local ---------- */
  var defaultBase = "https://crp.co.il/wp-content/uploads/2026/02/";
  if (C.assetBase && C.assetBase !== defaultBase) {
    $$("img").forEach(function (img) { if (img.src.indexOf(defaultBase) === 0) img.src = C.assetBase + img.src.slice(defaultBase.length); });
    $$("[data-lightbox]").forEach(function (a) { if (a.href.indexOf(defaultBase) === 0) a.href = C.assetBase + a.href.slice(defaultBase.length); });
  }
})();
