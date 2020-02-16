import mocha from 'mocha'
import chai from 'chai'
import dirtyChai from 'dirty-chai'
import path from 'path'
import I18nPlugin from '../src/index'
import i18nServiceModule from '../src/services/i18n'

/**
 * @type {Midgar}
 */
import Midgar from '@midgar/midgar'

const I18nService = i18nServiceModule.service
const HELLO_WORLD_MSG = 'Hello-world !'
const KAT_MSG = '%s cat'

// fix for TypeError: describe is not a function with mocha-teamcity-reporter
const { describe, it } = mocha

const expect = chai.expect
chai.use(dirtyChai)

let mid = null
const initMidgar = async (suffix = null) => {
  mid = new Midgar()
  const configPath = 'fixtures/config' + (suffix !== null ? suffix : '')
  await mid.start(path.join(__dirname, configPath))
  return mid
}

/**
 * Test the I18n plugin
 */
describe('I18n', function () {
  afterEach(async () => {
    await mid.stop()
    mid = null
  })

  /**
   * Test if the plugin id load
   */
  it('Plugin', async () => {
    mid = await initMidgar()
    // Test plugin instance
    const plugin = mid.pm.getPlugin('@midgar/i18n')
    expect(plugin).to.be.an.instanceof(I18nPlugin, 'Plugin is not an instance of I18nPlugin')

    // Test service instance
    expect(mid.getService('mid:i18n')).to.be.an.instanceof(I18nService, 'mid:i18n service is not an instance of I18nService')
  })

  /**
   * Add a route and test a request
   */
  it('__', async () => {
    mid = await initMidgar()
    const i18nService = mid.getService('mid:i18n')
    expect(i18nService.__(HELLO_WORLD_MSG)).to.be.equals('Hello world !', 'Invalide default translation !')
    expect(i18nService.__(HELLO_WORLD_MSG, 'en-GB')).to.equals('Hello world !', 'Invalide en-GB translation !')
    expect(i18nService.__(HELLO_WORLD_MSG, 'fr-FR')).to.equals('Bonjour le monde !', 'Invalide fr-FR translation !')
    expect(i18nService.__(HELLO_WORLD_MSG, 'de-DE')).to.equals('Hallo Welt !', 'Invalide de-DE translation !')

    expect(i18nService.__(KAT_MSG, null, 1)).to.equals('1 cat', 'Invalide en-GB singular translation !')
    expect(i18nService.__(KAT_MSG, null, 2)).to.equals('2 cats', 'Invalide en-GB plurial translation !')
    expect(i18nService.__(KAT_MSG, null, 42)).to.equals('42 cats', 'Invalide en-GB plurial translation !')

    expect(i18nService.__(KAT_MSG, 'en-GB', 1)).to.equals('1 cat', 'Invalide en-GB singular translation !')
    expect(i18nService.__(KAT_MSG, 'en-GB', 2)).to.equals('2 cats', 'Invalide en-GB plurial translation !')
    expect(i18nService.__(KAT_MSG, 'en-GB', 42)).to.equals('42 cats', 'Invalide en-GB plurial translation !')

    expect(i18nService.__(KAT_MSG, 'fr-FR', 1)).to.equals('1 chat', 'Invalide fr-FR singular translation !')
    expect(i18nService.__(KAT_MSG, 'fr-FR', 2)).to.equals('2 chats', 'Invalide fr-FR plurial translation !')
    expect(i18nService.__(KAT_MSG, 'fr-FR', 42)).to.equals('42 chats', 'Invalide fr-FR plurial translation !')

    expect(i18nService.__(KAT_MSG, 'de-DE', 1)).to.equals('1 katze', 'Invalide de-DE singular translation !')
    expect(i18nService.__(KAT_MSG, 'de-DE', 2)).to.equals('2 katzen', 'Invalide de-DE plurial translation !')
    expect(i18nService.__(KAT_MSG, 'de-DE', 42)).to.equals('42 katzen', 'Invalide de-DE plurial translation !')
  })
})
