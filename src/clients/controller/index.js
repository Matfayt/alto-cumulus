import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';


import '../components/sw-audit.js';
import '../components/sw-player.js';

import '@ircam/sc-components'

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  /**
   * Load configuration from config files and create the soundworks client
   */
  const config = loadConfig();
  const client = new Client(config);


  await client.start();

  const global = await client.stateManager.attach('global');
  const players = await client.stateManager.getCollection('player');

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <p>Hello ${client.config.app.name}!</p>
          <h2>Global</h2> 
            <div style="padding-bottom: 4px"> 
              <sc-text>master</sc-text> 
              <sc-slider 
                min=${global.getSchema('master').min} 
                max=${global.getSchema('master').max} 
                value=${global.get('master')} 
                @input=${e => global.set({ master: e.detail.value })} 
              ></sc-slider> 
            </div> 
            <div style="padding-bottom: 4px"> 
              <sc-text>mute</sc-text> 
              <sc-toggle 
                ?active=${global.get('mute')} 
                @change=${e => global.set({ mute: e.detail.value })} 
              ></sc-toggle> 
            </div>
            <div>
              ${players.map(player => {
                return html`<sw-player .player=${player}></sw-player>`
              })}
            </div>
        </section>
      </div>
    `, $container);
  }

  global.onUpdate(() => renderApp(), true);
  players.onUpdate(() => renderApp(), true);
  players.onAttach(() => renderApp(), true);
  players.onDetach(() => renderApp(), true);
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
