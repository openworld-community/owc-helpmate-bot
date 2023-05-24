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
    file_already: "This file has already been uploaded to the storage.",
    file_uploaded: "The file has been uploaded to the storage.",
    file_notuploaded: "There is an error while uploading file.",
    start: "Hi, how can I /help you?\n You can also use /menu to show the app.",
    reg: "Hi, click https://t.me/{$bot_name}?start=register_{$chat_id} to register as a helper.",
    member: "You should be '{$chat_title}' chat member to register as a helper.",
    help: "You can change language using the /lang [{$locales}] command.",
    menu: "Choose an option:",
    exit: "Exit",
    webapp: "Webapp",
    website: "Website"
  },
  ru: {
    file_already: "Этот файл уже был загружен в хранилище",
    file_uploaded: "Файл успешно загружен в хранилище",
    file_notuploaded: "При загрузке файла произошла ошибка",
    start: "Привет!\n Описание доступно по команде /help\n А меню для запуска приложения - по команде /menu",
    reg: "Привет, чтобы стать помощником, нажми https://t.me/{$bot_name}?start=register_{$chat_id}",
    member: "Ты должен быть членом группы '{$chat_title}', чтобы стать помощником",
    help: "Язык можно сменить командой /lang [{$locales}]",
    menu: "Выбери вариант:",
    exit: "Выход",
    webapp: "Приложение",
    website: "Сайт"
  }
};
