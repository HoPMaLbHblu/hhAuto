// AutoSend: сообщает фоновому скрипту, чем занята вкладка.
// running — идёт отправка, captcha — ждёт решения капчи, idle — ничего не делает.
(() => {
  "use strict";

  function state() {
    if (document.getElementById("autosend-verification-warning")) return "captcha";
    if (sessionStorage.getItem("autosendLetters:active") === "true") return "running";
    if (sessionStorage.getItem("autosendLetters:navigationPending") === "true") return "running";
    if (/vacancy_response/.test(location.pathname)) return "running";
    // Закрываем только простаивающие страницы поиска; вакансии, резюме и чаты не трогаем.
    if (/^\/(search\/vacancy|vacancies)/.test(location.pathname)) return "idle";
    return "other";
  }

  function report() {
    try {
      chrome.runtime.sendMessage({ type: "autosend:state", state: state() });
    } catch {
      // Расширение перезагружено: старая копия скрипта больше не может писать.
    }
  }

  report();
  setInterval(report, 3000);
})();
