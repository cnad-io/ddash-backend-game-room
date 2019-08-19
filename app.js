'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});
var app = require('http').createServer(function (req, res) {
  if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.write('{ "message": "ok" }');
    res.end();
  }
  if (process.env.MOCK_ROOM_MANAGEMENT) { // eslint-disable-next-line global-require
    require('./mock/room-management')(req, res);
  }
});

var io = require('socket.io')(app);

logger.info('Setting accepted origins.');
io.origins('*:*');

var redisAdapter = require('socket.io-redis');
var redis = require('redis');

if (process.env.REDIS_ADAPTER_URL) {
  logger.info('Integrating with Redis.');
  var pub = redis.createClient(
    process.env.REDIS_ADAPTER_PORT || 6379,
    process.env.REDIS_ADAPTER_URL || 'redis-waiting-room', {
    'auth_pass': process.env.REDIS_ADAPTER_PASS || 'pwd'
  });
  var sub = redis.createClient(
    process.env.REDIS_ADAPTER_PORT || 6379,
    process.env.REDIS_ADAPTER_URL || 'redis-waiting-room', {
    'auth_pass': process.env.REDIS_ADAPTER_PASS || 'pwd'
  });
  logger.debug('Redis configuration.', pub, sub);
  io.adapter(redisAdapter({ pubClient: pub, subClient: sub }));
}

require('./socket')(io);

var port = process.env.PORT || 8080;

app.listen(port, function () {
  logger.info('Server started and ready to receive requests');
});

module.exports = {
  server: app,
  ws: io
};
