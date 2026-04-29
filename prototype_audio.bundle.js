(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/@web-kits/audio/dist/index.js
  function getContext(options) {
    if (options) {
      storedOptions = options;
    }
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContext({
        latencyHint: storedOptions.latencyHint,
        sampleRate: storedOptions.sampleRate
      });
      masterGain = null;
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }
  function getDestination() {
    const c = getContext();
    if (masterGain && masterGain.context === c) {
      return masterGain;
    }
    return c.destination;
  }
  function withMix(ctx2, mix, create) {
    const input = ctx2.createGain();
    const output = ctx2.createGain();
    const dry = ctx2.createGain();
    dry.gain.value = 1 - mix;
    input.connect(dry);
    dry.connect(output);
    const wet = ctx2.createGain();
    wet.gain.value = mix;
    input.connect(wet);
    const wetOut = ctx2.createGain();
    wetOut.connect(output);
    const result = create(wet, wetOut);
    return {
      input,
      output,
      dispose: result?.dispose
    };
  }
  function createReverb(ctx2, opts) {
    const decay = opts.decay ?? 0.5;
    const mix = opts.mix ?? 0.3;
    const preDelay = opts.preDelay ?? 0;
    const damping = opts.damping ?? 0;
    const roomSize = opts.roomSize ?? 1;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const sampleRate = ctx2.sampleRate;
      const effectiveDecay = decay * roomSize;
      const length = Math.ceil(sampleRate * effectiveDecay);
      const buffer = ctx2.createBuffer(2, length, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.28));
        }
      }
      if (damping > 0) {
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          const coeff = Math.min(damping, 0.99);
          let prev = 0;
          for (let i = 0; i < length; i++) {
            prev = data[i] * (1 - coeff) + prev * coeff;
            data[i] = prev;
          }
        }
      }
      const convolver = ctx2.createConvolver();
      convolver.buffer = buffer;
      if (preDelay > 0) {
        const preDelayNode = ctx2.createDelay(Math.max(preDelay + 0.01, 1));
        preDelayNode.delayTime.value = preDelay;
        wet.connect(preDelayNode);
        preDelayNode.connect(convolver);
      } else {
        wet.connect(convolver);
      }
      convolver.connect(wetOut);
    });
  }
  function createConvolver(ctx2, opts) {
    const mix = opts.mix ?? 0.5;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const convolver = ctx2.createConvolver();
      if (opts.buffer) {
        convolver.buffer = opts.buffer;
      } else if (opts.url) {
        const cached = irCache.get(opts.url);
        if (cached) {
          convolver.buffer = cached;
        } else {
          const url = opts.url;
          fetch(url).then((res) => res.arrayBuffer()).then((data) => ctx2.decodeAudioData(data)).then((decoded) => {
            irCache.set(url, decoded);
            convolver.buffer = decoded;
          });
        }
      }
      wet.connect(convolver);
      convolver.connect(wetOut);
    });
  }
  function createDelay(ctx2, opts) {
    const time = opts.time ?? 0.25;
    const feedback = opts.feedback ?? 0.3;
    const mix = opts.mix ?? 0.3;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const delay = ctx2.createDelay(Math.max(time + 0.01, 1));
      delay.delayTime.value = time;
      const fb = ctx2.createGain();
      fb.gain.value = feedback;
      wet.connect(delay);
      delay.connect(fb);
      if (opts.feedbackFilter) {
        const filter = ctx2.createBiquadFilter();
        filter.type = opts.feedbackFilter.type;
        filter.frequency.value = opts.feedbackFilter.frequency;
        filter.Q.value = opts.feedbackFilter.Q ?? 1;
        fb.connect(filter);
        filter.connect(delay);
      } else {
        fb.connect(delay);
      }
      delay.connect(wetOut);
    });
  }
  function createDistortion(ctx2, opts) {
    const amount = opts.amount ?? 50;
    const mix = opts.mix ?? 0.5;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const shaper = ctx2.createWaveShaper();
      const samples = 44100;
      const curve = new Float32Array(samples);
      const k = amount;
      for (let i = 0; i < samples; i++) {
        const x = i * 2 / samples - 1;
        curve[i] = Math.tanh(k * x);
      }
      shaper.curve = curve;
      shaper.oversample = "4x";
      wet.connect(shaper);
      shaper.connect(wetOut);
    });
  }
  function createChorus(ctx2, opts) {
    const rate = opts.rate ?? 1.5;
    const depth = opts.depth ?? 3e-3;
    const mix = opts.mix ?? 0.3;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const delayL = ctx2.createDelay();
      delayL.delayTime.value = 0.012;
      const delayR = ctx2.createDelay();
      delayR.delayTime.value = 0.016;
      const lfoL = ctx2.createOscillator();
      lfoL.type = "sine";
      lfoL.frequency.value = rate;
      const lfoR = ctx2.createOscillator();
      lfoR.type = "sine";
      lfoR.frequency.value = rate * 1.1;
      const lfoGainL = ctx2.createGain();
      lfoGainL.gain.value = depth;
      const lfoGainR = ctx2.createGain();
      lfoGainR.gain.value = depth;
      lfoL.connect(lfoGainL);
      lfoGainL.connect(delayL.delayTime);
      lfoL.start();
      lfoR.connect(lfoGainR);
      lfoGainR.connect(delayR.delayTime);
      lfoR.start();
      wet.connect(delayL);
      wet.connect(delayR);
      delayL.connect(wetOut);
      delayR.connect(wetOut);
      return {
        dispose() {
          try {
            lfoL.stop();
          } catch (_) {
          }
          try {
            lfoR.stop();
          } catch (_) {
          }
        }
      };
    });
  }
  function createFlanger(ctx2, opts) {
    const rate = opts.rate ?? 0.5;
    const depth = opts.depth ?? 2e-3;
    const feedback = opts.feedback ?? 0.5;
    const mix = opts.mix ?? 0.5;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const delay = ctx2.createDelay();
      delay.delayTime.value = 5e-3;
      const lfo = ctx2.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = rate;
      const lfoGain = ctx2.createGain();
      lfoGain.gain.value = depth;
      lfo.connect(lfoGain);
      lfoGain.connect(delay.delayTime);
      lfo.start();
      const fb = ctx2.createGain();
      fb.gain.value = feedback;
      delay.connect(fb);
      fb.connect(delay);
      wet.connect(delay);
      delay.connect(wetOut);
      return {
        dispose() {
          try {
            lfo.stop();
          } catch (_) {
          }
        }
      };
    });
  }
  function createPhaser(ctx2, opts) {
    const rate = opts.rate ?? 0.5;
    const depth = opts.depth ?? 1e3;
    const stages = opts.stages ?? 4;
    const feedback = opts.feedback ?? 0.5;
    const mix = opts.mix ?? 0.5;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const filters = [];
      const baseFreqs = [
        200,
        600,
        1200,
        2400,
        4800,
        8e3
      ];
      for (let i = 0; i < stages; i++) {
        const f = ctx2.createBiquadFilter();
        f.type = "allpass";
        f.frequency.value = baseFreqs[i % baseFreqs.length];
        f.Q.value = 0.5;
        filters.push(f);
      }
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      const lfo = ctx2.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = rate;
      const lfoGain = ctx2.createGain();
      lfoGain.gain.value = depth;
      lfo.connect(lfoGain);
      for (const f of filters) {
        lfoGain.connect(f.frequency);
      }
      lfo.start();
      const fb = ctx2.createGain();
      fb.gain.value = feedback;
      filters[filters.length - 1].connect(fb);
      fb.connect(filters[0]);
      wet.connect(filters[0]);
      filters[filters.length - 1].connect(wetOut);
      return {
        dispose() {
          try {
            lfo.stop();
          } catch (_) {
          }
        }
      };
    });
  }
  function createTremolo(ctx2, opts) {
    const rate = opts.rate ?? 4;
    const depth = opts.depth ?? 0.5;
    const input = ctx2.createGain();
    const output = ctx2.createGain();
    const tremGain = ctx2.createGain();
    tremGain.gain.value = 1 - depth / 2;
    input.connect(tremGain);
    tremGain.connect(output);
    const lfo = ctx2.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = rate;
    const lfoGain = ctx2.createGain();
    lfoGain.gain.value = depth / 2;
    lfo.connect(lfoGain);
    lfoGain.connect(tremGain.gain);
    lfo.start();
    return {
      input,
      output,
      dispose() {
        try {
          lfo.stop();
        } catch (_) {
        }
      }
    };
  }
  function createVibrato(ctx2, opts) {
    const rate = opts.rate ?? 5;
    const depth = opts.depth ?? 2e-3;
    const input = ctx2.createGain();
    const output = ctx2.createGain();
    const delay = ctx2.createDelay();
    delay.delayTime.value = depth;
    const lfo = ctx2.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = rate;
    const lfoGain = ctx2.createGain();
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();
    input.connect(delay);
    delay.connect(output);
    return {
      input,
      output,
      dispose() {
        try {
          lfo.stop();
        } catch (_) {
        }
      }
    };
  }
  function createBitcrusher(ctx2, opts) {
    const bits = opts.bits ?? 8;
    const mix = opts.mix ?? 1;
    const srReduction = opts.sampleRateReduction ?? 1;
    return withMix(ctx2, mix, (wet, wetOut) => {
      const shaper = ctx2.createWaveShaper();
      const steps = 2 ** bits;
      const samples = 65536;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = i * 2 / samples - 1;
        if (srReduction > 1) {
          const blockIndex = Math.floor(i / srReduction) * srReduction;
          const blockX = blockIndex * 2 / samples - 1;
          curve[i] = Math.round(blockX * steps) / steps;
        } else {
          curve[i] = Math.round(x * steps) / steps;
        }
      }
      shaper.curve = curve;
      wet.connect(shaper);
      shaper.connect(wetOut);
    });
  }
  function createCompressor(ctx2, opts) {
    const comp = ctx2.createDynamicsCompressor();
    comp.threshold.value = opts.threshold ?? -24;
    comp.knee.value = opts.knee ?? 30;
    comp.ratio.value = opts.ratio ?? 4;
    comp.attack.value = opts.attack ?? 3e-3;
    comp.release.value = opts.release ?? 0.25;
    return {
      input: comp,
      output: comp
    };
  }
  function createEQ(ctx2, opts) {
    const input = ctx2.createGain();
    const output = ctx2.createGain();
    if (opts.bands.length === 0) {
      input.connect(output);
      return {
        input,
        output
      };
    }
    const filters = opts.bands.map((band) => {
      const f = ctx2.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.frequency;
      f.gain.value = band.gain;
      f.Q.value = band.Q ?? 1;
      return f;
    });
    input.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }
    filters[filters.length - 1].connect(output);
    return {
      input,
      output
    };
  }
  function createGainEffect(ctx2, opts) {
    const gain = ctx2.createGain();
    gain.gain.value = opts.value;
    return {
      input: gain,
      output: gain
    };
  }
  function createPanEffect(ctx2, opts) {
    const panner = ctx2.createStereoPanner();
    panner.pan.value = opts.value;
    return {
      input: panner,
      output: panner
    };
  }
  function createEffect(ctx2, effect) {
    switch (effect.type) {
      case "reverb":
        return createReverb(ctx2, effect);
      case "convolver":
        return createConvolver(ctx2, effect);
      case "delay":
        return createDelay(ctx2, effect);
      case "distortion":
        return createDistortion(ctx2, effect);
      case "chorus":
        return createChorus(ctx2, effect);
      case "flanger":
        return createFlanger(ctx2, effect);
      case "phaser":
        return createPhaser(ctx2, effect);
      case "tremolo":
        return createTremolo(ctx2, effect);
      case "vibrato":
        return createVibrato(ctx2, effect);
      case "bitcrusher":
        return createBitcrusher(ctx2, effect);
      case "compressor":
        return createCompressor(ctx2, effect);
      case "eq":
        return createEQ(ctx2, effect);
      case "gain":
        return createGainEffect(ctx2, effect);
      case "pan":
        return createPanEffect(ctx2, effect);
    }
  }
  function isMultiLayer(def) {
    return "layers" in def;
  }
  function normalize(def) {
    if (isMultiLayer(def)) return def;
    return {
      layers: [
        def
      ],
      effects: []
    };
  }
  function generateWhiteNoise(data) {
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  function generatePinkNoise(data) {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  function generateBrownNoise(data) {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  function createNoiseBuffer(ctx2, color, duration) {
    const length = ctx2.sampleRate * duration;
    const buffer = ctx2.createBuffer(1, length, ctx2.sampleRate);
    const data = buffer.getChannelData(0);
    switch (color) {
      case "pink":
        generatePinkNoise(data);
        break;
      case "brown":
        generateBrownNoise(data);
        break;
      default:
        generateWhiteNoise(data);
        break;
    }
    return buffer;
  }
  async function loadSample(ctx2, url) {
    const cached = sampleCache.get(url);
    if (cached) return cached;
    const response = await fetch(url);
    const data = await response.arrayBuffer();
    const decoded = await ctx2.decodeAudioData(data);
    sampleCache.set(url, decoded);
    return decoded;
  }
  function buildOscillatorSource(ctx2, src, t, duration) {
    const osc = ctx2.createOscillator();
    osc.type = src.type;
    if (typeof src.frequency === "number") {
      osc.frequency.setValueAtTime(src.frequency, t);
    } else {
      osc.frequency.setValueAtTime(src.frequency.start, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(src.frequency.end, 1), t + duration);
    }
    if (src.detune) {
      osc.detune.value = src.detune;
    }
    osc.start(t);
    osc.stop(t + duration + 0.1);
    let fmMod;
    if (src.fm) {
      const carrierFreq = typeof src.frequency === "number" ? src.frequency : src.frequency.start;
      fmMod = ctx2.createOscillator();
      fmMod.type = "sine";
      fmMod.frequency.value = carrierFreq * src.fm.ratio;
      const modGain = ctx2.createGain();
      modGain.gain.value = src.fm.depth;
      fmMod.connect(modGain);
      modGain.connect(osc.frequency);
      fmMod.start(t);
      fmMod.stop(t + duration + 0.1);
    }
    return {
      node: osc,
      scheduled: osc,
      frequencyParam: osc.frequency,
      detuneParam: osc.detune
    };
  }
  function buildNoiseSource(ctx2, src, t, duration) {
    const color = src.color ?? "white";
    const buffer = createNoiseBuffer(ctx2, color, duration + 0.1);
    const node = ctx2.createBufferSource();
    node.buffer = buffer;
    node.start(t);
    node.stop(t + duration + 0.1);
    return {
      node,
      scheduled: node
    };
  }
  function buildWavetableSource(ctx2, src, t, duration) {
    const real = new Float32Array(src.harmonics.length + 1);
    const imag = new Float32Array(src.harmonics.length + 1);
    real[0] = 0;
    imag[0] = 0;
    for (let i = 0; i < src.harmonics.length; i++) {
      real[i + 1] = 0;
      imag[i + 1] = src.harmonics[i];
    }
    const wave = ctx2.createPeriodicWave(real, imag, {
      disableNormalization: false
    });
    const osc = ctx2.createOscillator();
    osc.setPeriodicWave(wave);
    if (typeof src.frequency === "number") {
      osc.frequency.setValueAtTime(src.frequency, t);
    } else {
      osc.frequency.setValueAtTime(src.frequency.start, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(src.frequency.end, 1), t + duration);
    }
    osc.start(t);
    osc.stop(t + duration + 0.1);
    return {
      node: osc,
      scheduled: osc,
      frequencyParam: osc.frequency,
      detuneParam: osc.detune
    };
  }
  function buildSampleSource(ctx2, src, t) {
    const node = ctx2.createBufferSource();
    if (src.playbackRate !== void 0) {
      node.playbackRate.value = src.playbackRate;
    }
    if (src.detune !== void 0) {
      node.detune.value = src.detune;
    }
    if (src.loop) {
      node.loop = true;
      if (src.loopStart !== void 0) node.loopStart = src.loopStart;
      if (src.loopEnd !== void 0) node.loopEnd = src.loopEnd;
    }
    if (src.buffer) {
      node.buffer = src.buffer;
      node.start(t);
    } else if (src.url) {
      loadSample(ctx2, src.url).then((buf) => {
        node.buffer = buf;
        node.start(Math.max(t, ctx2.currentTime));
      });
    }
    return {
      node,
      scheduled: node,
      detuneParam: node.detune,
      playbackRateParam: node.playbackRate
    };
  }
  function buildStreamSource(ctx2, src) {
    const node = ctx2.createMediaStreamSource(src.stream);
    return {
      node
    };
  }
  function buildConstantSource(ctx2, src, t, duration) {
    const node = ctx2.createConstantSource();
    node.offset.value = src.offset ?? 1;
    node.start(t);
    node.stop(t + duration + 0.1);
    return {
      node,
      scheduled: node
    };
  }
  function buildSource(ctx2, src, t, duration) {
    switch (src.type) {
      case "sine":
      case "triangle":
      case "square":
      case "sawtooth":
        return buildOscillatorSource(ctx2, src, t, duration);
      case "noise":
        return buildNoiseSource(ctx2, src, t, duration);
      case "wavetable":
        return buildWavetableSource(ctx2, src, t, duration);
      case "sample":
        return buildSampleSource(ctx2, src, t);
      case "stream":
        return buildStreamSource(ctx2, src);
      case "constant":
        return buildConstantSource(ctx2, src, t, duration);
    }
  }
  function buildBiquadFilter(ctx2, filter, t) {
    const node = ctx2.createBiquadFilter();
    node.type = filter.type;
    node.frequency.setValueAtTime(filter.frequency, t);
    node.Q.value = filter.resonance ?? 1;
    if (filter.gain !== void 0) {
      node.gain.value = filter.gain;
    }
    if (filter.envelope) {
      const env = filter.envelope;
      const attackEnd = t + (env.attack ?? 0);
      node.frequency.setValueAtTime(filter.frequency, t);
      node.frequency.linearRampToValueAtTime(env.peak, attackEnd);
      node.frequency.exponentialRampToValueAtTime(Math.max(filter.frequency, 1), attackEnd + env.decay);
    }
    return {
      node,
      frequencyParam: node.frequency
    };
  }
  function buildIIRFilter(ctx2, filter) {
    const node = ctx2.createIIRFilter(filter.feedforward, filter.feedback);
    return {
      node
    };
  }
  function buildSingleFilter(ctx2, filter, t) {
    if (filter.type === "iir") {
      const { node: node2 } = buildIIRFilter(ctx2, filter);
      return {
        node: node2
      };
    }
    const { node, frequencyParam } = buildBiquadFilter(ctx2, filter, t);
    return {
      node,
      frequencyParam,
      detuneParam: node.detune,
      QParam: node.Q,
      gainParam: node.gain
    };
  }
  function buildFilters(ctx2, filters, t) {
    const arr = Array.isArray(filters) ? filters : [
      filters
    ];
    return arr.map((f) => buildSingleFilter(ctx2, f, t));
  }
  function buildEnvelope(ctx2, envelope, gain, t) {
    const node = ctx2.createGain();
    if (!envelope) {
      node.gain.setValueAtTime(gain, t);
      node.gain.setTargetAtTime(SILENCE, t, 0.15);
      return {
        node,
        duration: 0.5
      };
    }
    const attack = envelope.attack ?? 0;
    const decay = envelope.decay;
    const sustain = envelope.sustain ?? 0;
    const release = envelope.release ?? 0;
    const sustainLevel = Math.max(sustain * gain, SILENCE);
    const decayTC = decay / 3;
    node.gain.setValueAtTime(SILENCE, t);
    if (attack > 0) {
      node.gain.linearRampToValueAtTime(gain, t + attack);
    } else {
      node.gain.setValueAtTime(gain, t);
    }
    if (sustain > 0) {
      node.gain.setTargetAtTime(sustainLevel, t + attack, decayTC);
      if (release > 0) {
        const releaseTC = release / 3;
        node.gain.setTargetAtTime(SILENCE, t + attack + decay, releaseTC);
      }
    } else {
      node.gain.setTargetAtTime(SILENCE, t + attack, decayTC);
    }
    return {
      node,
      duration: attack + decay + release
    };
  }
  function buildLFO(ctx2, lfo, t, duration, targets) {
    const osc = ctx2.createOscillator();
    osc.type = lfo.type;
    osc.frequency.value = lfo.frequency;
    const gain = ctx2.createGain();
    gain.gain.value = lfo.depth;
    osc.connect(gain);
    let target = null;
    switch (lfo.target) {
      case "frequency":
        target = targets.source.frequencyParam ?? null;
        break;
      case "detune":
        target = targets.source.detuneParam ?? null;
        break;
      case "gain":
        target = targets.envNode.gain;
        break;
      case "pan":
        target = targets.panner?.pan ?? null;
        break;
      case "playbackRate":
        target = targets.source.playbackRateParam ?? null;
        break;
      case "filter.frequency":
        target = targets.filters[0]?.frequencyParam ?? null;
        break;
      case "filter.detune":
        target = targets.filters[0]?.detuneParam ?? null;
        break;
      case "filter.Q":
        target = targets.filters[0]?.QParam ?? null;
        break;
      case "filter.gain":
        target = targets.filters[0]?.gainParam ?? null;
        break;
    }
    if (target) {
      gain.connect(target);
      osc.start(t);
      osc.stop(t + duration + 0.1);
      return osc;
    }
    return null;
  }
  function buildPanner3D(ctx2, config) {
    const panner = ctx2.createPanner();
    panner.panningModel = config.panningModel ?? "HRTF";
    panner.distanceModel = config.distanceModel ?? "inverse";
    panner.positionX.value = config.positionX;
    panner.positionY.value = config.positionY;
    panner.positionZ.value = config.positionZ;
    if (config.orientationX !== void 0) panner.orientationX.value = config.orientationX;
    if (config.orientationY !== void 0) panner.orientationY.value = config.orientationY;
    if (config.orientationZ !== void 0) panner.orientationZ.value = config.orientationZ;
    if (config.maxDistance !== void 0) panner.maxDistance = config.maxDistance;
    if (config.refDistance !== void 0) panner.refDistance = config.refDistance;
    if (config.rolloffFactor !== void 0) panner.rolloffFactor = config.rolloffFactor;
    if (config.coneInnerAngle !== void 0) panner.coneInnerAngle = config.coneInnerAngle;
    if (config.coneOuterAngle !== void 0) panner.coneOuterAngle = config.coneOuterAngle;
    if (config.coneOuterGain !== void 0) panner.coneOuterGain = config.coneOuterGain;
    return panner;
  }
  function buildEffectsChain(ctx2, effects, destination) {
    if (effects.length === 0) {
      return {
        input: destination,
        output: destination,
        dispose() {
        }
      };
    }
    const nodes = effects.map((e) => createEffect(ctx2, e));
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].output.connect(nodes[i + 1].input);
    }
    nodes[nodes.length - 1].output.connect(destination);
    return {
      input: nodes[0].input,
      output: nodes[nodes.length - 1].output,
      dispose() {
        for (const n of nodes) n.dispose?.();
      }
    };
  }
  function render(ctx2, definition, opts, baseTime, destination) {
    const { layers, effects } = normalize(definition);
    const dest = destination ?? ctx2.destination;
    const chain = buildEffectsChain(ctx2, effects ?? [], dest);
    const t0 = baseTime ?? ctx2.currentTime;
    const velocity = opts?.velocity ?? 1;
    const allDisposers = [
      chain.dispose
    ];
    const allSourceNodes = [];
    const allEnvNodes = [];
    for (const layer of layers) {
      const layerStart = t0 + (layer.delay ?? 0);
      const baseGain = (layer.gain ?? 0.5) * (opts?.volume ?? 1) * velocity;
      const { node: envNode, duration: envDuration } = buildEnvelope(ctx2, layer.envelope, baseGain, layerStart);
      allEnvNodes.push(envNode);
      const sourceResult = buildSource(ctx2, layer.source, layerStart, envDuration);
      if (opts?.detune && sourceResult.detuneParam) {
        sourceResult.detuneParam.value += opts.detune;
      }
      if (opts?.playbackRate && sourceResult.playbackRateParam) {
        sourceResult.playbackRateParam.value *= opts.playbackRate;
      }
      let tail = sourceResult.node;
      const filterResults = [];
      if (layer.filter) {
        const builtFilters = buildFilters(ctx2, layer.filter, layerStart);
        for (const f of builtFilters) {
          tail.connect(f.node);
          tail = f.node;
          filterResults.push(f);
          if (velocity < 1 && f.frequencyParam) {
            const baseFreq = f.frequencyParam.value;
            f.frequencyParam.setValueAtTime(baseFreq * (0.5 + 0.5 * velocity), layerStart);
          }
        }
      }
      tail.connect(envNode);
      let cursor = envNode;
      const layerDisposers = [];
      if (layer.effects && layer.effects.length > 0) {
        const layerFxNodes = layer.effects.map((e) => createEffect(ctx2, e));
        for (let i = 0; i < layerFxNodes.length - 1; i++) {
          layerFxNodes[i].output.connect(layerFxNodes[i + 1].input);
        }
        cursor.connect(layerFxNodes[0].input);
        cursor = layerFxNodes[layerFxNodes.length - 1].output;
        for (const n of layerFxNodes) {
          if (n.dispose) layerDisposers.push(n.dispose);
        }
      }
      let stereoPanner;
      const effectivePan = opts?.pan ?? layer.pan;
      if (layer.panner) {
        const panner3d = buildPanner3D(ctx2, layer.panner);
        cursor.connect(panner3d);
        cursor = panner3d;
      } else if (effectivePan !== void 0 && effectivePan !== 0) {
        stereoPanner = ctx2.createStereoPanner();
        stereoPanner.pan.value = effectivePan;
        cursor.connect(stereoPanner);
        cursor = stereoPanner;
      }
      cursor.connect(chain.input);
      if (layer.lfo) {
        const lfos = Array.isArray(layer.lfo) ? layer.lfo : [
          layer.lfo
        ];
        for (const l of lfos) {
          buildLFO(ctx2, l, layerStart, envDuration, {
            source: sourceResult,
            filters: filterResults,
            envNode,
            panner: stereoPanner
          });
        }
      }
      if (sourceResult.scheduled) {
        allSourceNodes.push(sourceResult.scheduled);
        const nodesToDisconnect = [
          sourceResult.node,
          envNode,
          ...filterResults.map((f) => f.node),
          ...stereoPanner ? [
            stereoPanner
          ] : []
        ];
        sourceResult.scheduled.onended = () => {
          for (const n of nodesToDisconnect) {
            try {
              n.disconnect();
            } catch (_) {
            }
          }
          for (const d of layerDisposers) d();
        };
      }
      allDisposers.push(...layerDisposers);
    }
    return {
      stop(releaseTime) {
        const now = ctx2.currentTime;
        const fade = releaseTime ?? 0.015;
        for (const env of allEnvNodes) {
          env.gain.cancelScheduledValues(now);
          env.gain.setValueAtTime(env.gain.value, now);
          env.gain.setTargetAtTime(SILENCE, now, fade / 3);
        }
        for (const src of allSourceNodes) {
          try {
            src.stop(now + fade + 0.05);
          } catch (_) {
          }
        }
      }
    };
  }
  function defineSound(definition) {
    return (opts) => {
      const ctx2 = getContext();
      return render(ctx2, definition, opts, void 0, getDestination());
    };
  }
  var ctx, masterGain, storedOptions, irCache, SILENCE, sampleCache;
  var init_dist = __esm({
    "node_modules/@web-kits/audio/dist/index.js"() {
      ctx = null;
      masterGain = null;
      storedOptions = {};
      irCache = /* @__PURE__ */ new Map();
      SILENCE = 1e-4;
      sampleCache = /* @__PURE__ */ new Map();
    }
  });

  // .web-kits/minimal.ts
  var tap, click, keyPress, toggleOn, toggleOff, checkbox, select, deselect, hover, tabSwitch, expand, collapse, pageEnter, pageExit, success, error, warning, notification, info, copy, send, _delete, undo, pop, swoosh, slide, _patch;
  var init_minimal = __esm({
    ".web-kits/minimal.ts"() {
      tap = { "source": { "type": "sine", "frequency": 1200 }, "envelope": { "attack": 0, "decay": 0.012, "sustain": 0, "release": 4e-3 }, "gain": 0.08 };
      click = { "source": { "type": "sine", "frequency": 800 }, "envelope": { "attack": 0, "decay": 0.015, "sustain": 0, "release": 5e-3 }, "gain": 0.1 };
      keyPress = { "source": { "type": "sine", "frequency": 1100 }, "envelope": { "attack": 0, "decay": 0.01, "sustain": 0, "release": 3e-3 }, "gain": 0.06 };
      toggleOn = { "layers": [{ "source": { "type": "sine", "frequency": 880 }, "envelope": { "attack": 0, "decay": 0.02, "sustain": 0, "release": 6e-3 }, "gain": 0.08 }, { "source": { "type": "sine", "frequency": 1320 }, "envelope": { "attack": 0, "decay": 0.02, "sustain": 0, "release": 6e-3 }, "delay": 0.03, "gain": 0.07 }] };
      toggleOff = { "layers": [{ "source": { "type": "sine", "frequency": 1320 }, "envelope": { "attack": 0, "decay": 0.02, "sustain": 0, "release": 6e-3 }, "gain": 0.08 }, { "source": { "type": "sine", "frequency": 880 }, "envelope": { "attack": 0, "decay": 0.02, "sustain": 0, "release": 6e-3 }, "delay": 0.03, "gain": 0.07 }] };
      checkbox = { "source": { "type": "sine", "frequency": 1e3 }, "envelope": { "attack": 0, "decay": 0.018, "sustain": 0, "release": 5e-3 }, "gain": 0.09 };
      select = { "source": { "type": "sine", "frequency": 1100 }, "envelope": { "attack": 0, "decay": 0.02, "sustain": 0, "release": 6e-3 }, "gain": 0.08 };
      deselect = { "source": { "type": "sine", "frequency": 900 }, "envelope": { "attack": 0, "decay": 0.018, "sustain": 0, "release": 5e-3 }, "gain": 0.06 };
      hover = { "source": { "type": "sine", "frequency": 1300 }, "envelope": { "attack": 0, "decay": 0.01, "sustain": 0, "release": 4e-3 }, "gain": 0.04 };
      tabSwitch = { "source": { "type": "sine", "frequency": 1050 }, "envelope": { "attack": 0, "decay": 0.015, "sustain": 0, "release": 5e-3 }, "gain": 0.07 };
      expand = { "source": { "type": "sine", "frequency": { "start": 800, "end": 1e3 } }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.012 }, "gain": 0.06 };
      collapse = { "source": { "type": "sine", "frequency": { "start": 1e3, "end": 800 } }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.012 }, "gain": 0.06 };
      pageEnter = { "source": { "type": "sine", "frequency": { "start": 700, "end": 900 } }, "envelope": { "attack": 3e-3, "decay": 0.04, "sustain": 0, "release": 0.015 }, "gain": 0.05 };
      pageExit = { "source": { "type": "sine", "frequency": { "start": 900, "end": 700 } }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.015 }, "gain": 0.04 };
      success = { "layers": [{ "source": { "type": "sine", "frequency": 523 }, "envelope": { "attack": 0, "decay": 0.05, "sustain": 0, "release": 0.015 }, "gain": 0.1 }, { "source": { "type": "sine", "frequency": 784 }, "envelope": { "attack": 0, "decay": 0.05, "sustain": 0, "release": 0.015 }, "delay": 0.06, "gain": 0.08 }] };
      error = { "layers": [{ "source": { "type": "sine", "frequency": 300 }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.012 }, "gain": 0.12 }, { "source": { "type": "sine", "frequency": 280 }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.012 }, "delay": 0.01, "gain": 0.1 }] };
      warning = { "layers": [{ "source": { "type": "sine", "frequency": 440 }, "envelope": { "attack": 0, "decay": 0.03, "sustain": 0, "release": 0.01 }, "gain": 0.1 }, { "source": { "type": "sine", "frequency": 466 }, "envelope": { "attack": 0, "decay": 0.03, "sustain": 0, "release": 0.01 }, "delay": 8e-3, "gain": 0.08 }] };
      notification = { "layers": [{ "source": { "type": "sine", "frequency": 660 }, "envelope": { "attack": 0, "decay": 0.05, "sustain": 0, "release": 0.02 }, "gain": 0.1 }, { "source": { "type": "sine", "frequency": 880 }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.015 }, "delay": 0.08, "gain": 0.08 }] };
      info = { "source": { "type": "sine", "frequency": 880 }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.015 }, "gain": 0.08 };
      copy = { "layers": [{ "source": { "type": "sine", "frequency": 1e3 }, "envelope": { "attack": 0, "decay": 0.012, "sustain": 0, "release": 4e-3 }, "gain": 0.08 }, { "source": { "type": "sine", "frequency": 1200 }, "envelope": { "attack": 0, "decay": 0.012, "sustain": 0, "release": 4e-3 }, "delay": 0.035, "gain": 0.07 }] };
      send = { "source": { "type": "sine", "frequency": { "start": 600, "end": 1e3 } }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.012 }, "gain": 0.08 };
      _delete = { "source": { "type": "sine", "frequency": { "start": 500, "end": 250 } }, "envelope": { "attack": 0, "decay": 0.05, "sustain": 0, "release": 0.015 }, "gain": 0.1 };
      undo = { "source": { "type": "sine", "frequency": { "start": 800, "end": 600 } }, "envelope": { "attack": 0, "decay": 0.035, "sustain": 0, "release": 0.01 }, "gain": 0.07 };
      pop = { "source": { "type": "sine", "frequency": { "start": 400, "end": 200 } }, "envelope": { "attack": 0, "decay": 0.04, "sustain": 0, "release": 0.012 }, "gain": 0.1 };
      swoosh = { "source": { "type": "sine", "frequency": { "start": 600, "end": 1400 } }, "envelope": { "attack": 5e-3, "decay": 0.04, "sustain": 0, "release": 0.015 }, "gain": 0.05 };
      slide = { "source": { "type": "sine", "frequency": { "start": 800, "end": 1100 } }, "envelope": { "attack": 3e-3, "decay": 0.035, "sustain": 0, "release": 0.012 }, "gain": 0.05 };
      _patch = {
        ...{ "name": "Minimal", "author": "Raphael Salaja", "version": "1.0.0", "description": "An ultra-clean sine-based palette for quiet, transparent UI feedback, made for products that prioritize subtlety, restraint, and smooth interaction cues over expressive flourish." },
        sounds: { tap, click, "key-press": keyPress, "toggle-on": toggleOn, "toggle-off": toggleOff, checkbox, select, deselect, hover, "tab-switch": tabSwitch, expand, collapse, "page-enter": pageEnter, "page-exit": pageExit, success, error, warning, notification, info, copy, send, "delete": _delete, undo, pop, swoosh, slide }
      };
    }
  });

  // prototype_audio_entry.js
  var require_prototype_audio_entry = __commonJS({
    "prototype_audio_entry.js"() {
      init_dist();
      init_minimal();
      var UI_SOUND_VOL = 0.6;
      var playTap = defineSound(tap);
      var playTabSwitch = defineSound(tabSwitch);
      var playSelect = defineSound(select);
      function safe(fn) {
        try {
          fn();
        } catch (_e) {
        }
      }
      function shouldPlayForTarget(t) {
        if (!t || !t.closest) return false;
        return !!t.closest(
          "button, .sw, .seg-btn, .hl-item, .gi, .brc, .cp, .tab, .camb, .gi-act, .bbl, .mf-inline, .brd-back, .hl-sht-x, .ctx-menu"
        );
      }
      function onPointerDown(e) {
        if (!shouldPlayForTarget(e.target)) return;
        var el = e.target;
        var v = { volume: UI_SOUND_VOL };
        if (el.closest(".sw") || el.closest(".tab")) safe(function() {
          playTabSwitch(v);
        });
        else if (el.closest(".seg-btn")) safe(function() {
          playSelect(v);
        });
        else safe(function() {
          playTap(v);
        });
      }
      function init() {
        document.addEventListener("pointerdown", onPointerDown, true);
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    }
  });
  require_prototype_audio_entry();
})();
