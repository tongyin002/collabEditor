class BroadCast {
  constructor(controller, peer) {
    this.connections = [];
    this.peer = peer;
    this.controller = controller;
    this.directConns = []; // connect to others
    this.allConns = []; // others come in
    this.outgoingBuffer = [];
    this.MAX_BUFFER_SIZE = 40;
    this.currentStream = null;
  }

  bindServerEvents(targetPeerId) {
    this.onOpen(targetPeerId);
  }

  onOpen(targetPeerId) {
    this.peer.on("open", id => {
      this.onConnection();

      if (id !== "0") {
        this.requestConnection(targetPeerId, id, this.controller.siteId);
      }
    });
  }

  onConnection() {
    this.peer.on("connection", connection => {
      this.onData(connection);
      this.onConnClose(connection);
    });
  }

  // receive message from all connections (broadcast)
  onData(connection) {
    connection.on("data", data => {
      const dataObj = JSON.parse(data);

      switch (dataObj.type) {
        case "connRequest":
          this.acceptConnRequest(dataObj.peerId, dataObj.siteId);
          break;
        case "syncResponse":
          //this.processOutgoingBuffer(dataObj.peerId);
          this.controller.populateCRDT(dataObj);
          break;
        // case "syncCompleted":
        //   this.processOutgoingBuffer(dataObj.peerId);
        //   break;
        // case "add to network":
        //   this.controller.addToNetwork(dataObj.newPeer, dataObj.newSite);
        //   break;
        // case "remove from network":
        //   this.controller.removeFromNetwork(dataObj.oldPeer);
        //   break;
        default:
          this.controller.handleRemoteOperation(dataObj);
      }
    });
  }

  // removeFromConnections(peer) {
  //   //this.allConns = this.allConns.filter(conn => conn.peer !== peer);
  //   this.directConns = this.directConns.filter(conn => conn.peer !== peer);
  //   //this.removeFromNetwork(peer);
  // }

  onConnClose(connection) {
    connection.on("close", () => {
      this.directConns = this.directConns.filter(conn => conn.peer !== peer);
      if (connection.peer == this.controller.urlId) {
        const id = this.randomId();
        if (id) {
          this.controller.updatePageURL(id);
        }
      }
      // if (!this.hasReachedMax()) {
      //   this.controller.findNewTarget();
      // }
    });
  }

  // request connection to another peer
  // peerId: this peer;
  // target: get from url: {key: 'lwjd5qra8257b9'}
  requestConnection(target, peerId, siteId) {
    const conn = this.peer.connect(target);
    this.addTodirectConns(conn);
    conn.on("open", () => {
      conn.send(
        JSON.stringify({
          type: "connRequest",
          peerId: peerId,
          siteId: siteId
        })
      );
    });
  }

  // listen connections from others
  acceptConnRequest(peerId, siteId) {
    const connBack = this.peer.connect(peerId);
    this.addTodirectConns(connBack);

    const initialData = JSON.stringify({
      type: "syncResponse",
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      initialStruct: this.controller.crdt.chars,
      //initialVersions: this.controller.vector.versions,
      //network: this.controller.network
    });

    if (connBack.open) {
      connBack.send(initialData);
    } else {
      connBack.on("open", () => {
        connBack.send(initialData);
      });
    }
  }

  // send message to all connections (broadcast)
  send(operation) {
    const operationJSON = JSON.stringify(operation);
    // if (operation.type === "insert" || operation.type === "delete") {
    //   this.addToOutgoingBuffer(operationJSON);

    // }
    this.directConns.forEach(conn => conn.send(operationJSON));
  }

  // connect to others
  addTodirectConns(connection) {
    if (!!connection && !this.isAlreadyConnectedOut(connection)) {
      this.directConns.push(connection);
    }
  }

  isAlreadyConnectedOut(connection) {
    if (connection.peer) {
      return !!this.directConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.directConns.find(conn => conn.peer.id === connection);
    }
  }

  // randomId() {
  //   const possConns = this.allConns.filter(conn => {
  //     return this.peer.id !== conn.peer;
  //   });
  //   const randomIdx = Math.floor(Math.random() * possConns.length);
  //   if (possConns[randomIdx]) {
  //     return possConns[randomIdx].peer;
  //   } else {
  //     return false;
  //   }
  // }

  // addToNetwork(peerId, siteId) {
  //   this.send({
  //     type: "add to network",
  //     newPeer: peerId,
  //     newSite: siteId
  //   });
  // }

  // addToOutgoingBuffer(operation) {
  //   if (this.outgoingBuffer.length === this.MAX_BUFFER_SIZE) {
  //     this.outgoingBuffer.shift();
  //   }

  //   this.outgoingBuffer.push(operation);
  // }
}

export default BroadCast;
