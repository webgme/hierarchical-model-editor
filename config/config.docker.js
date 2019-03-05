const config = require('./config.webgme');
const validateConfig = require('webgme/config/validator');

config.mongo.uri = 'mongodb://mongo:27017/webgme';
config.server.port = 8888;

validateConfig(config);
module.exports = config;
