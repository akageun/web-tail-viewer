require('babel-register')({
    presets: ['env']
});

require('babel-polyfill');

require('./src/app');