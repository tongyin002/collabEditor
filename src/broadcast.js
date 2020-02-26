class BroadCast {
  constructor() {
    this.connections = [];
    this.peer = null;
    this.controller = null;
  }

  // request connection to another peer
  requestConnection(targetPeerId) {}

  // listen connections from others
  listenConnections() {}

  // send message to all connections (broadcast)
  send(operation) {}
}

export default BroadCast;
