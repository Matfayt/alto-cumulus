import '@soundworks/helpers/polyfills.js';
import { Server } from '@soundworks/core/server.js';
import { loadConfig } from '@soundworks/helpers/node.js';

import pluginPlatformInit from '@soundworks/plugin-platform-init/server.js';

import '../utils/catch-unhandled-errors.js';

import globalSchema from './schemas/global.js';
import playerSchema from './schemas/player.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = loadConfig(process.env.ENV, import.meta.url);

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

/**
 * Create the soundworks server
 */
const server = new Server(config);
// configure the server for usage within this application template
server.useDefaultApplicationTemplate();

server.pluginManager.register('platform-init', pluginPlatformInit);

/**
 * Register plugins and schemas
 */
server.stateManager.registerSchema('global', globalSchema);
server.stateManager.registerSchema('player', playerSchema);
// server.pluginManager.register('my-plugin', plugin);
// server.stateManager.registerSchema('my-schema', definition);

/**
 * Launch application (init plugins, http server, etc.)
 */
await server.start();

const global = await server.stateManager.create('global');
console.log(global.getValues());

// and do your own stuff!

