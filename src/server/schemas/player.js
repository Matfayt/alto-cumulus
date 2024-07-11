export default { 
  id: { 
    type: 'integer', 
    default: null, 
    nullable: true, 
  }, 
  frequency: { 
    type: 'float', 
    default: 200, 
    min: 50, 
    max: 2000, 
  }, 
  synthToggle: { 
    type: 'boolean', 
    default: false, 
    immediate: true, 
  }, 
  synthTrigger: { 
    type: 'boolean', 
    event: true, 
    immediate: true, 
  }, 
  startSynth: {
    type: 'boolean',
    default: false,
  },
  volume: {
    type: 'float', 
      default: 1, 
      min: 0, 
      max: 2, 
    }, 
  period: {
    type: 'float',
    default: 0.1,
    min: 0.005,
    max: 0.9,
  },
  periodJitter: {
    type: 'float',
    default: 0.002,
    min: 0.002,
    max: 1,
  },
  triggerFreq: {
    type: 'float',
    default: 10,
    min: 0.005,
    max: 10000,
  },
  duration: {
    type: 'float',
    default: 0.1,
    min: 0.01,
    max: 0.5,
  },
  startPosition: {
    type: 'float',
    default: 0.0,
    min: 0.0,
    max: 1.0,
  },
  positionJitter: {
    type: 'float',
    default: 0.0,
    min: 0.0,
    max: 1.0,
  },
  playbackRate: {
    type: 'float',
    default: 1.0,
    min: 0.0,
    max: 10.0,
  },
  oscFreq: {
    type: 'integer',
    default: 200,
    min: 1,
    max: 15000,
  },
  distoAmount: {
    type: 'float',
    default: 1,
    min: 0,
    max: 400,
  },
  changeCent: {
    type: 'boolean',
    default: false,
    event: true,
  },
  oscType: {
    type: 'string',
    default: 'sine',
  },
  hostname: {
    type: 'string',
    default: null,
    nullable: true,
  },

  position: {
    type: 'any',
    default: null,
    nullable: true,
  },

  audioOutputType: {
    type: 'any',
    default: null,
    nullable: true,
  },

  envelopeType: {
    type: 'any',
    default: 'Gauss',
    nullable: true,
  },
  granularType: {
    type: 'string',
    default: 'oscillator', 
  },
  soundFile: {
    type: 'string',
    default: 'river',
    nullable: true, 
  },

  isRecording: {
    type: 'boolean',
    default: false,
  },

  preGain: {
      type: 'float', 
      default: 0, 
      min: 0, 
      max: 1, 
  },
  feedback: {
    type: 'float', 
    default: 0, 
    min: 0, 
    max: 1, 
  },
  delayTime: {
    type: 'float', 
    default: 0, 
    min: 0, 
    max: 1, 
  },
}; 