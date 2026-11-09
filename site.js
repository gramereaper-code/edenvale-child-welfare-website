(function () {
  "use strict";

  var currentScript = document.currentScript;
  var siteBase = currentScript && currentScript.src
    ? new URL(".", currentScript.src)
    : new URL(".", window.location.href);
  var showLoader = true;
  try {
    showLoader = window.sessionStorage.getItem("edenvale-loader-seen") !== "1";
    if (showLoader) window.sessionStorage.setItem("edenvale-loader-seen", "1");
  } catch (error) {
    // If storage is unavailable, keep the loader enabled for this page.
  }

  if (showLoader) {
    var loader = document.createElement("div");
    loader.className = "site-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");

    var stage = document.createElement("div");
    stage.className = "site-loader__stage";

    var video = document.createElement("video");
    video.muted = true;
    // The exported Liquid Glass animation plays once before the page is revealed.
    video.loop = false;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");

    var loadingText = document.createElement("span");
    loadingText.className = "site-loader__sr-only";
    loadingText.textContent = "Loading Child Welfare South Africa Edenvale";

    stage.appendChild(video);
    loader.appendChild(stage);
    loader.appendChild(loadingText);
    document.body.insertBefore(loader, document.body.firstChild);

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      dismissLoader();
    } else {
      video.addEventListener("error", function () {
        dismissLoader();
      }, { once: true });
      video.addEventListener("ended", function () {
        dismissLoader();
      }, { once: true });
      video.src = new URL("assets/edenvale-loader.mp4", siteBase).href;
      var playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () { dismissLoader(); });
      }
    }

    var loaderDismissed = false;
    function dismissLoader() {
      if (loaderDismissed) return;
      loaderDismissed = true;
      loader.classList.add("is-leaving");
      window.setTimeout(function () { loader.remove(); }, 360);
    }
  }
  var brand = document.querySelector(".brand");
  var navWrap = brand && brand.parentElement;
  if (navWrap && !navWrap.querySelector(".brand-pinocchio")) {
    var pinocchioMark = document.createElement("img");
    pinocchioMark.className = "brand-pinocchio";
    pinocchioMark.src = new URL("images/cartoons/pinocchio.png", siteBase).href;
    pinocchioMark.alt = "";
    pinocchioMark.setAttribute("aria-hidden", "true");
    brand.insertAdjacentElement("afterend", pinocchioMark);
  }

  var toggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-site-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  var path = window.location.pathname.replace(/\\/g, "/");
  document.querySelectorAll("[data-nav-link]").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href && path.endsWith(href.replace(/^\.\.\//, ""))) link.setAttribute("aria-current", "page");
  });

  document.querySelectorAll("[data-accordion-trigger]").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".accordion-item");
      var open = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
  });

  document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    var buttons = tabs.querySelectorAll("[data-tab]");
    var panels = tabs.querySelectorAll("[data-tab-panel]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var target = button.getAttribute("data-tab");
        buttons.forEach(function (b) { b.setAttribute("aria-selected", String(b === button)); });
        panels.forEach(function (panel) { panel.hidden = panel.getAttribute("data-tab-panel") !== target; });
      });
    });
  });

  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var status = form.querySelector(".form-status");
      if (!form.checkValidity()) {
        event.preventDefault();
        if (status) { status.textContent = "Please complete the required fields before sending your message."; status.dataset.state = "error"; }
        form.reportValidity();
      }
    });
  });

  var cookie = document.querySelector("[data-cookie]");
  if (cookie && localStorage.getItem("ecw-cookie-choice")) cookie.hidden = true;
  document.querySelectorAll("[data-cookie-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      localStorage.setItem("ecw-cookie-choice", button.dataset.cookieChoice);
      if (cookie) cookie.hidden = true;
    });
  });

  function addSpice(parent, file, className) {
    if (!parent || parent.querySelector("." + className.split(" ")[0] + "." + className.split(" ").slice(1).join("."))) return;
    var img = document.createElement("img");
    img.className = className;
    img.src = new URL("images/Cartoons/" + file, siteBase).href;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.decoding = "async";
    parent.appendChild(img);
  }

  var hero = document.querySelector(".hero, .page-hero");
  var sections = document.querySelectorAll("main .section");
  addSpice(hero, "family-together.svg", "cartoon-spice cartoon-spice--corner cartoon-spice--keep");
  if (sections[0]) addSpice(sections[0], "children-playground.svg", "cartoon-spice cartoon-spice--left");
  if (sections[1]) addSpice(sections[1], "family-picnic.svg", "cartoon-spice cartoon-spice--right");
  if (sections[2]) addSpice(sections[2], "kids-circle.svg", "cartoon-spice cartoon-spice--left");

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealNodes = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach(function (node) { node.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach(function (node) { revealObserver.observe(node); });
    // Hero content should feel present quickly after the loader.
    window.setTimeout(function () {
      document.querySelectorAll(".hero [data-reveal]").forEach(function (node) {
        node.classList.add("is-visible");
        revealObserver.unobserve(node);
      });
    }, 120);
  }
})();
