'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var Promise = require('bluebird');
var Session = require('../models/session');

var find = function (id) {
  logger.info('Searching session in cache db');
  logger.debug('Searching session id', id);
  var session = new Session(id);
  return session.find();
};

var findPlayers = function (session) {
  logger.info('Searching players in session from cache db');
  logger.debug('Searching players with session', session);
  return new Session().getPlayers(session);
};

// eslint-disable-next-line max-params
var save = function (id, date, playerList, state) {
  logger.info('Saving session in cache db');
  var session = new Session(id, date, playerList, state);
  logger.debug('Saving session info', session);
  return session.save();
};

var remove = function (id) {
  logger.info('Removing session from cache db');
  logger.debug('Removing session id', id);
  var session = new Session(id);
  return session.remove();
};

var savePlayer = function (id, player) {
  logger.info('Saving player in cache db');
  logger.debug('Saving player info', id, player);
  return new Session().savePlayer(id, player);
};

var joinPlayer = function (roomId, player) {
  return new Promise(function (resolve, reject) {
    logger.info('Joining player in game session');
    logger.info('Session id where Player is trying to join', roomId, player);
    find(roomId).then(function (session) {
      logger.debug('Session found', session, typeof session);
      // eslint-disable-next-line no-undef
      Reflect.deleteProperty(player, 'roomId');
      player.connected = true;
      savePlayer(session.id, player).then(function () {
        resolve(session);
      })
      .catch(function (error) {
        logger.error('Error trying to save player', error);
        reject(error);
      });
    });
  }).catch(function (error) {
    logger.error('Error when tried to find a session with id', roomId, error);
  });
};

var playerDisconnected = function (socketId, roomId) {
  logger.info('Player disconnected');
  logger.debug('Socket ID from disconnected player', socketId);
  find(roomId).then(function (session) {
    logger.trace('Player moved proceed because session was found', session);
    var index = session.playerList.findIndex(function (value) {
      return socketId === value.socketId;
    });
    session.playerList[index].connected = false;
    logger.trace('Player list that will be saved', session.playerList);
    return save(session.id, session.date, session.playerList);
  });
};

var playerMove = function (player) {
  logger.debug('Player moved', player);
  return new Promise(function (resolve, reject) {
    find(player.roomId).then(function (session) {
      logger.trace('Player moved proceed because session was found', session);
      // eslint-disable-next-line no-undef
      Reflect.deleteProperty(player, 'roomId');
      savePlayer(session.id, player).then(function () {
        resolve(session);
      })
      .catch(function (error) {
        logger.error('Error trying to save player', error);
        reject(error);
      });
    });
  });
};

module.exports = {
  find: find,
  remove: remove,
  findPlayers: findPlayers,
  playerMove: playerMove,
  joinPlayer: joinPlayer,
  playerDisconnected: playerDisconnected
};
