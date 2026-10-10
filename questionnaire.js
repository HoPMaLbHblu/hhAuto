// HHAuto: помощник для обязательных анкет работодателя.
// Заполняет вопросы, на которые есть честный ответ из профиля, подсвечивает
// остальные и останавливается. Отправляет анкету всегда сам пользователь.
(() => {
  "use strict";

  const BANNER_ID = "autosend-questionnaire-banner";

  // Ответы берутся из profile.js (скопируйте profile.example.js и заполните).
  const PROFILE = window.HHAUTO_PROFILE || {};
  const RU = PROFILE.ru || {};
  const EN = PROFILE.en || PROFILE.ru || {};

  // Порядок важен: первое совпадение выигрывает.
  const RULES = [
    ["salary", /зарплат|заработн|доход|оплат|ожидани|вилк|сумм|ставк|денежн|финансов\S* услови|сколько.{0,20}(хотите|получать|рубл)|salary|compensation|rate|pay\b/],
    ["accreditation", /аккредитац|отсрочк/],
    // Вопросы о прошлых работодателях: официального трудоустройства не было.
    ["employedBefore", /оформлены|были ли вы оформлены|официально трудоустро|в указанных в резюме компани/],
    ["docs", /стд|трудов\S* книжк|госуслуг|документ\S*.{0,40}(опыт|стаж)/],
    ["references", /рекомендац|контакт\S* руководител|референс|reference/],
    ["dotnet", /\.net|asp\.?net|c#|дотнет/],
    ["databases", /субд|баз\S* данных|postgres|mysql|sqlite|mongo|database|dbms|\bsql\b/],
    ["brokers", /rabbitmq|kafka|брокер|очеред\S* сообщени|message (broker|queue)/],
    ["aiTools", /ai.?инструмент|ии.?инструмент|нейросет|искусственн\S* интеллект|llm|chatgpt|copilot|cursor|claude|ai tools/],
    ["prototypes", /сколько.{0,30}(прототип|игр)|how many.{0,20}(prototype|game)/],
    ["gamedev", /геймдев|gamedev|game ?dev|игров|прототип\S* игр|unity|unreal|roblox/],
    ["citizenship", /гражданств|citizenship|разрешени\S* на работу|work permit/],
    ["employment", /оформлени|трудоустройств|самозанят|договор|тк рф|ип\b|contract type/],
    ["relocation", /переезд|релокац|relocat/],
    ["office", /офис|on.?site|гибрид|hybrid/],
    ["portfolio", /github|гитхаб|портфолио|репозитор|пример.{0,20}код|ссылк.{0,20}(код|проект|работ)|portfolio|code sample|repositor/],
    ["testTask", /тестов\S* задани|тестово|test (task|assignment)|take.?home/],
    ["location", /город|часов\S* пояс|откуда|где.{0,15}(живете|находитесь)|time ?zone|location|based in|where are you/],
    ["schedule", /график|часов в (неделю|день)|занятост|загрузк|full.?time|part.?time|hours (per|a) (week|day)/],
    ["education", /образовани|вуз|университет|диплом|education|degree|university/],
    ["english", /английск|english/],
    ["remote", /удал[её]н|remote/],
    ["start", /когда.{0,20}(приступ|выйти|начать)|start date|when can you start|notice period/],
    ["contacts", /telegram|телеграм|(^|[^а-яa-z])(тг|tg)([^а-яa-z]|$)|контакт|как с вами связаться|для связи|contact/],
    // Только общий вопрос об опыте; «опыт с X» требует честного ответа про X — вручную.
    ["experience", /коммерческ\S* опыт|общий опыт|ваш опыт работы|стаж|опыт работы в (it|ит|разработке)|how many years of experience|commercial experience/],
    ["about", /о себе|расскажите|почему|мотивац|чем.{0,15}(интерес|привлек)|why|about yourself|tell us/],
  ];

  // Вопросы с вариантами: выбираем ответ только там, где он однозначный.
  const CHOICE_KEYS = new Set(["testTask", "remote", "start", "schedule"]);
  const YES = /^(да|yes|готов|ready|конечно|sure|в любое время|сразу|immediately|full)/i;
  // На эти вопросы честный ответ — «Нет».
  const NO_KEYS = new Set(["employedBefore", "docs", "references"]);
  const NO = /^(нет|no)(\b|[^а-яa-z]|$)/i;
  const MODEST = /не работал|не использовал|нет опыта|не было|никогда|базов|начальн|junior|до 1 год|менее (1|года)|less than|never|basic|beginner/i;

  const norm = (s = "") => s.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  const isEnglish = (s) => (s.match(/[a-z]/gi) || []).length > (s.match(/[а-яё]/gi) || []).length;

  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function questionText(block) {
    const labels = new Set([...block.querySelectorAll("label")].map((l) => l.innerText.trim()));
    return (block.innerText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !labels.has(l) && !/^(own variant|свой вариант|type here|введите)/i.test(l))
      .join(" ");
  }

  // Текст работодателя над вопросами («Пожалуйста, укажите ожидания по зарплате и ТГ…»).
  function employerIntro() {
    const main = document.querySelector("main") || document.body;
    const text = main.innerText || "";
    const end = text.search(/answer the questions|ответьте на вопросы/i);
    const start = text.search(/questions from the employer|вопросов работодателя|вопросы работодателя/i);
    if (end <= 0) return "";
    return text.slice(start > 0 && start < end ? start : 0, end).replace(/^[^\n]*\n/, "").trim();
  }

  // Все темы, о которых спрашивает текст, в порядке правил; дубли убираем.
  function answersForText(text) {
    const t = norm(text);
    const dict = isEnglish(text) ? EN : RU;
    const keys = RULES.filter(([, re]) => re.test(t)).map(([k]) => k);
    return [...new Set(keys)].map((k) => dict[k]).join("\n\n");
  }

  let introText = "";

  function answerBlock(block) {
    const question = questionText(block);
    const q = norm(question);
    const rule = RULES.find(([, re]) => re.test(q));

    const options = [...block.querySelectorAll('input[type="radio"], input[type="checkbox"]')];
    const textareas = [...block.querySelectorAll("textarea, input[type='text']")];

    if (!rule) {
      // Вопрос у поля ни о чём («Вот здесь)») — отвечаем на то, что спросили в тексте выше.
      if (!options.length && textareas.length && introText) {
        const answer = answersForText(introText);
        if (answer) {
          setValue(textareas[0], answer);
          return true;
        }
      }
      const fallback = (isEnglish(question) ? EN : RU).fallback;
      // Ничего не подошло: в текстовое поле — честный ответ со ссылкой на GitHub.
      if (!options.length && textareas.length) {
        setValue(textareas[0], fallback);
        return true;
      }
      // Варианты ответа: «Свой вариант» с тем же текстом, иначе самый скромный вариант.
      if (options.length) {
        const own = options.find((o) => o.value === "open");
        const ownText = block.querySelector('textarea[name$="_text"]');
        if (own && ownText) {
          own.click();
          setValue(ownText, fallback);
          return true;
        }
        const label = (o) => (o.closest("label")?.innerText || "").trim();
        const modest = options.find((o) => NO.test(label(o)) || MODEST.test(label(o))) || options[0];
        if (!modest.checked) modest.click();
        return true;
      }
      return false;
    }
    const key = rule[0];
    const text = (isEnglish(question) ? EN : RU)[key] || (isEnglish(question) ? EN : RU).fallback || "";

    if (options.length) {
      if (NO_KEYS.has(key)) {
        const no = options.find((o) => o.value !== "open" && NO.test((o.closest("label")?.innerText || "").trim()));
        if (no) {
          if (!no.checked) no.click();
          return true;
        }
      }
      if (CHOICE_KEYS.has(key)) {
        const yes = options.find((o) => o.value !== "open" && YES.test((o.closest("label")?.innerText || "").trim()));
        if (yes) {
          yes.click();
          return true;
        }
      }
      // Подходящего варианта нет: отвечаем через «Свой вариант», если он есть.
      const own = options.find((o) => o.value === "open");
      const ownText = block.querySelector('textarea[name$="_text"]');
      if (own && ownText) {
        own.click();
        setValue(ownText, text);
        return true;
      }
      const label = (o) => (o.closest("label")?.innerText || "").trim();
      const modest = options.find((o) => NO.test(label(o)) || MODEST.test(label(o))) || options[0];
      if (!modest.checked) modest.click();
      return true;
    }

    if (textareas.length) {
      setValue(textareas[0], text);
      return true;
    }
    return false;
  }

  function showBanner(filled, unknown, returnUrl) {
    document.getElementById(BANNER_ID)?.remove();
    const box = document.createElement("div");
    box.id = BANNER_ID;
    Object.assign(box.style, {
      position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
      zIndex: "2147483647", maxWidth: "760px", padding: "14px 20px", borderRadius: "10px",
      background: unknown ? "#b54708" : "#067647", color: "#fff",
      font: "600 14px Arial, sans-serif", boxShadow: "0 4px 18px rgba(0,0,0,.3)", lineHeight: "1.5",
    });
    box.textContent = unknown
      ? `AutoSend: заполнено ${filled} из ${filled + unknown}. Ответьте на вопросы в красной рамке, проверьте анкету и нажмите «Откликнуться». Потом вернитесь к поиску и снова нажмите «Отправить отклики».`
      : `AutoSend: все ${filled} вопросов заполнены. Проверьте ответы и нажмите «Откликнуться». Потом вернитесь к поиску и снова нажмите «Отправить отклики».`;
    if (returnUrl) {
      const a = document.createElement("a");
      a.href = returnUrl;
      a.textContent = " ← К поиску";
      Object.assign(a.style, { color: "#fff", textDecoration: "underline", marginLeft: "8px" });
      box.appendChild(a);
    }
    document.body.appendChild(box);
  }

  function run({ returnUrl } = {}) {
    const blocks = [...document.querySelectorAll('[data-qa="task-body"]')];
    introText = employerIntro();
    let filled = 0;
    let unknown = 0;
    for (const block of blocks) {
      if (answerBlock(block)) {
        filled++;
        block.style.outline = "2px solid #12b76a";
      } else {
        unknown++;
        block.style.outline = "3px solid #d92d20";
        block.style.outlineOffset = "4px";
      }
    }
    showBanner(filled, unknown, returnUrl);
    blocks.find((b) => b.style.outline.includes("rgb(217, 45, 32)") || b.style.outline.includes("#d92d20"))
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    console.log(`📝 AutoSend: анкета — заполнено ${filled}, требуют ответа ${unknown}`);
    return { filled, unknown };
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function addLetter(letter) {
    if (!letter) return false;
    let ta = document.querySelector('[data-qa="vacancy-response-popup-form-letter-input"], textarea[name="letter"]');
    if (!ta) {
      const add = [...document.querySelectorAll("button, [role=button], a")].find((b) =>
        /^(add|добавить)$/i.test((b.innerText || "").trim()) &&
        /covering letter|сопроводительн/i.test(b.closest("div")?.parentElement?.innerText || ""));
      add?.click();
      await wait(800);
      ta = document.querySelector('[data-qa="vacancy-response-popup-form-letter-input"], textarea[name="letter"]') ||
        [...document.querySelectorAll("textarea")].find((t) => !t.closest('[data-qa="task-body"]'));
    }
    if (!ta) return false;
    setValue(ta, letter);
    return true;
  }

  // Заполняет анкету. Если ответы есть на все вопросы — добавляет письмо и отправляет.
  async function handle({ returnUrl, letter, isBlocked, onSent, onManual }) {
    await wait(800);
    const { filled, unknown } = run({ returnUrl });
    // Страница отклика без вопросов (только резюме и письмо) тоже отправляется.
    if (unknown) return onManual?.();
    await addLetter(letter);
    await wait(600);
    const submit = document.querySelector('[data-qa="vacancy-response-submit-popup"]');
    if (!submit || isBlocked?.()) return onManual?.();
    document.getElementById(BANNER_ID).textContent = "AutoSend: анкета заполнена, отправляю отклик…";
    submit.click();
    await wait(3000);
    // Капча после отправки: её ловит основной скрипт, здесь ничего не делаем.
    if (isBlocked?.()) return;
    console.log("✅ AutoSend: анкета отправлена");
    onSent?.();
  }

  window.AutoSendQA = { run, handle };
})();
