"use strict";

const SpatialListener = require("./SpatialListener");

const PARAMETERS = [
  "positionX", "positionY", "positionZ", "orientationX", "orientationY", "orientationZ"
];
const ATTRIBUTES = [
  "panningModel", "distanceModel", "refDistance", "maxDistance", "coneInnerAngle", "coneOuterAngle", "coneOuterGain"
];
const METHODS = [
  "setPosition", "setOrientation", "setVelocity"
];
const REPLACE_METHODS = [
  "connect", "disconnect"
];

function SpatialPannerNode(audioContext, opts = {}) {
  return createInstance(audioContext, opts);
}

function createInstance(audioContext, opts) {
  const panner = audioContext.createPanner();

  if (panner.positionX) {
    return panner;
  }

  const bufferSize = opts.bufferSize || 512;
  const notNeedListenerAPI = !!opts.notNeedListenerAPI;
  const channelCount = notNeedListenerAPI ? 6 : 15;
  const input = audioContext.createGain();
  const waveShaper = audioContext.createWaveShaper();
  const paramNodes = PARAMETERS.map(() => audioContext.createGain());
  const channelMerger = audioContext.createChannelMerger(channelCount);
  const scriptProcessor = audioContext.createScriptProcessor(bufferSize, channelCount, 1);

  input.connect(panner);
  input.connect(waveShaper);

  waveShaper.channelCount = 1;
  waveShaper.channelCountMode = "explicit";
  waveShaper.channelInterpretation = "discrete";
  waveShaper.curve = new Float32Array([ 1, 1 ]);

  paramNodes.forEach((node, i) => {
    node.gain.value = 0;
    waveShaper.connect(node);
    node.connect(channelMerger, 0, i);
  });

  channelMerger.connect(scriptProcessor);

  scriptProcessor.connect(panner);

  const prevValues = new Float32Array(6);

  if (notNeedListenerAPI) {
    scriptProcessor.onaudioprocess = (e) => {
      const buffer = e.inputBuffer;
      const values = new Float32Array([
        buffer.getChannelData(0)[0], // positionX
        buffer.getChannelData(1)[0], // positionY
        buffer.getChannelData(2)[0], // positionZ
        buffer.getChannelData(3)[0], // orientationX
        buffer.getChannelData(4)[0], // orientationY
        buffer.getChannelData(5)[0], // orientationZ
      ]);

      if (values[0] !== prevValues[0] || values[1] !== prevValues[1] || values[2] !== prevValues[2]) {
        panner.setPosition(values[0], values[1], values[2]);
        prevValues[0] = values[0];
        prevValues[1] = values[1];
        prevValues[2] = values[2];
      }
      if (values[3] !== prevValues[3] || values[4] !== prevValues[4] || values[5] !== prevValues[5]) {
        panner.setOrientation(values[3], values[4], values[5]);
        prevValues[3] = values[3];
        prevValues[4] = values[4];
        prevValues[5] = values[5];
      }
    };
  } else {
    const listener = SpatialListener.getInstance(audioContext);

    input.connect(listener.waveShaper);
    listener.paramNodes.forEach((node, i) => {
      node.connect(channelMerger, 0, i + 6);
    });

    scriptProcessor.onaudioprocess = (e) => {
      const playbackTime = e.playbackTime;
      const buffer = e.inputBuffer;

      if (listener.playbackTime < playbackTime) {
        const values = new Float32Array([
          buffer.getChannelData(6)[0], // positionX
          buffer.getChannelData(7)[0], // positionX
          buffer.getChannelData(8)[0], // positionX
          buffer.getChannelData(9)[0], // forwardX
          buffer.getChannelData(10)[0], // forwardY
          buffer.getChannelData(11)[0], // forwardZ
          buffer.getChannelData(12)[0], // upX
          buffer.getChannelData(13)[0], // upY
          buffer.getChannelData(14)[0], // upZ
        ]);

        listener.update(values);
        listener.playbackTime = playbackTime;
      }

      const values = new Float32Array([
        buffer.getChannelData(0)[0], // positionX
        buffer.getChannelData(1)[0], // positionY
        buffer.getChannelData(2)[0], // positionZ
        buffer.getChannelData(3)[0], // orientationX
        buffer.getChannelData(4)[0], // orientationY
        buffer.getChannelData(5)[0], // orientationZ
      ]);

      if (values[0] !== prevValues[0] || values[1] !== prevValues[1] || values[2] !== prevValues[2]) {
        panner.setPosition(values[0], values[1], values[2]);
        prevValues[0] = values[0];
        prevValues[1] = values[1];
        prevValues[2] = values[2];
      }
      if (values[3] !== prevValues[3] || values[4] !== prevValues[4] || values[5] !== prevValues[5]) {
        panner.setOrientation(values[3], values[4], values[5]);
        prevValues[3] = values[3];
        prevValues[4] = values[4];
        prevValues[5] = values[5];
      }
    };
  }

  // exports api
  PARAMETERS.forEach((name, i) => {
    Object.defineProperty(input, name, {
      get() {
        return paramNodes[i].gain;
      }
    });
  });

  ATTRIBUTES.forEach((name) => {
    Object.defineProperty(input, name, {
      get() {
        return panner[name];
      },
      set(value) {
        panner[name] = value;
      }
    });
  });

  METHODS.forEach((name) => {
    Object.defineProperty(input, name, {
      value: panner[name].bind(input)
    });
  });

  REPLACE_METHODS.forEach((name) => {
    Object.defineProperty(input, name, {
      value: panner[name].bind(panner)
    });
  });

  return input;
}

module.exports = SpatialPannerNode;
