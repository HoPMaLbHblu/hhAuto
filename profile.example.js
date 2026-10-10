// HHAuto — пример профиля.
// Скопируйте этот файл в profile.js и заполните своими данными.
// profile.js не попадает в git (см. .gitignore).
(() => {
  const PROFILE = {
    github: "https://github.com/your-username",
    telegram: "https://t.me/your_username",
    salaryRub: "100 000 ₽ на руки",
    salaryUsd: "$1000 per month",
  };

  // Ответы на частые вопросы анкет. Ключи совпадают с правилами в questionnaire.js.
  // Если ответа для ключа нет, используется fallback.
  const ru = {
    salary: `Ожидаю около ${PROFILE.salaryRub}, готов обсудить по итогам собеседования.`,
    portfolio: `Мои проекты на GitHub: ${PROFILE.github}\n- Проект 1 — краткое описание и стек.\n- Проект 2 — краткое описание и стек.`,
    location: "Москва, часовой пояс GMT+3. Могу работать 40 часов в неделю.",
    schedule: "Готов к полной занятости: 40 часов в неделю.",
    testTask: "Да, готов выполнить тестовое задание.",
    education: "Укажите ваше образование.",
    english: "Английский — B1.",
    experience: "Кратко опишите ваш опыт: сколько лет и с какими технологиями.",
    remote: "Да, ищу удалённую работу.",
    start: "Готов приступить сразу после оффера.",
    contacts: `Telegram: ${PROFILE.telegram}\nGitHub: ${PROFILE.github}`,
    accreditation: "Не критична, но будет плюсом.",
    employedBefore: "Опишите, где и как вы были оформлены.",
    docs: "Опишите, какие документы можете предоставить.",
    references: "Опишите, можете ли дать контакты для рекомендаций.",
    dotnet: "Опишите ваш опыт с .NET.",
    databases: "Опишите, с какими СУБД работали и сколько.",
    brokers: "Опишите опыт с RabbitMQ / Kafka.",
    aiTools: "Перечислите AI-инструменты, которыми пользуетесь.",
    prototypes: "Сколько прототипов вы сделали.",
    gamedev: "Опишите опыт в геймдеве.",
    citizenship: "Гражданство РФ.",
    employment: "Подойдёт оформление по ТК РФ.",
    relocation: "Рассматриваю удалённую работу.",
    office: "Предпочитаю удалённый формат.",
    about: "Пара предложений о себе: кто вы, что умеете, какую работу ищете.",
    fallback: `Подробнее отвечу на этот вопрос на собеседовании. Мои навыки и код: ${PROFILE.github}`,
  };

  const en = {
    salary: `Around ${PROFILE.salaryUsd}, open to discuss after the interview.`,
    portfolio: `My projects on GitHub: ${PROFILE.github}`,
    location: "Moscow, GMT+3. 40 hours a week.",
    testTask: "Yes, I'm ready to do a test task.",
    english: "English B1.",
    remote: "Yes, I'm looking for remote work.",
    contacts: `Telegram: ${PROFILE.telegram}\nGitHub: ${PROFILE.github}`,
    about: "A couple of sentences about yourself.",
    fallback: `I'll be happy to answer this in more detail at the interview. My code: ${PROFILE.github}`,
  };

  window.HHAUTO_PROFILE = {
    // ID резюме из ссылки hh.ru/resume/<ID>. Можно также выбрать в «Настройках» расширения.
    resumeId: "",
    fullstackResumeId: "",
    // {#vacancyName} заменится на название вакансии.
    letter:
      "Здравствуйте!\n\nМеня заинтересовала вакансия «{#vacancyName}». Коротко о себе и своих проектах.\n\n" +
      `GitHub: ${PROFILE.github}\nTelegram: ${PROFILE.telegram}`,
    ru,
    en,
  };
})();
