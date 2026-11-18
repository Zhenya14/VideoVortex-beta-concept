let translations = {};
let currentLang = localStorage.getItem('lang') || 'ua';
const pluralRulesCache = new Map();

const PLURAL_FALLBACKS = {
  ua: {
    subscribers: { one: 'підписник', few: 'підписники', many: 'підписників', other: 'підписників' },
    videos: { one: 'відео', few: 'відео', many: 'відео', other: 'відео' },
    posts: { one: 'допис', few: 'дописи', many: 'дописів', other: 'дописів' },
    views: { one: 'перегляд', few: 'перегляди', many: 'переглядів', other: 'переглядів' },
    'files-selected': {
      one: 'Вибрано {count} файл',
      few: 'Вибрано {count} файли',
      many: 'Вибрано {count} файлів',
      other: 'Вибрано {count} файлів'
    }
  },
  en: {
    subscribers: { one: 'subscriber', other: 'subscribers' },
    videos: { one: 'video', other: 'videos' },
    posts: { one: 'post', other: 'posts' },
    views: { one: 'view', other: 'views' },
    'files-selected': { one: '{count} file selected', other: '{count} files selected' }
  },
  de: {
    subscribers: { one: 'Abonnent', other: 'Abonnenten' },
    videos: { one: 'Video', other: 'Videos' },
    posts: { one: 'Beitrag', other: 'Beiträge' },
    views: { one: 'Aufruf', other: 'Aufrufe' },
    'files-selected': { one: '{count} Datei ausgewählt', other: '{count} Dateien ausgewählt' }
  }
};

function getLocaleCode(lang = currentLang) {
  if (lang === 'ua') return 'uk';
  if (lang === 'de') return 'de';
  return 'en';
}

function getPluralCategory(count, lang = currentLang) {
  const num = Math.abs(Math.floor(Number(count) || 0));
  const locale = getLocaleCode(lang);
  try {
    let pr = pluralRulesCache.get(locale);
    if (!pr) {
      pr = new Intl.PluralRules(locale);
      pluralRulesCache.set(locale, pr);
    }
    return pr.select(num);
  } catch (e) {
    if (locale === 'uk') {
      const mod10 = num % 10;
      const mod100 = num % 100;
      if (mod10 === 1 && mod100 !== 11) return 'one';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
      return 'many';
    }
    return num === 1 ? 'one' : 'other';
  }
}

async function loadLanguage(lang) {
  try {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = getLocaleCode(lang);
    const settingsSel = document.getElementById('settings-lang-select');
    if (settingsSel) {
      settingsSel.value = lang;
      window.VVComponents?.syncDropdown?.(settingsSel);
    }
    applyTranslations();
  } catch (err) {
    console.warn('Language load fallback:', err);
  }
}

function t(key, params = {}) {
  let text = translations[key] || key;
  Object.keys(params).forEach((param) => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
}

function tPlural(baseKey, count, includeCount = false) {
  const num = Number(count || 0);
  const category = getPluralCategory(num);
  const langFallback = PLURAL_FALLBACKS[currentLang]?.[baseKey] || PLURAL_FALLBACKS.ua[baseKey] || {};
  const template =
    translations[`${baseKey}.${category}`] ||
    translations[`${baseKey}.other`] ||
    translations[`${baseKey}.many`] ||
    langFallback[category] ||
    langFallback.other ||
    langFallback.many ||
    baseKey;

  if (template.includes('{count}')) {
    return template.replace(/\{count\}/g, String(num));
  }
  return includeCount ? `${num} ${template}` : template;
}

function renderPluralPill(el, baseKey, count) {
  if (!el) return;
  const num = Number(count || 0);
  el.dataset.i18nPlural = baseKey;
  el.dataset.count = String(num);
  while (el.firstChild) el.removeChild(el.firstChild);
  const strongEl = document.createElement('strong');
  strongEl.textContent = String(num);
  el.appendChild(strongEl);
  el.appendChild(document.createTextNode(` ${tPlural(baseKey, num, false)}`));
}

function renderPluralStatLabel(el, baseKey, count) {
  if (!el) return;
  const num = Number(count || 0);
  el.dataset.i18nPluralLabel = baseKey;
  el.dataset.count = String(num);
  el.textContent = tPlural(baseKey, num, false);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val && val !== key) {
      el.textContent = val;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val && val !== key) {
      el.placeholder = val;
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const val = t(key);
    if (val && val !== key) {
      el.textContent = val.replace(/<[^>]*>/g, '');
    }
  });

  document.querySelectorAll('[data-i18n-plural]').forEach((el) => {
    const baseKey = el.getAttribute('data-i18n-plural');
    const count = Number(el.getAttribute('data-count') || 0);
    renderPluralPill(el, baseKey, count);
  });

  document.querySelectorAll('[data-i18n-plural-label]').forEach((el) => {
    const baseKey = el.getAttribute('data-i18n-plural-label');
    const count = Number(el.getAttribute('data-count') || 0);
    renderPluralStatLabel(el, baseKey, count);
  });

  window.VVBus?.emit?.('i18n:updated', { lang: currentLang });
}

window.t = t;
window.tPlural = tPlural;
window.renderPluralPill = renderPluralPill;
window.renderPluralStatLabel = renderPluralStatLabel;
window.applyTranslations = applyTranslations;
window.setAppLanguage = loadLanguage;
window.getAppLanguage = () => currentLang;

document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('settings-lang-select');
  if (selector) {
    selector.value = currentLang;
    selector.addEventListener('change', (e) => {
      loadLanguage(e.target.value);
    });
  }
  loadLanguage(currentLang);
});