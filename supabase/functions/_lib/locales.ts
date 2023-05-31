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
    error: "Error!",
    error_nothelper: "You are not a helper!",
    file_already: "This file has already been uploaded to the storage.",
    file_uploaded: "The file has been uploaded to the storage.",
    file_notuploaded: "There is an error while uploading file.",
    request_country: "Country code (2 symbols e.g. RU)?",
    request_state: "State/region code? Send '-' (minus) if none.",
    request_city: "City? Send '-' (minus) if none.",
    request_chat: "Chat?",
    request_location: "Share your location",
    update_start: "You have chosen chat '{$title}' with invite link:\n {$invite}",
    update_invite: "Wrong invite link! Start chat update again!",
    update_country: "Wrong country code! Start chat update again!",
    update_state: "Wrong state code! Start chat update again!",
    update_city: "Wrong city name! Start chat update again!",
    update: "Update chat info",
    tasks: "Open tasks",
    tasks_helper: "Your tasks",
    tasks_returned: "A bunch of tasks marked open",
    task_returned: "Your task is marked open again",
    task_description: "Describe the problem to be solved.",
    task_busy: "The task is owned by other helper",
    task_created: "A new task in chat '{$chat_title}' created:",
    task_url: "https://t.me/{$bot_name}?start=task_{$task_uid}",
    task_accept: "Perform task",
    task_accepted: "Your task is accepted by a helper",
    task_performer: "You have accepted to be @{$username}'s task performer",
    task_bad: "Mark as bad",
    task_marked: "Your task is marked as bad by a helper",
    task_marker: "You have marked the task as bad",
    task: "Task",
    add: "Help me!",
    register: "Ready to help!",
    registered: "You have been added to helpers list",
    unregister: "Remove me from helpers",
    start: "Hi, how can I /help you?",
    press_start: "Press 'START' at the bottom",
    upd: "Hi, click https://t.me/{$bot_name}?start=update_{$chat_id} to edit chat data.",
    reg: "Hi, click https://t.me/{$bot_name}?start=register_{$chat_id} to register as a helper.",
    member: "You should be '{$chat_title}' chat member and the same country chosen.",
    menu: "Show menu",
    option: "Choose an option:",
    button: "Press the button:",
    exit: "Exit",
    press_exit: "Press 'Exit' to quit",
    webapp: "Webapp",
    website: "Website",
    group: "Back to chat",
    bye: "Bye!",
    bot: "Bot helps",
    short_description: "Too short description!"
  },
  ru: {
    error: "Ошибка!",
    error_nothelper: "Ты не в списке помощников",
    file_already: "Этот файл уже был загружен в хранилище",
    file_uploaded: "Файл успешно загружен в хранилище",
    file_notuploaded: "При загрузке файла произошла ошибка",
    request_country: "Код страны (из двух лат. символов, например, RU)?",
    request_state: "Код штата/региона (например, MOW)? Отправь '-' (минус) если нет.",
    request_city: "Город? Отправь '-' (минус) если нет.",
    request_chat: "Chat?",
    request_location: "Share your location",
    update_start: "Выбран чат '{$title}' с приглашением по ссылке:\n {$invite}",
    update_invite: "Wrong invite link! Start chat update again!",
    update_country: "Wrong country code! Start chat update again!",
    update_state: "Wrong state code! Start chat update again!",
    update_city: "Wrong city name! Start chat update again!",
    update: "Редактировать данные чата",
    tasks: "Открытые задачи",
    tasks_helper: "Твои задачи",
    tasks_returned: "Несколько задач помечены как открытые",
    task_returned: "Твоя задача помечена как открытая снова",
    task_description: "Опиши проблему, которую надо решить.",
    task_busy: "Задание уже занято другим исполнителем",
    task_created: "В чате '{$chat_title}' создано новое задание:",
    task_url: "https://t.me/{$bot_name}?start=task_{$task_uid}",
    task_accept: "Выполнить задание",
    task_accepted: "Твоё задание принято к исполнению",
    task_performer: "Ты принял задание от @{$username} к исполнению",
    task_bad: "Отклонить как несоответствующее",
    task_marked: "Твоё задание отклонено как несоответствующее",
    task_marker: "Ты отклонил задание как несоответствующее",
    task: "Задание",
    add: "Нужна помощь!",
    register: "Готов помогать!",
    registered: "Ты добавлен в список помощников",
    unregister: "Удалить меня из помощников",
    unregistered: "Ты удален из списка помощников",
    start: "Привет!\n Описание доступно по команде /help",
    press_start: "Нажмите 'ЗАПУСТИТЬ' внизу",
    upd: "Привет, чтобы редактировать данные чата, нажми https://t.me/{$bot_name}?start=update_{$chat_id}",
    reg: "Привет, чтобы стать помощником, нажми https://t.me/{$bot_name}?start=register_{$chat_id}",
    member: "Ты должен быть членом группы '{$chat_title}' с той же страной, что и группа",
    menu: "Показать меню",
    option: "Выбери вариант:",
    button: "Нажми кнопку:",
    exit: "Выход",
    press_exit: "Жми 'Выход' чтобы выйти",
    webapp: "Приложение",
    website: "Сайт",
    group: "Вернуться в чат",
    bye: "Пока!",
    bot: "Бот помогает",
    short_description: "Слишком короткое описание!"
  }
};
