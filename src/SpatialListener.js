"use strict";

const PARAMETERS = [
  "positionX", "positionY", "positionZ", "forwardX", "forwardY", "forwardZ", "upX", "upY", "upZ"
];

function SpatialListener() {}

SpatialListener.getInstance = (audioContext) => {
  if (!audioContext.__spatialListener) {
    audioContext.__spatialListener = createSpatialListener(audioContext);
  }
  return audioContext.__spatialListener;
};

function createSpatialListener(audioContext) {
  const listener = {};
  const audioContextListener = audioContext.listener;
  const waveShaper = audioContext.createWaveShaper();
  const paramNodes = PARAMETERS.map(() => audioContext.createGain());

  waveShaper.channelCount = 1;
  waveShaper.channelCountMode = "explicit";
  waveShaper.channelInterpretation = "discrete";

  paramNodes.forEach((node) => {
    node.gain.value = 0;
    waveShaper.connect(node);
  });

  listener.playbackTime = -1;
  listener.waveShaper = waveShaper;
  listener.paramNodes = paramNodes;

  const prevValues = new Float32Array(9);

  listener.update = (values) => {
    if (values[0] !== prevValues[0] || values[1] !== prevValues[1] || values[2] !== prevValues[2]) {
      audioContextListener.setPosition(values[0], values[1], values[2]);
      prevValues[0] = values[0];
      prevValues[1] = values[1];
      prevValues[2] = values[2];
    }
    if (values[3] !== prevValues[3] || values[4] !== prevValues[4] || values[5] !== prevValues[5] ||
        values[6] !== prevValues[6] || values[7] !== prevValues[7] || values[8] !== prevValues[8]) {
      audioContextListener.setOrientation(values[3], values[4], values[5], values[6], values[7], values[8]);
      prevValues[3] = values[3];
      prevValues[4] = values[4];
      prevValues[5] = values[5];
      prevValues[6] = values[6];
      prevValues[7] = values[7];
      prevValues[8] = values[8];
    }
  };

  // exports api
  PARAMETERS.forEach((name, i) => {
    Object.defineProperty(audioContextListener, name, {
      get() {
        return paramNodes[i].gain;
      }
    });
  });

  return listener;
}

module.exports = SpatialListener;
