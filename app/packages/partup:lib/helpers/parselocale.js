/**
 @namespace Helpers
 @name partup.transformers.activity
 @memberOf partup.transformers
 */
Partup.helpers.parseLocale = function(locale, fallbackLocale){
    fallbackLocale = fallbackLocale || 'en';
    locale = (typeof locale === 'string' || locale instanceof String) ? locale : fallbackLocale;
    var localeMatch = locale.match(/^([a-z]{2})[-_][A-Z]{2}$/);
    return localeMatch ? localeMatch[1] : fallbackLocale;
};
