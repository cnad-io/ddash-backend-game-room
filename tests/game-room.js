'use strict';

var io = require('socket.io');
var events = require('../models/events');
var ioClient = require('socket.io-client');
// eslint-disable-next-line prefer-destructuring
var expect = require('chai').expect;

var options = {
  transports: ['websocket'],
  'force new connection': true
};

// eslint-disable-next-line init-declarations
var roomId, server;

before(function () { // eslint-disable-next-line global-require
  var app = require('http').createServer(function (req, res) { // eslint-disable-next-line global-require
    require('../mock/room-management')(req, res);
  });
  server = io(app); // eslint-disable-next-line global-require
  require('../socket')(server);
  app.listen('5000', function () {
    process.env.ROOM_MANAGEMENT_URL = 'http://localhost:5000';
  });
  roomId = '10bbe9fe-bdb8-44b7-9c64-76cd48fb46fe';
});

after(function () {
  server.close();
});

/* eslint max-lines-per-function: ["error", 100], no-unused-expressions: 0 */
describe('Game Room', function () {
  describe('When all players in the room are connected', function () {
    it('Should respond that the game session is ready to start', function (done) {
      var client1 = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client1.on('connect', function () {
        client1.emit(events.public.in.join, {
          id: '61336330-6135-6665-2d61-6436612d3131',
          roomId: roomId,
          nickname: 'camedeir'
        });
      });

      var client2 = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client2.on('connect', function () {
        client2.emit(events.public.in.join, {
          id: '61336331-6138-3464-2d61-6436612d3131',
          roomId: roomId,
          nickname: 'mcaballol'
        });
      });

      client2.on(events.public.out.gameReady, function (data) {
        expect(data).to.have.property('id').equal(roomId);
        expect(data).to.have.property('date');
        expect(data.playerList.length).to.be.equal(2);
        expect(data.playerList[0]).to.have.property('id');
        expect(data.playerList[0]).to.have.property('score');
        done();
        client1.disconnect();
        client2.disconnect();
      });
    });
  });

  describe('When a player move in the room', function () {
    it('Should emit the movement information to other connected players', function (done) {
      var client1 = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client1.on('connect', function () {
        client1.emit(events.public.in.join, {
          id: '61336330-6135-6665-2d61-6436612d3131',
          roomId: roomId,
          nickname: 'camedeir'
        });
      });

      var client2 = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client2.on('connect', function () {
        client2.emit(events.public.in.join, {
          id: '61336331-6138-3464-2d61-6436612d3131',
          roomId: roomId,
          nickname: 'mcaballol'
        });

        setTimeout(function () {
          client2.emit(events.public.in.playerMoved, {
            id: '61336331-6138-3464-2d61-6436612d3131',
            roomId: roomId,
            position: {
              'x': 111,
              'y': 222,
              'z': 333
            },
            nickname: 'mcaballol',
            score: 100
          });
        }, 10);
      });

      client1.on(events.public.out.remotePlayerMoved, function (data) {
        expect(data).to.have.property('id').equal('61336331-6138-3464-2d61-6436612d3131');
        expect(data).to.have.property('nickname').equal('mcaballol');
        expect(data).to.have.property('position').deep.equal({
          'x': 111,
          'y': 222,
          'z': 333
        });
        expect(data).to.have.property('score').equal(100);
        done();
        client1.disconnect();
        client2.disconnect();
      });
    });
  });
});
