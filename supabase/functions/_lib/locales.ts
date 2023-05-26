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
    update_invite: "Wrong invite link! Start chat /update again!",
    update_country: "Wrong country code! Start chat /update again!",
    update_state: "Wrong state code! Start chat /update again!",
    update_city: "Wrong city name! Start chat /update again!",
    start: "Hi, how can I /help you?\n You can also use /menu to show the app.",
    upd: "Hi, click https://t.me/{$bot_name}?start=update_{$chat_id} to edit chat data.",
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
    update_invite: "Wrong invite link! Start chat /update again!",
    update_country: "Wrong country code! Start chat /update again!",
    update_state: "Wrong state code! Start chat /update again!",
    update_city: "Wrong city name! Start chat /update again!",
    start: "Привет!\n Описание доступно по команде /help\n А меню для запуска приложения - по команде /menu",
    upd: "Привет, чтобы редактировать чат, нажми https://t.me/{$bot_name}?start=update_{$chat_id}",
    reg: "Привет, чтобы стать помощником, нажми https://t.me/{$bot_name}?start=register_{$chat_id}",
    member: "Ты должен быть членом группы '{$chat_title}', чтобы стать помощником",
    help: "Язык можно сменить командой /lang [{$locales}]",
    menu: "Выбери вариант:",
    exit: "Выход",
    webapp: "Приложение",
    website: "Сайт"
  }
};
