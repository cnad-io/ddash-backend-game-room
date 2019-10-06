'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var infinispan = require('infinispan');
var Promise = require('bluebird');
var request = require('request');

var getClient = function () {
  /*fix DG*/
  if (process.env.NODE_ENV === 'production-') {
    logger.trace('Return infinispan client');
    return infinispan.client({
      port: process.env.DATAGRID_PORT || 11222,
      host: process.env.DATAGRID_HOST || 'ddash-datagrid-hotrod'
    }, {
      cacheName: process.env.DATAGRID_CACHE_NAME || 'game-room',
      version: process.env.DATAGRID_PROTO_VERSION || '2.5'
    });
  }
  logger.trace('Return mock client db'); // eslint-disable-next-line global-require
  var client = require('../mock/client-db');
  return new Promise(function (resolve) {
    resolve(client);
  });
};

/**
 * game session class.
 * @constructor
 * @param {String} roomId - The room's identifier for a session
 * @param {Date} date - The session's creation date
 * @param {Array.<Player>} users - The list of players in the session
 * @param {String} state - The state of the session
 */
// eslint-disable-next-line max-params
var Session = function (roomId, date, users, state) {
  this.roomId = roomId;
  this.id = roomId;
  this.date = date;
  this.users = users;
  this.state = state;
};

Session.prototype.getPlayer = function (playerId) {
  var id = this.roomId;
  return new Promise(function (resolve, reject) {
    getClient.then(function (client) {
      client.get(id + '.player.' + playerId)
      .then(function (player) {
        if (typeof player === 'string') {
          resolve(JSON.parse(player));
        } else {
          resolve(player);
        }
      })
      .catch(function (error) {
        logger.error('Error when was searching player in DB', error);
        reject(error);
      });
    });
  });
};

Session.prototype.getPlayers = function (session) {
  return new Promise(function (resolve, reject) {
    getClient().then(function (client) {
      var processes = session.users.map(function (value) {
        logger.info("value", value)
        return client.get(session.id + '.player.' + value.nickname);
      });
      Promise.all(processes).then(function (users) {
        if (typeof users === 'string') {
          resolve(JSON.parse(users));
        } else {
          resolve(users);
        }
      })
      .catch(reject);
    })
    .catch(reject);
  });
};

Session.prototype.savePlayer = function (id, player) {
  logger.trace('Saving player with session');
  
  return getClient().then(function (client) {
    logger.trace('Saving player on cache DB', id, player);
    return client.put(id + '.player.' + player.nickname, player);
  });
};

Session.prototype.deletePlayer = function (playerId) {
  var id = this.roomId;
  return getClient().then(function (client) {
    logger.trace('Deleting player on cache DB', id, playerId);
    return client.remove(id + '.player.' + playerId);
  });
};

Session.prototype.find = function () {
  var id = this.roomId;
  return new Promise(function (resolve, reject) {
    var url = (process.env.ROOM_MANAGEMENT_URL || 'http://room-management:3000') + '/api/room/' + id;
    logger.trace('URL for get room from room management', url);
    request.get(url, function (error, res, body) {
      if (error) {
        logger.error('Error trying to get session from room management', error);
        getClient.then(function (client) {
          client.get('room.' + id).then(function (data) {
            if (typeof data === 'string') {
              resolve(JSON.parse(data));
            } else {
              resolve(data);
            }
          })
          .catch(function (errorFromDB) {
            logger.error('Error trying to get session from get by id cache db', error);
            reject(errorFromDB);
          });
        })
        .catch(function (errorFromDB) {
          logger.error('Error trying to get session from get client cache db', error);
          reject(errorFromDB);
        });
      } else {
        logger.trace('Get from room management return session', body, typeof body);
        if (typeof body === 'string') {
          resolve(JSON.parse(body));
        } else {
          resolve(body);
        }
      }
    });
  });
};

Session.prototype.save = function () {
  var session = {
    id: this.roomId,
    date: this.date,
    playerList: this.users,
    state: this.state
  };
  getClient.then(function (client) {
    client.put('room.' + session.id, session);
  });
  return new Promise(function (resolve, reject) {
    var url = (process.env.ROOM_MANAGEMENT_URL || 'http://room-management:3000') + '/api/room/' + session.id;
    logger.trace('URL for delete room from room management', url);
    request.put({
      url: url,
      method: 'PUT',
      json: session
    }, function (error, res, body) {
      if (error) {
        logger.error('Error trying to get session from room management', error);
        reject(error);
      } else {
        logger.trace('Get from room management return session', body, typeof body);
        resolve(body);
      }
    });
  });
};

Session.prototype.delete = function () {
  var id = this.roomId;
  getClient.then(function (client) {
    client.remove('room.' + id);
  });
  return new Promise(function (resolve, reject) {
    var url = (process.env.ROOM_MANAGEMENT_URL || 'http://room-management:3000') + '/api/room/' + id;
    logger.trace('URL for delete room from room management', url);
    request.put({
      url: url,
      method: 'PUT',
      json: {
        state: 'deleted'
      }
    }, function (error, res, body) {
      if (error) {
        logger.error('Error trying to get session from room management', error);
        reject(error);
      } else {
        logger.trace('Get from room management return session', body, typeof body);
        resolve(body);
      }
    });
  });
};

module.exports = Session;
