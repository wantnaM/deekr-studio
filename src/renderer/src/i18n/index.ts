import { defaultLanguage } from '@shared/config/constant'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Original translation
import enUS from './locales/en-us.json'
import jaJP from './locales/ja-jp.json'
import ruRU from './locales/ru-ru.json'
import zhCN from './locales/zh-cn.json'
import zhTW from './locales/zh-tw.json'
// Machine translation
import elGR from './translate/el-gr.json'
import esES from './translate/es-es.json'
import frFR from './translate/fr-fr.json'
import ptPT from './translate/pt-pt.json'

const resources = {
  'el-GR': elGR,
  'en-US': enUS,
  'es-ES': esES,
  'fr-FR': frFR,
  'ja-JP': jaJP,
  'pt-PT': ptPT,
  'ru-RU': ruRU,
  'zh-CN': zhCN,
  'zh-TW': zhTW
}

export const getLanguage = () => {
  return localStorage.getItem('language') || navigator.language || defaultLanguage
}

export const getLanguageCode = () => {
  return getLanguage().split('-')[0]
}

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage(),
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false
  }
})

export default i18n
