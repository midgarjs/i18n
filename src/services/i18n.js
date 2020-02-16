import { assignRecursive, isObject } from '@midgar/utils'
import path from 'path'
import { vsprintf } from 'sprintf-js'
import { cpus } from 'os'
const serviceName = 'mid:i18n'

/**
 * UserService class
 */
class I18nService {
  /**
   * @param {Midgar}       mid          Midgar instance
   * @param {MongoService} mongoService Mongo service instance
   * @param {MailService}  mailService Mongo service instance
   */
  constructor (mid) {
    /**
     * Midgar instance
     * @type {Midgar}
     */
    this.mid = mid

    /**
     * Plugin config
     * @type {Object}
     */
    this.config = assignRecursive({
      defaultLocale: 'en-GB',
      locales: [
        'en-GB'
      ]
    }, this.mid.config.i18n)

    /**
     * Locale codes Array
     * @type {Array<string>}
     */
    this.locales = this.config.locales

    /**
     * Default locale code
     * @type {string}
     */
    this.defaultLocale = this.config.defaultLocale

    /**
     * Translation dictionay
     * @type {Object}
     */
    this.dictionary = {}

    /**
     * Translation file parser dictionary
     * @type {Object}
     */
    this.parsers = {}

    this.addParser('.json', (content) => JSON.parse(content))
    this.addParser('.js', (content) => JSON.parse(content))
  }

  /**
   * Check config requirement
   * @private
   */
  _checkConfig () {

  }

  async init () {
    // Load locales files
    const files = await this.mid.pm.readFiles('locales/@(' + this.locales.join('|') + ').*')

    // List translation file
    for (const file of files) {
      try {
        this._loadTranslationFile(file)
      } catch (error) {
        this.mid.error(error)
      }
    }
  }

  /**
   * Load translation from a file
   *
   * @parma {File} file File object from mid.pm.readFiles()
   *
   * @private
   */
  _loadTranslationFile (file) {
    // Get file extension
    const ext = path.extname(file.path)

    // Get locale from filename
    const locale = path.basename(file.path, ext)

    // Check locale code exists
    if (!this.locales.includes(locale)) throw new Error(`Invalid locale code ${locale} !`)

    // Get file parser
    const parser = this.getParser(ext)

    // Parse file content
    const translation = parser(file.content)

    // Add translation to dictionary
    this.addTranslataion(locale, translation)
  }

  /**
   * Merge translation into dictionary
   *
   * @param {string} locale      Locale code
   * @param {object} translation Translation dictionary
   */
  addTranslataion (locale, translation) {
    this.dictionary[locale] = assignRecursive(this.dictionary[locale] || {}, translation)
  }

  /**
   * Renturn a parser function from a file extension
   *
   * @param {string} ext file extension
   *
   * @return {string}
   */
  getParser (ext) {
    if (!this.parsers[ext]) throw new Error(`No parser found for ${ext} files !`)
    return this.parsers[ext]
  }

  /**
   * Add a parser function
   *
   * @param {string}   ext    file extension ex: .yml
   * @param {function} parser Parser function
   */
  addParser (ext, parser) {
    this.parsers[ext] = parser
  }

  /**
   * Translate a message
   * If translated message is a plural object
   * it use first args for count
   *
   * @param {string} msg    message to translate
   * @param {string} locale locale code
   * @param {Array}  args   vsprintf arguments
   *
   * @return {string}
   */
  __ (msg, locale = null, ...args) {
    try {
      // Set default locale if it not set
      if (locale === null) locale = this.defaultLocale

      // Get translated message from dictonary
      const translation = this._translate(msg, locale)

      // If translated message is singular
      if (typeof translation === 'string') {
        if (args.length > 1) msg = vsprintf(translation, Array.prototype.slice.call(args, 2))
        else msg = translation
        // If translated msg is a plural object
      } else if (isObject(translation)) {
        msg = this._translateplural(msg, locale, translation, args)
      } else {
        throw new Error('Invalid msg type !')
      }
    } catch (error) {
      this.mid.error(error)
    }

    return msg
  }

  /**
   * Translate a plural message
   * If translated message is a plural object
   * it use first arg for count
   *
   * @param {string} msg         message to translate
   * @param {string} locale      locale code
   * @param {plural} translation plural object
   * @param {Array}  args        vsprintf arguments
   *
   * @return {string}
   * @private
   */
  _translateplural (msg, locale, translation, args) {
    // Check translation object
    if (translation.singular === undefined) throw new Error(`Missing singular entry in translation for "${msg}" and locale ${locale} !`)
    if (translation.plural === undefined) throw new Error(`Missing plural entry in translation for "${msg}" and locale ${locale} !`)

    // Check count exists
    if (args[0] === undefined) throw new Error('Missing count argument !')
    // Check count type
    if (typeof args[0] !== 'number') throw new TypeError('Invalid count argument type !')

    // Return translated message
    return vsprintf(parseInt(args[0], 10) > 1 ? translation.plural : translation.singular, args)
  }

  /**
   * Translate a message
   *
   * @param {string} msg    Message to translate
   * @param {string} locale Locale code
   *
   * @return {string}
   * @private
   */
  _translate (msg, locale) {
    // If translation not exists for current locale use default locale
    if (locale !== this.defaultLocale && (this.dictionary[locale] === undefined || this.dictionary[locale][msg] === undefined) &&
      this.dictionary[this.defaultLocale] !== undefined && this.dictionary[this.defaultLocale][msg] !== undefined) {
      this.mid.debug(`@midgar/i18n: No translation found for "${msg}" for local ${locale}. Using the default locale ${this.defaultLocale}.`)
      locale = this.defaultLocale
    }

    // If translation not exists for default locale return original msg
    if (this.dictionary[locale] === undefined || this.dictionary[locale][msg] === undefined) {
      this.mid.debug(`@midgar/i18n: No translation found for "${msg}" for default locale ${locale}.`)
      return msg
    }

    return this.dictionary[locale][msg]
  }
}

export default {
  name: serviceName,
  service: I18nService
}

export {
  I18nService
}
