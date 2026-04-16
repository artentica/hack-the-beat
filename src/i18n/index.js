import { computed, ref } from 'vue'
import en from './en.js'
import fr from './fr.js'

const messages = { en, fr }

// Detect browser lang, fallback to 'en'
function detectLocale() {
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : ''
  const lang = nav.split('-')[0]
  return lang in messages ? lang : 'en'
}

const currentLocale = ref(detectLocale())

export function useI18n() {
  function setLocale(lang) {
    if (lang in messages) {
      currentLocale.value = lang
    }
  }

  const locale = computed(() => currentLocale.value)

  /**
   * Translate a key, with optional interpolation: t('levelComplete', { level: 3 })
   * Falls back to English if key is missing in current locale.
   */
  function t(key, params) {
    let text = messages[currentLocale.value]?.[key]
      ?? messages.en?.[key]
      ?? key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }

    return text
  }

  return { t, locale, setLocale }
}
