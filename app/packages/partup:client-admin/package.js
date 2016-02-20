Package.describe({
    name: 'partup:client-admin',
    version: '0.0.1',
    summary: '',
    documentation: null
});

Package.onUse(function(api) {
    api.use([
        'tap:i18n',
        'partup:lib'
    ], ['client', 'server']);

    api.use([
        'templating',
        'reactive-dict'
    ], 'client');

    api.addFiles([
        'package-tap.i18n',

        'Admin.html',
        'Admin.js',

        '../../i18n/phraseapp.en.i18n.json',
        '../../i18n/phraseapp.nl.i18n.json'
    ], 'client');

    api.addFiles([
        'package-tap.i18n',
        '../../i18n/phraseapp.en.i18n.json',
        '../../i18n/phraseapp.nl.i18n.json'
    ], 'server');
});
