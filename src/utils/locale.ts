import { config } from '../config/index.js';

// Russian locale settings
export const locale = {
  months: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ],
  
  weekdays: [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота'
  ],
  
  shortWeekdays: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
};

export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'дата неизвестна';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'дата неизвестна';
  
  const day = d.getDate();
  const month = locale.months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year} г.`;
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return 'дата и время неизвестны';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'дата и время неизвестны';
  
  const dateStr = formatDate(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${dateStr} в ${hours}:${minutes}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  
  return formatDate(d);
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU');
}

export function formatPercentage(num: number): string {
  return `${Math.round(num)}%`;
}

// Plural forms for Russian
export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod10 === 1 && mod100 !== 11) {
    return forms[0]; // 1 источник
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1]; // 2-4 источника
  } else {
    return forms[2]; // 5+ источников
  }
}

export function formatSourceCount(count: number): string {
  const form = pluralize(count, ['источник', 'источника', 'источников']);
  return `${count} ${form}`;
}