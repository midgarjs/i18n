const path = require('path')
const I18n = require('i18n-2')

const Plugin = require('@midgar/midgar/plugin')
const utils = require('@midgar/utils')

/**
 * I18n plugin class
 */
class MidgarI18n extends Plugin {
  /**
   * Init plugin
   */
  async init() {
    this._dirKey = 'locales'
    //declare locales dirs
    this.pm.pluginDirs[this._dirKey] = 'locales'

    this.locales = ['fr_FR', 'en_GB']
    //create i18n instance
    this.i18n = new I18n({
      locales: this.locales
    })

    this.i18n.defaultLocale = 'fr_FR'
    //disable dev mode for disable write file :'(
    this.i18n.devMode = false
    //locales object
    this.i18n.locales = {}

    //bind initHttpServer event
    this.pm.on('initHttpServer', async () => {
      await this.initHttpServer()
    })
  }


  async initHttpServer() {
    //this.midgar.debug('init I18n')
    //load plugins locales files
    await this._loadLocales()

    this.midgar.services.i18n = this.i18n
    //console.log('use i18N');
    //attache i18n on the request
    this.midgar.app.use((req, res, next) => {
      //this.midgar.debug('I18N middleware')
      this.i18n.request = req
      req.i18n = this.i18n

      // Express 3
      if (res.locals) {
        I18n.registerMethods(res.locals, req)
      }

      //this.midgar.debug('/I18N middleware')
      next()
    })
  }

    /**
   * load locales plugin files
   */
  async _loadLocales() {
    this.midgar.debug('Load locales...')
    //list locales to load
    await utils.asyncMap(this.locales, async (locale) => {
      if (!this.i18n.locales[locale]) this.i18n.locales[locale] = {}
      //get locales files content
      const files = await this.pm.readFiles('locales', new RegExp('^' + locale + '.json$'))
        //list files
      await utils.asyncMap(files, async (file) => {
        //this.midgar.debug('Load file ', file)

        //merge locales
        Object.assign(this.i18n.locales[locale], file.content)
      })
    })
  }
}

module.exports = MidgarI18n
