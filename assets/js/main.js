const CONFIG = {
  // Вставьте сюда точную ссылку на платежную страницу Prodamus / Prodama.se.
  PAYMENT_URL: "https://payform.ru/oickpi2/",

  // Необязательный endpoint для сохранения заявки до перехода к оплате.
  LEAD_ENDPOINT: "",

  // Если платежная страница принимает GET-параметры, контакты будут предзаполнены.
  PREFILL_PAYMENT: true
};

(function () {
  "use strict";

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var selector = link.getAttribute("href");
      if (!selector || selector === "#") return;
      var target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    });
  });

  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion()) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -7% 0px" });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("in"); });
  }

  var form = document.getElementById("mentorshipForm");
  if (!form) return;

  var status = document.getElementById("formStatus");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var telegramPattern = /^@?[A-Za-z0-9_]{5,32}$/;

  function setInvalid(id, invalid) {
    var field = document.getElementById(id);
    if (field) field.classList.toggle("invalid", invalid);
    return !invalid;
  }

  form.addEventListener("input", function (event) {
    var field = event.target.closest(".field");
    if (field) field.classList.remove("invalid");
    if (event.target.name === "agree") {
      document.getElementById("field-consent").classList.remove("invalid");
    }
    if (status) status.textContent = "";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var telegram = form.elements.telegram.value.trim();
    var consent = form.elements.agree.checked;
    var marketingConsent = form.elements.marketing.checked;

    var validName = setInvalid("field-name", name.length < 2);
    var validEmail = setInvalid("field-email", !emailPattern.test(email));
    var validTelegram = setInvalid("field-telegram", !telegramPattern.test(telegram));
    document.getElementById("field-consent").classList.toggle("invalid", !consent);

    if (!validName || !validEmail || !validTelegram || !consent) {
      var firstInvalid = form.querySelector(".invalid input");
      if (firstInvalid) firstInvalid.focus();
      if (status) status.textContent = "Проверьте выделенные поля.";
      return;
    }

    if (!CONFIG.PAYMENT_URL) {
      if (status) status.textContent = "Платежная ссылка будет подключена перед публикацией.";
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Переходим к оплате…";

    var lead = {
      name: name,
      email: email,
      telegram: telegram.charAt(0) === "@" ? telegram : "@" + telegram,
      product: "Индивидуальное наставничество для практикующих тарологов",
      price: "360000 RUB",
      legalConsent: true,
      marketingConsent: marketingConsent
    };

    var saveLead = CONFIG.LEAD_ENDPOINT
      ? fetch(CONFIG.LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(lead),
          keepalive: true
        }).catch(function () {})
      : Promise.resolve();

    saveLead.then(function () {
      var paymentUrl = CONFIG.PAYMENT_URL;
      if (CONFIG.PREFILL_PAYMENT) {
        try {
          var url = new URL(paymentUrl, window.location.href);
          url.searchParams.set("email", lead.email);
          url.searchParams.set("customer_extra", "Telegram: " + lead.telegram + " · Имя: " + lead.name);
          paymentUrl = url.toString();
        } catch (error) {}
      }
      window.location.assign(paymentUrl);
    });
  });
})();
