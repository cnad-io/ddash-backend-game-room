'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var events = require('./models/events');
var sessionController = require('./controllers/session');
var intervalProcess = null;
var attempts = [];

/* eslint max-lines-per-function: ["error", 100] */
module.exports = function (io) {
  var checkGameRoom = function (session) {
    // eslint-disable-next-line max-statements
    sessionController.findPlayers(session).then(function (playerList) {
      logger.trace('Players joined with session', playerList, session);
      var connected = playerList.filter(function (value) {
        return value.connected;
      });
      if (connected.length === playerList.length) {
        logger.trace('Emitting Game ready');
        io.to(session.id).emit(
          events.public.out.gameReady,
          session
        );
        if (intervalProcess) {
          clearInterval(intervalProcess);
        }
      } else if (connected.length !== playerList.length && !intervalProcess) {
        intervalProcess = setInterval(function () {
          logger.info('Starting interval process because all users are not connected yet', connected, session);
          sessionController.find(session.id)
          .then(checkGameRoom);
        }, 1000);
      } else {
        var index = attempts.find(function (value) {
          return value.id === session.id;
        });
        logger.info('Game room can not be ready because all users are not connected yet', connected, session);
        if (index <= -1) {
          attempts.push({
            id: session.id,
            number: 10
          });
        } else if (attempts[index].number <= 0) {
          clearInterval(intervalProcess);
          sessionController.remove(session.id);
        } else {
          logger.info('Attempt to put ready the game room', attempts[index].number, session.id);
          attempts[index].number -= 1;
        }
      }
    })
    .catch(function (error) {
      logger.error('Error when tried to find players in session', error, session);
      if (intervalProcess) {
        clearInterval(intervalProcess);
      }
    });
  };

  io.on('connection', function (socket) {
    socket.on(events.public.in.join, function (data) {
      logger.trace('Data received from join', data);
      if (!data.roomId) {
        return socket.disconnect();
      }
      data.socketId = socket.id;
      logger.trace('Joining connection to room', data.roomId);
      socket.join(data.roomId);
      sessionController.joinPlayer(data.roomId, data)
      .then(checkGameRoom)
      .catch(function (error) {
        logger.error('Error to join player because session was not found', data, error);
        socket.disconnect();
      });
    });
    socket.on(events.public.in.playerMoved, function (data) {
      logger.trace('Data received from player moved', data);
      if (!data.roomId) {
        socket.disconnect();
      }
      sessionController.playerMove(data);
      socket.broadcast.to(data.roomId)
      .emit(events.public.out.remotePlayerMoved, data);
    });
    socket.on(events.public.in.disconnect, function () {
      logger.debug('Room where player is disconnecting');
      // sessionController.playerDisconnected(socket.id);
    });
  });
};
