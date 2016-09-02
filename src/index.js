"use strict";

const AudioContext = global.AudioContext || global.webkitAudioContext;
const OfflineAudioContext = global.OfflineAudioContext || global.webkitOfflineAudioContext;

const SpatialPannerNode = require("./SpatialPannerNode");

SpatialPannerNode.install = (opts = {}) => {
  AudioContext.prototype.createPanner = function() {
    return new SpatialPannerNode(this, opts);
  };
};

SpatialPannerNode.polyfill = (opts = {}) => {
  if (!new OfflineAudioContext(1, 8, 44100).createPanner().positionX) {
    SpatialPannerNode.install(opts);
  }
};

module.exports = SpatialPannerNode;
