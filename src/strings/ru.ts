import type { Strings } from './en';
import { plural } from './plural';

const events = (n: number) =>
  `${n} ${plural('ru', n, { one: 'событие', few: 'события', many: 'событий', other: 'события' })}`;

/**
 * Russian UI copy. Event, quest and place names come from the data in English (their official
 * names); "Twisting Nether" is kept in English too.
 */
export const ru: Strings = {
  meta: {
    locale: 'ru-RU',
    name: 'Русский',
  },
  units: {
    d: (n) => `${n} д`,
    h: (n) => `${n} ч`,
    m: (n) => `${n} мин`,
    lessThanMinute: '<1 мин',
    lessThanHour: '<1 ч',
  },
  app: {
    name: "Innkeeper's Almanac",
    tagline: 'Что сегодня происходит в Азероте — придвиньте стул к очагу.',
  },
  common: {
    close: 'Закрыть',
    unconfirmed: 'Не подтверждено',
    unconfirmedHint: 'Дата для этой версии ещё не подтверждена. Проверьте внутриигровой календарь.',
    estimated: 'Ориентировочно',
    estimatedHint: 'Дата рассчитана по стандартному годовому расписанию.',
  },
  actionBar: {
    label: 'Виды и действия',
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    version: 'Версия',
    more: 'Ещё',
    today: 'Сегодня',
  },
  today: {
    title: 'Сегодня',
    quietDay: 'Тихий день в таверне',
    startsIn: (d) => `Начнётся через ${d}`,
    endsIn: (d) => `Закончится через ${d}`,
    ended: (time) => `Закончилось в ${time}`,
    alsoToday: 'Также в этот день',
    comingSoon: 'Скоро',
    comingSoonEmpty: 'В ближайшие 30 дней больше ничего.',
    inDistance: (d) => `через ${d}`,
    details: 'Подробнее',
    detailsFor: (name) => `Подробнее: ${name}`,
    previousDay: 'Предыдущий день',
    nextDay: 'Следующий день',
    backToToday: 'Вернуться к сегодня',
  },
  calendar: {
    previousWeek: 'Предыдущая неделя',
    nextWeek: 'Следующая неделя',
    thisWeek: 'Эта неделя',
    previousMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    thisMonth: 'Этот месяц',
    weekTitle: (range) => `Неделя: ${range}`,
    moreEvents: (n) => `ещё ${n}`,
    noEvents: 'Нет событий',
    openDay: 'Открыть день',
    dayLabel: (day, events) => (events ? `${day}: ${events}` : day),
    today: 'Сегодня',
  },
  eventSheet: {
    location: 'Место',
    highlights: 'Главное',
    notes: 'Заметки',
    links: 'Подробнее',
    dateSource: 'Источник даты',
    experience: 'Опыт и награды',
    xpBonus: 'Бонус к опыту',
    levels: 'Уровни',
    levelRange: (min, max) =>
      max === undefined ? `${min}+` : min === max ? `${min}` : `${min}–${max}`,
    quests: 'Задания',
    rewards: 'Награды',
    experienceSource: 'Источник наград',
    notFound: 'У этого события нет дат в этой версии.',
    opensInNewTab: '(откроется в новой вкладке)',
  },
  checklist: {
    title: 'Чек-лист',
    progress: (done, total) => `${done}/${total}`,
    progressLabel: (done, total) => `Выполнено ${done} из ${total}`,
    hint: 'Сохраняется на этом устройстве. Начинается заново каждый раз, когда событие возвращается.',
    kinds: {
      quest: 'Задание',
      achievement: 'Достижение',
      task: 'Дело',
    },
  },
  categories: {
    holiday: 'Праздник',
    faire: 'Ярмарка',
    fishing: 'Рыбалка',
    world: 'Мировое событие',
    pvp: 'PvP',
    milestone: 'Веха',
  },
  calendarExport: {
    addToCalendar: 'Добавить в календарь',
    google: 'Google Календарь',
    appleOutlook: 'Apple / Outlook (.ics)',
    tentative: 'предварительно',
    alwaysIncluded: 'Всегда включено',
    oneDayDuring: (name) => `Однодневные события во время «${name}»`,
    oneDayHint: 'Отметьте, что ещё добавить в файл .ics.',
    selectAll: 'Выбрать все',
    clearAll: 'Снять все',
    eventCount: (n) => `${events(n)} в файле`,
    googleOnePerLink:
      'Google Календарь добавляет по одному событию на ссылку — или импортируйте туда файл .ics.',
    googleFor: (name, day) => `Google Календарь: ${name}, ${day}`,
    reminder: 'Напоминание',
    reminderOff: 'Нет',
    reminder15: '15 мин',
    reminder60: '1 час',
    reminder1440: '1 день',
    reminderHint:
      'Календарь Apple и Outlook напомнят перед каждым событием. Google Календарь вместо этого использует ваши уведомления по умолчанию.',
    subscribe: 'Подписаться на все события',
    subscribeHint: (version, region) =>
      `Живой календарь всех событий ${version} по серверному времени (${region}). Приложение календаря обновляет его само.`,
    feedUrl: 'Адрес ленты',
    copy: 'Копировать',
    copied: 'Скопировано!',
    openApple: 'Календарь Apple',
    openGoogle: 'Google Календарь',
    outlookHow:
      'Outlook: Добавить календарь → Подписаться из Интернета, затем вставьте адрес ленты.',
    downloadFeed: 'Скачать .ics вместо этого',
    needsHttps: 'Подписки работают на опубликованном сайте (HTTPS). Здесь можно скачать файл.',
  },
  versions: {
    choose: 'Выбор версии',
    live: 'Работает',
    retired: 'Закрыта',
    launches: (date) => `Запуск: ${date}`,
    current: 'Текущая',
    launchesIn: (d) => `Запуск через ${d}`,
    launchTime: (when) => `${when} по вашему времени`,
    serverLaunch: (when, region) => `${when} (${region})`,
  },
  topBar: {
    versionChip: (version, region) => `${version} · ${region}`,
    openSettings: 'Настройки',
  },
  more: {
    title: 'Настройки и информация',
    about: 'О проекте',
    aboutText:
      'Фанатский календарь внутриигровых событий классического World of Warcraft. Даты взяты из источников сообщества и официальных новостей; неподтверждённые даты отмечены.',
  },
  notFound: {
    title: 'Затерян в Twisting Nether',
    text: 'Такой страницы нет.',
    home: 'Вернуться в таверну',
  },
  settings: {
    region: 'Регион сервера',
    serverTime: (region) => `Серверное время: ${region}`,
    display: 'Отображение',
    timeDisplay: 'Показывать время',
    localTime: 'Ваше',
    serverTimeShort: 'Серверное',
    weekStart: 'Неделя начинается с',
    sunday: 'Воскресенья',
    monday: 'Понедельника',
    motion: 'Анимации',
    motionSystem: 'Система',
    motionReduced: 'Меньше',
    motionFull: 'Полные',
    eventsShown: 'Показываемые события',
    eventsShownHint: 'Скрытые типы событий исчезают из всех видов.',
    language: 'Язык',
  },
  support: {
    beer: 'Угостите меня пивом 🍺',
    choose: 'Выберите, как угостить трактирщика:',
  },
  legal: {
    disclaimer:
      'Фанатский проект. Не связан с Blizzard Entertainment и не одобрен ею. World of Warcraft — товарный знак Blizzard Entertainment, Inc.',
  },
};
