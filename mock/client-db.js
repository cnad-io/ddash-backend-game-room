'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var Promise = require('bluebird');

var db = [];

var get = function (id) {
  logger.trace('Mock client db getting', id);
  return new Promise(function (resolve, reject) {
    var filteredList = db.filter(function (value) {
      return value.id === id;
    });
    if (filteredList.length > 0) {
      resolve(filteredList[0].value);
    } else {
      reject(id);
    }
  });
};

var put = function (id, value) {
  logger.trace('Mock client db putting', id, value);
  return new Promise(function (resolve) {
    var index = db.findIndex(function (existent) {
      return existent.id === id;
    });
    if (index === -1) {
      db.push({
        id: id,
        value: value
      });
    } else {
      db[index] = {
        id: id,
        value: value
      };
    }
    resolve();
  });
};

var remove = function (id) {
  logger.trace('Mock client db removing', id);
  return new Promise(function (resolve) {
    db = db.filter(function (value) {
      return value.id !== id;
    });
    resolve();
  });
};

module.exports = {
  get: get,
  put: put,
  remove: remove
};
