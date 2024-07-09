import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import pluginPlatformInit from '@soundworks/plugin-platform-init/client.js'; 

import '../components/sw-credits.js';

import '../components/sw-player.js';

import player from '../../server/schemas/player.js';

// import { AudioContext, GainNode, OscillatorNode } from 'node-web-audio-api';
import { Scheduler } from '@ircam/sc-scheduling'; 
import { AudioBufferLoader } from '@ircam/sc-loader';

import loadAudioBuffer from './load-audio-buffer.js';

import GranularSynth from './GranularSynth.js';
import FeedbackDelay from './FeedbackDelay.js';


// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * If multiple clients are emulated you might to want to share some resources
 */

const audioContext = new AudioContext();
const config = window.SOUNDWORKS_CONFIG;
const client = new Client(config);
//resume audiocontext with user gesture
client.pluginManager.register('platform-init', pluginPlatformInit, {  
  audioContext  
}); 

async function main($container) {
  /**
   * Load configuration from config files and create the soundworks client
   */

  /**
   * Register some soundworks plugins, you will need to install the plugins
   * before hand (run `npx soundworks` for help)
   */
  // client.pluginManager.register('my-plugin', plugin);

  /**
   * Register the soundworks client into the launcher
   *
   * The launcher will do a bunch of stuff for you:
   * - Display default initialization screens. If you want to change the provided
   * initialization screens, you can import all the helpers directly in your
   * application by doing `npx soundworks --eject-helpers`. You can also
   * customise some global syles variables (background-color, text color etc.)
   * in `src/clients/components/css/app.scss`.
   * You can also change the default language of the intialization screen by
   * setting, the `launcher.language` property, e.g.:
   * `launcher.language = 'fr'`
   * - By default the launcher automatically reloads the client when the socket
   * closes or when the page is hidden. Such behavior can be quite important in
   * performance situation where you don't want some phone getting stuck making
   * noise without having any way left to stop it... Also be aware that a page
   * in a background tab will have all its timers (setTimeout, etc.) put in very
   * low priority, messing any scheduled events.
   */
  launcher.register(client, { initScreensContainer: $container });

  /**
   * Launch application
   */
  await client.start();

  const global = await client.stateManager.attach('global');
  const player = await client.stateManager.create('player', {
    id: client.id,
  });

  //TODO record

  if (navigator.mediaDevices.getUserMedia) {
    console.log('mediaDevices Compatible');
    const constraints = { audio: true };
    let chunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ // <1>
      video: false,
      audio: true,
    })

    var recState = false;
    console.log('Stream is : ', stream);
    var mediaRecorder = new MediaRecorder(stream);
    console.log('mediarecorder created : ', mediaRecorder);

  } else {
    console.log('media device not compatible');
  }

  function rec() {
    mediaRecorder.start();
    console.log(mediaRecorder.state);
    recState = true;
  };

  function stopRec() {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    recState = false;
  };

  //from master to ...
  const master = audioContext.createGain(); 
  master.gain.value = global.get('master');

  //output
  master.connect(audioContext.destination) // for simple output

  //from volume to ...
  const volume = audioContext.createGain();
  volume.gain.value = player.get('volume');
  volume.connect(master);
  
  //from delay to ...
  const delay = new FeedbackDelay(audioContext, {});
  delay.output.connect(volume);

  //from mute to ...
  const mute = audioContext.createGain(); 
  mute.gain.value = global.get('mute') ? 0 : 1; 
  // mute.connect(reverb);
  mute.connect(delay.input);

  // const soundFiles = [
  //   '/public/assets/river.wav',
  //   '/public/assets/burn.wav',
  //   '/public/assets/clang.wav',
  // ];

  // Load the actual buffers
  const loaderAudio = new AudioBufferLoader(audioContext.sampleRate); //evryone at 48000
  // const loaderAudio = new AudioBufferLoader({serverAdress : '127.0.0.1'}); //evryone at 48000
  // const soundBuffer = await loaderAudio.load(soundFiles);

  // const loaderAudio = new loadAudioBuffer(audioContext.sampleRate); //evryone at 48000
  // const soundBuffer = await loadAudioBuffer('./assets/river.wav');
  const soundBuffer = [0, 1, 0];


  // Name to index for easy manipulation with interface (player.get(string))
  const sounds = {
    'river' : soundBuffer[0],
    'burn' : soundBuffer[1],
    'clang' : soundBuffer[2],
  };

  // create a new scheduler, in the audioContext timeline
  const scheduler = new Scheduler(() => audioContext.currentTime);
  // create our granular synth and connect it to audio destination
  const granular = new GranularSynth(audioContext, soundBuffer);
  // Set a default value so it can read one at init 
  //granular.soundBuffer = soundBuffer[0]; 
  granular.soundBuffer = soundBuffer; 
  // Connect it to mute (output) 
  granular.output.connect(mute);
  // granular.energy = energy;

  // Envelopes
  const envelopeFiles = [
    'assets/env/env.gauss.wav',
    'assets/env/env.hanning.wav',
    'assets/env/env.tri.wav',
    'assets/env/env.trapez.short.wav',
    'assets/env/env.trapez.long.wav',
    'assets/env/env.blackman.wav',
    'assets/env/env.expdec.wav',
    'assets/env/env.expmod.wav',
  ];

  // const loader = new AudioBufferLoader({ sampleRate: 48000 }); //same sample rate for everyone
  const envBuffers = await loaderAudio.load(envelopeFiles);
  // const envBuffers = [0, 1, 0];

  granular.envBuffer = envBuffers;
  //Translate to Float32 and manage memory allocation
  const envChannels = envBuffers.map(buffer => {
    const env = new Float32Array(buffer.length);
    buffer.copyFromChannel(env, 0);
    return env;
  });

  //Custom sine envelope
  const waveArraySize = 1000;
  const waveArray = new Float32Array(waveArraySize);
  const phaseIncr = Math.PI / (waveArraySize - 1);
  let phase = 0;
  for (let i = 0; i < waveArraySize; i++) {
    const value = Math.sin(phase);
    waveArray[i] = value;
    phase +=  phaseIncr;
  }

  const envelops = {
    'Gauss': envChannels[0],
    'Hanning': envChannels[1],
    'Tri': envChannels[2],
    'TrapS': envChannels[3],
    'TrapL': envChannels[4],
    'Blackman': envChannels[5],
    'Expdec': envChannels[6],
    'Expmod': envChannels[7],
    'Sine': waveArray,
  };

  // Vicentino microtones in cents
  const vicentino = ["0", "76", "117", "193", "269", "310", "386", "462", "503", "620", "696", "772", "813", "889", "965", "1006", "1082", "1158"];
  // Randomly select a cent value from the list
  function chooseNote() {
    return vicentino[Math.floor(Math.random() * vicentino.length)];
  }


  function renderApp() {
    render(html`
      <div class="simple-layout">
        <h2>Global</h2> 
        <p>Master: ${global.get('master')}</p> 
        <p>Mute: ${global.get('mute')}</p> 
        <sw-player .player=${player}></sw-player>
        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);
  }``

  // react to updates triggered from controller 
  player.onUpdate(updates => {
    for (let key in updates) {
      const value = updates[key];
      
      switch (key) {
        case 'startSynth': {
          if (value === true) {
            // register the synth into the scheduler and start it now
            scheduler.add(granular.render, audioContext.currentTime);
            //get and change period and duration 
            granular.period = player.get('period');
            granular.duration = player.get('duration');
            granular.frequency = player.get('oscFreq');
          } else if (value !== null) {
            //stop the synth
            scheduler.remove(granular.render, audioContext.currentTime);
          }
          break;
        }
        //update values if modifed during synth started
        case 'volume': {
          if (GranularSynth !== null) {
            const now = audioContext.currentTime;  
            volume.gain.setTargetAtTime(value, now, 0.02);
          }
          break;
        }
        case 'period': {
          if (GranularSynth !== null) {
            granular.period = player.get('period'); 
          }
          break;
        }
        case 'duration': {
          if (GranularSynth !== null) {
            granular.duration = player.get('duration');
          }
          break;
        }
        case 'startPosition': {
          if (GranularSynth !== null) {
            granular.positionFactor = player.get('startPosition');
          }
          break;
        }
        case 'positionJitter': {
          if (GranularSynth !== null) {
            granular.positionJitter = player.get('positionJitter');
          }
          break;
          }
        case 'playbackRate': {
          if (GranularSynth !== null) {
            granular.playback = player.get('playbackRate');
          }
          break;
          }
        case 'periodJitter': {
          if (GranularSynth !== null) {
            granular.periodJittFactor = player.get('periodJitter');
          }
          break;
        }
        case 'oscFreq': {
          if (GranularSynth !== null) {
            granular.frequency = player.get('oscFreq');
          }
          break;
        }
        case 'distoAmount': {
          if (GranularSynth !== null) {
            granular.distortionAmount = player.get('distoAmount');
          }
          break;
        }
        case 'changeCent': {
          if (GranularSynth !== null) {
            granular.detune = chooseNote();
          }
          break;
        }
        case 'oscType': {
          granular.type = player.get('oscType');
          break;
        }
        case 'soundFile': {
          const file = player.get('soundFile');
          granular.soundBuffer = sounds[file];
          break;
        }
        case 'envelopeType': {
          const type = player.get('envelopeType');
          granular.envBuffer = envelops[type];
          break;
        }
        case 'granularType': {
          granular.engineType = player.get('granularType');
          break;
        }
        case 'isRecording': {
          if (recState){
            stopRec();
          } else {
            rec();
          }
          break;
        }
        case 'preGain': {   
          const now = audioContext.currentTime;  
          delay.preGain.gain.setTargetAtTime(value, now, 0.02);  
          break;  
        }  
        case 'feedback': {   
          const now = audioContext.currentTime;  
          delay.feedback.gain.setTargetAtTime(value, now, 0.02); 
          break;  
        }  
        case 'delayTime': {   
          const now = audioContext.currentTime;  
          delay.setDelayTime(value, now, 0.02);
          break;  
        }
      } 
    }
  });

  global.onUpdate(updates => {  
  for (let key in updates) {  
    const value = updates[key];  
  
    switch (key) {  
      case 'master': {  
        const now = audioContext.currentTime;  
        master.gain.setTargetAtTime(value, now, 0.02);  
        break;  
      }  
      case 'mute': {  
        const gain = value ? 0 : 1;  
        const now = audioContext.currentTime;  
        mute.gain.setTargetAtTime(gain, now, 0.02);  
        break;  
      }  
    }  
  }  
  // update the view to log current global values  
  renderApp();  
}, true);  
}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});