const path = require('path');
const express = require('express');
const clientFolder = path.resolve('./client');

class Server {
	constructor({ port }) {
		this.port = port;
	}

	init() {
		this.app = express();
		this.app.use(express.static(clientFolder));
	}

	start() {
		const { port } = this;
		this.server = this.app.listen(port, () => {
			console.log(`Server listening on port: ${port}`);
		});
		return this.app;
	}

	stop() {
		this.server.close();
	}
}

module.exports = Server;
