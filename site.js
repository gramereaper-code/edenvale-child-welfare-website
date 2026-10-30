(function () {
  "use strict";

  var currentScript = document.currentScript;
  var siteBase = currentScript && currentScript.src
    ? new URL(".", currentScript.src)
    : new URL(".", window.location.href);
  var alreadyShown = false;
  try {
    alreadyShown = window.sessionStorage.getItem("ecw-loader-shown") === "1";
  } catch (error) {
    // If storage is unavailable, keep the loader functional for this page view.
  }

  if (!alreadyShown) {
    try { window.sessionStorage.setItem("ecw-loader-shown", "1"); } catch (error) {}

    var loader = document.createElement("div");
    loader.className = "site-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");

    var stage = document.createElement("div");
    stage.className = "site-loader__stage";

    var video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-hidden", "true");

    var still = document.createElement("img");
    still.className = "site-loader__still";
    still.alt = "";
    still.setAttribute("aria-hidden", "true");
    still.src = new URL("assets/edenvale-loader-poster.webp", siteBase).href;
    video.poster = still.src;

    var loadingText = document.createElement("span");
    loadingText.className = "site-loader__sr-only";
    loadingText.textContent = "Loading Child Welfare South Africa Edenvale";

    stage.appendChild(video);
    stage.appendChild(still);
    loader.appendChild(stage);
    loader.appendChild(loadingText);
    document.body.insertBefore(loader, document.body.firstChild);

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      loader.classList.add("is-static");
    } else {
      video.addEventListener("error", function () { loader.classList.add("is-static"); }, { once: true });
      video.src = new URL("assets/edenvale-loader.mp4", siteBase).href;
      var playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () { loader.classList.add("is-static"); });
      }
    }

    var loaderStartedAt = performance.now();
    var loaderDismissed = false;
    function dismissLoader() {
      if (loaderDismissed) return;
      loaderDismissed = true;
      loader.classList.add("is-leaving");
      window.setTimeout(function () { loader.remove(); }, 360);
    }
    function afterPageLoad() {
      var remaining = Math.max(0, 3350 - (performance.now() - loaderStartedAt));
      window.setTimeout(dismissLoader, remaining);
    }
    if (document.readyState === "complete") afterPageLoad();
    else window.addEventListener("load", afterPageLoad, { once: true });
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

  // ECW Chatbot is injected so the static pages share one accessible assistant UI.
  var assistantRoot = document.createElement("aside");
  assistantRoot.className = "pinocchio";
  assistantRoot.innerHTML = '<button class="pinocchio-launcher" type="button" aria-expanded="false" aria-controls="pinocchio-panel"><span class="pinocchio-avatar" aria-hidden="true">E</span><span>Ask ECW Chatbot</span></button>' +
    '<section class="pinocchio-panel" id="pinocchio-panel" hidden aria-label="ECW Chatbot">' +
    '<div class="pinocchio-header"><div><strong>ECW Chatbot</strong><span>Child Welfare SA Edenvale</span></div><button class="pinocchio-close" type="button" aria-label="Close ECW Chatbot">×</button></div>' +
    '<div class="pinocchio-disclaimer">I’m an AI assistant, not a social worker. Please do not share names, addresses, ID numbers or private case details.</div>' +
    '<div class="pinocchio-messages" aria-live="polite" aria-atomic="false"><div class="pinocchio-message pinocchio-message--assistant">Ask about services, public contact details, support options or Pinocchio Educare Centre.</div></div>' +
    '<div class="pinocchio-suggestions"><button type="button" data-pinocchio-suggestion>What services do you offer?</button><button type="button" data-pinocchio-suggestion>How can I ask for help?</button><button type="button" data-pinocchio-suggestion>What is Pinocchio Educare Centre?</button></div>' +
    '<form class="pinocchio-form"><label class="pinocchio-sr-only" for="pinocchio-input">Ask ECW Chatbot a question</label><input id="pinocchio-input" maxlength="1000" autocomplete="off" placeholder="Ask ECW Chatbot…" required><button type="submit" aria-label="Send question">Send</button></form>' +
    '<div class="pinocchio-status" role="status"></div></section>';
  document.body.appendChild(assistantRoot);

  var launcher = assistantRoot.querySelector(".pinocchio-launcher");
  var panel = assistantRoot.querySelector(".pinocchio-panel");
  var closeButton = assistantRoot.querySelector(".pinocchio-close");
  var form = assistantRoot.querySelector(".pinocchio-form");
  var input = assistantRoot.querySelector("#pinocchio-input");
  var messages = assistantRoot.querySelector(".pinocchio-messages");
  var status = assistantRoot.querySelector(".pinocchio-status");
  var endpoint = window.ECW_CHAT_ENDPOINT || ((window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") ? "http://127.0.0.1:3001/chat" : "/chat");

  function openAssistant() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-chat-open"); // lock background scroll
    input.focus();
  }
  function closeAssistant() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-chat-open"); // restore scroll
    launcher.focus();
  }

  function addMessage(text, kind) { var item = document.createElement("div"); item.className = "pinocchio-message pinocchio-message--" + kind; item.textContent = text; messages.appendChild(item); messages.scrollTop = messages.scrollHeight; return item; }
  function typeMessage(text) { var item = addMessage("", "assistant"); var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduced) { item.textContent = text; return; } var i = 0; function next() { item.textContent = text.slice(0, i); i += 2; messages.scrollTop = messages.scrollHeight; if (i <= text.length) window.setTimeout(next, 10); } next(); }
  async function askEcwChatbot(question) {
    addMessage(question, "user");
    var typing = addMessage("ECW Chatbot is thinking…", "assistant pinocchio-message--typing");
    status.textContent = "";
    try {
      var response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question }) });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assistant unavailable");
      typing.remove(); typeMessage(data.reply || "I don’t have an answer for that yet. Please contact the Edenvale team.");
    } catch (error) {
      typing.textContent = "I’m unable to connect right now. Please call 011 452 5940 for help, or try again when the local assistant server is running.";
      status.textContent = "Local assistant connection unavailable.";
    }
  }
  launcher.addEventListener("click", function () { panel.hidden ? openAssistant() : closeAssistant(); });
  closeButton.addEventListener("click", closeAssistant);
  assistantRoot.querySelectorAll("[data-pinocchio-suggestion]").forEach(function (button) { button.addEventListener("click", function () { openAssistant(); askEcwChatbot(button.textContent); }); });
  form.addEventListener("submit", function (event) { event.preventDefault(); var question = input.value.trim(); if (!question) return; input.value = ""; askEcwChatbot(question); });
})();
