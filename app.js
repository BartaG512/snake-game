const Server = require('./lib/server');
const server = new Server({ port: 3001 });
server.init();
server.start();
