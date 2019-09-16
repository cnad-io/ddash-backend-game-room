'use strict';

var uuid = require('uuid');

var rooms = [
  {
    id: '10bbe9fe-bdb8-44b7-9c64-76cd48fb46fe',
    date: Date.now(),
    playerList: [
      {
        id: '61336330-6135-6665-2d61-6436612d3131',
        score: 0
      },
      {
        id: '61336331-6138-3464-2d61-6436612d3131',
        score: 0
      }
    ]
  }
];

/* eslint max-statements: ["error", 40], max-lines-per-function: ["error", 70] */
module.exports = function (req, res) {
  var room = {};
  if (req.method === 'GET' && req.url === '/api/room') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(rooms));
    res.end();
  }
  var regexpGetById = new RegExp('/room/.+', 'u');
  if (req.method === 'GET' && regexpGetById.test(req.url)) {
    var idsGetById = req.url.split('/');
    // eslint-disable-next-line prefer-destructuring
    var idGetById = idsGetById[2];
    room = rooms.filter(function (value) {
      return value.id === idGetById;
    });
    if (room.length > 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(room[0]));
    } else {
      res.statusCode = 404;
    }
    res.end();
  }
  if (req.method === 'POST' && req.url === '/api/room') {
    room = {
      id: uuid(),
      date: Date.now(),
      playerList: []
    };
    rooms.push(room);
    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(room));
    res.end();
  }
};
