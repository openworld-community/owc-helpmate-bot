export const langs = [
  {
    name: "RU",
    code: "ru",
    locale: "ru-RU"
  },
  {
    name: "EN",
    code: "en",
    locale: "en-US"
  }
];

export const locales = {
  en: {
    start: "Hi, how can I /help you?\n You can also use /menu to show the app.",
    help: "You can change language using the /lang [{$locales}] command.",
    menu: "Choose an option:",
    webapp: "Webapp",
    website: "Website"
  },
  ru: {
    start: "Привет!\n Описание доступно по команде /help\n А меню для запуска приложения - по команде /menu",
    help: "Язык можно сменить командой /lang [{$locales}]",
    menu: "Выбери вариант:",
    webapp: "Приложение",
    website: "Сайт"
  }
};
