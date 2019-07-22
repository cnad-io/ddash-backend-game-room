'use strict';

module.exports = {
  public: {
    in: {
      join:'join game room',
      disconnect:'disconnect',
      player_moved: 'player moved'
    },
    out:{
      scene_updated: 'scene update',
      score_updated: 'score update',
      game_ready: 'game ready',
      news: 'news',
      remote_player_moved: 'remote player moved'
    }
  },
  server: {
    in: {
      createRoom: 'createRoom',
      disconnect: 'disconnect'
    },
    out:{
      new_room: 'newroom'
    }
  },
  process:{
    sendNewsToRoom: "send news to room",
    sendPlayerMoveToRoom: "send player move to room",
    sendGameReadySignal: "send game ready signal"
  }
};

