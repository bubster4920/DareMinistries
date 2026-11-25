/* Dare Ministries — site interactions. No dependencies. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initMobileMenu();
    initSubmenus();
    initReveal();
    initRotator();
    initParallax();
    initDareValues();
    initTabs();
    initVideos();
    initTimeline();
    initCalculator();
    initLibraryFilter();
    initContactForm();
    initMailchimpForm();
    initImageFallbacks();
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });

  /* Header: solid after scrolling, hides on scroll down, shows on scroll up. */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var lastY = window.scrollY;
    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      var goingDown = y > lastY && y > 400;
      header.classList.toggle("is-hidden", goingDown && !document.body.classList.contains("menu-open"));
      lastY = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    var btn = $("[data-menu-toggle]");
    var menu = $("[data-mobile-menu]");
    if (!btn || !menu) return;
    function setOpen(open) {
      btn.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add("is-open"); });
      } else {
        menu.classList.remove("is-open");
        setTimeout(function () { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 350);
      }
    }
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) setOpen(false); });
  }

  function initSubmenus() {
    $$("[data-submenu-toggle]").forEach(function (btn) {
      var li = btn.closest(".has-menu");
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        li.classList.toggle("is-open", open);
      });
      li.addEventListener("mouseleave", function () {
        btn.setAttribute("aria-expanded", "false");
        li.classList.remove("is-open");
      });
    });
  }

  function initReveal() {
    var items = $$("[data-reveal]");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Hero: cycles the word after "Dare to be". */
  function initRotator() {
    var rot = $("[data-rotator]");
    if (!rot) return;
    var words = $$("span", rot);
    if (words.length < 2 || reduceMotion) return;
    var i = 0;
    setInterval(function () {
      var current = words[i];
      i = (i + 1) % words.length;
      var next = words[i];
      current.classList.remove("is-active");
      current.classList.add("is-leaving");
      next.classList.remove("is-leaving");
      next.classList.add("is-active");
      setTimeout(function () { current.classList.remove("is-leaving"); }, 700);
    }, 2400);
  }

  function initParallax() {
    if (reduceMotion || !$(".hero")) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        doc.style.setProperty("--scroll", Math.min(window.scrollY, 1200));
        ticking = false;
      });
    }, { passive: true });
  }

  /* D.A.R.E. values: click/tap to select (hover handled in CSS). */
  function initDareValues() {
    var values = $$(".dare-value");
    values.forEach(function (v) {
      v.addEventListener("click", function () {
        values.forEach(function (o) { o.classList.toggle("is-active", o === v); o.setAttribute("aria-pressed", String(o === v)); });
      });
    });
  }

  function initTabs() {
    $$("[data-tabs]").forEach(function (wrap) {
      var tabs = $$("[role=tab]", wrap);
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          $("#" + t.getAttribute("aria-controls")).hidden = !on;
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function (t, idx) {
        t.addEventListener("click", function () { select(t); });
        t.addEventListener("keydown", function (e) {
          var dir = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : (e.key === "ArrowUp" || e.key === "ArrowLeft") ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          select(tabs[(idx + dir + tabs.length) % tabs.length], true);
        });
      });
    });
  }

  /* YouTube: show a thumbnail and only load the player when clicked. */
  function initVideos() {
    $$("[data-youtube]").forEach(function (box) {
      var id = box.getAttribute("data-youtube");
      var list = box.getAttribute("data-list");
      var btn = $("button", box);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var src = list
          ? "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(list) + "&autoplay=1"
          : "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
        var iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.title = btn.getAttribute("aria-label") || "Video";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        box.innerHTML = "";
        box.appendChild(iframe);
      });
    });
  }

  /* Conference timeline: fills the line as you scroll and lights up each year. */
  function initTimeline() {
    var tl = $("[data-timeline]");
    if (!tl) return;
    var bar = $(".timeline-progress", tl);
    var items = $$(".tl-item", tl);
    function update() {
      var rect = tl.getBoundingClientRect();
      var mid = window.innerHeight * 0.6;
      var pct = Math.max(0, Math.min(1, (mid - rect.top) / rect.height));
      if (bar) bar.style.setProperty("--progress", (pct * 100).toFixed(2) + "%");
      items.forEach(function (it) {
        it.classList.toggle("is-in", it.getBoundingClientRect().top < mid);
      });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* Uganda: sponsor-a-student calculator ($20 per student). */
  function initCalculator() {
    var calc = $("[data-calc]");
    if (!calc) return;
    var range = $("input[type=range]", calc);
    var total = $("[data-calc-total]", calc);
    var count = $("[data-calc-count]", calc);
    var people = $("[data-calc-people]", calc);
    var chips = $$("[data-calc-set]", calc);
    var per = Number(calc.getAttribute("data-per") || 20);
    function render() {
      var n = Number(range.value);
      total.textContent = "$" + (n * per).toLocaleString();
      count.textContent = n === 1 ? "1 student" : n + " students";
      range.setAttribute("aria-valuetext", count.textContent);
      var shown = people.children.length;
      if (n > shown) {
        for (var i = shown; i < n; i++) {
          var dot = document.createElement("i");
          dot.style.animationDelay = ((i - shown) * 18) + "ms";
          people.appendChild(dot);
        }
      } else {
        while (people.children.length > n) people.removeChild(people.lastChild);
      }
      chips.forEach(function (c) { c.classList.toggle("is-active", Number(c.getAttribute("data-calc-set")) === n); });
    }
    range.addEventListener("input", render);
    chips.forEach(function (c) {
      c.addEventListener("click", function () { range.value = c.getAttribute("data-calc-set"); render(); });
    });
    render();
  }

  function initLibraryFilter() {
    var wrap = $("[data-filter]");
    if (!wrap) return;
    var chips = $$("[data-filter-btn]", wrap);
    var items = $$("[data-kind]", wrap);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var kind = chip.getAttribute("data-filter-btn");
        chips.forEach(function (c) { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-pressed", String(c === chip)); });
        items.forEach(function (it) { it.hidden = kind !== "all" && it.getAttribute("data-kind") !== kind; });
      });
    });
  }

  /* Contact: no server, so the form opens the visitor's email app with everything filled in. */
  function initContactForm() {
    var form = $("[data-mailto-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var topic = data.get("topic") || "General question";
      var to = topic === "A question about faith or a prayer request" ? "questions@dareministries.com"
        : topic === "College Bible study" ? "college@dareministries.com"
        : "info@dareministries.com";
      var body = [
        data.get("message"),
        "",
        "—",
        "Name: " + data.get("name"),
        "Email: " + data.get("email"),
        data.get("church") ? "Church: " + data.get("church") : ""
      ].join("\n");
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent("[Website] " + topic) + "&body=" + encodeURIComponent(body);
      var ok = $("[data-form-ok]", form);
      if (ok) ok.hidden = false;
    });
  }

  /* Ireland email signup: posts to Mailchimp (JSONP, so no server is needed) and shows the result in place.
     Without JavaScript the form still works: it submits to Mailchimp in a new tab. */
  function initMailchimpForm() {
    var form = $("[data-mailchimp-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var note = $("[data-form-ok]", form);
      var btn = $("button[type=submit]", form);
      var params = [];
      new FormData(form).forEach(function (v, k) { params.push(encodeURIComponent(k) + "=" + encodeURIComponent(v)); });
      var cb = "mcCallback" + Date.now();
      var script = document.createElement("script");
      var done = false;
      function finish(msg) {
        if (done) return;
        done = true;
        delete window[cb];
        script.remove();
        if (btn) btn.disabled = false;
        if (note) { note.hidden = false; note.textContent = msg; }
      }
      window[cb] = function (res) {
        if (res && res.result === "success") {
          form.reset();
          finish("Thank you! Check your email and confirm your subscription to finish signing up.");
        } else {
          var msg = (res && res.msg ? String(res.msg) : "").replace(/<[^>]*>/g, "").replace(/^\d+\s*-\s*/, "");
          finish(msg || "Something went wrong. Please try again.");
        }
      };
      script.onerror = function () { finish("Something went wrong. Please try again."); };
      setTimeout(function () { finish("Something went wrong. Please try again."); }, 15000);
      if (btn) btn.disabled = true;
      script.src = form.action.replace("/subscribe/post", "/subscribe/post-json") + "&" + params.join("&") + "&c=" + cb;
      document.body.appendChild(script);
    });
  }

  /* Hide images that fail to load so the colored placeholder shows instead. */
  function initImageFallbacks() {
    $$("img").forEach(function (img) {
      function fail() { img.classList.add("is-broken"); }
      if (img.complete && img.naturalWidth === 0 && img.src) fail();
      img.addEventListener("error", fail);
    });
  }

  /* Analytics consent: Google Analytics stays off until the visitor accepts. */
  function initConsent() {
    var KEY = "dare-consent";
    function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function save(v) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: v === "granted" ? "granted" : "denied" });
      }
    }
    function close() { var el = document.getElementById("consent-banner"); if (el) el.remove(); }
    function open() {
      if (document.getElementById("consent-banner")) return;
      var el = document.createElement("div");
      el.id = "consent-banner";
      el.className = "consent-banner";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "Cookie preferences");
      el.innerHTML = '<p>We use Google Analytics cookies to see, in aggregate, how people use this site. They are off unless you say yes. <a href="' + document.querySelector(".brand").getAttribute("href") + 'privacy/">Privacy policy</a></p>' +
        '<div class="consent-actions"><button type="button" class="btn consent-decline" data-consent="denied">Decline</button><button type="button" class="btn btn-ember consent-accept" data-consent="granted">Accept</button></div>';
      el.addEventListener("click", function (e) {
        var v = e.target.getAttribute && e.target.getAttribute("data-consent");
        if (v) { save(v); close(); }
      });
      document.body.appendChild(el);
    }
    $$("[data-cookie-settings]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });
    if (!saved()) open();
  }
  initConsent();
})();
