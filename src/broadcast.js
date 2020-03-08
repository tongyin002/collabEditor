import { filter, random, find, remove } from "lodash";
import { hasTooManyConns, addToConnArr } from "./util";

class BroadCast {
  constructor(controller, peer) {
    this.controller = controller;
    this.peer = peer;
    this.connsForSend = [];
    this.connsForReceive = [];
  }

  onOpen(targetPeerId) {
    this.peer.on("open", id => {
      // update shared link
      let ptag = document.getElementById("link");
      ptag.textContent = this.controller.host + "?" + id;

      this.onConnect();
      this.onDisconnect();

      if (targetPeerId === "0") {
        this.controller.addMember(id, this.controller.id);
      } else {
        this.requestConnect(targetPeerId, id);
      }
    });
  }

  requestConnect(target, peerId) {
    let conn = this.peer.connect(target);
    addToConnArr(conn, this.connsForSend);
    conn.on("open", () => {
      let dataObj = {
        type: "Request Connect",
        data: {
          peerId,
          id: this.controller.id
        }
      };

      conn.send(JSON.stringify(dataObj));
    });
  }

  onConnect() {
    this.peer.on("connection", connection => {
      addToConnArr(connection, this.connsForReceive);

      if (this.controller.targetPeerId === "0") {
        this.controller.updateURL(connection.peer);
      }

      // on data
      connection.on("data", data => {
        let dataObj = JSON.parse(data);
        switch (dataObj.type) {
          case "Add Member":
            this.controller.addMember(dataObj.data.peerId, dataObj.data.id);
            break;
          case "Request Connect":
            if (
              hasTooManyConns(
                this.controller.members,
                this.connsForSend,
                this.connsForReceive
              )
            ) {
              this.transferConnRequest(dataObj);
            } else {
              this.acceptConnRequest(dataObj);
            }
            break;
          case "Pouring All Data":
            this.controller.copyInitialData(dataObj);
            break;
          case "Copy Completed":
            break;
          case "Insert":
          case "Delete":
            this.controller.workOnOp(dataObj);
            break;
          case "Drop Member":
            this.controller.dropMember(dataObj.dropped);
            break;
          default:
            break;
        }
      });

      //on connection close
      connection.on("close", () => {
        remove(this.connsForReceive, conn => {
          return conn.peer === connection.peer;
        });
        remove(this.connsForSend, conn => {
          return conn.peer === connection.peer;
        });
        this.dropMember(connection.peer);

        if (connection.peer === this.controller.targetPeerId) {
          if (this.connsForSend.length > 0) {
            let rid = this.connsForSend[random(0, this.connsForSend.length - 1)]
              .peer;
            this.controller.updateURL(rid);
          }
        }

        if (
          !hasTooManyConns(
            this.controller.members,
            this.connsForReceive,
            this.connsForSend
          )
        ) {
          this.controller.reachOutOthers();
        }
      });
    });
  }

  transferConnRequest(dataObj) {
    let otherNodes = filter(this.connsForSend, conn => {
      return conn.peer !== dataObj.data.peerId;
    });
    let chosenConn = otherNodes[random(0, otherNodes.length - 1)];
    chosenConn.send(JSON.stringify(dataOj));
  }

  acceptConnRequest(dataObj) {
    let conn = this.peer.connect(dataObj.data.peerId);
    addToConnArr(conn, this.connsForSend);

    this.controller.addMember(dataObj.data.peerId, dataObj.data.id);

    let newDataObj = {
      type: "Pouring All Data",
      members: this.controller.members,
      crdtData: this.controller.crdt.data,
      versions: this.controller.vector.versions,
      peerId: this.peer.id,
      id: this.controller.id
    };

    if (conn.open) {
      conn.send(JSON.stringify(newDataObj));
    } else {
      conn.on("open", () => {
        conn.send(JSON.stringify(newDataObj));
      });
    }
  }

  onDisconnect() {
    this.peer.on("disconnected", () => {
      this.peer.reconnect();
    });
  }

  addMember(peerId, id) {
    let dataObj = {
      type: "Add Member",
      data: {
        peerId,
        id
      }
    };

    this.send(dataObj);
  }

  send(dataObj) {
    this.connsForSend.forEach(conn => {
      conn.send(JSON.stringify(dataObj));
    });
  }

  sendCopyCompleted(peerId) {
    let connection = find(this.connsForSend, conn => {
      return conn.peer === peerId;
    });

    let dataObj = {
      type: "Copy Completed",
      peerId: this.peer.id
    };

    if (connection) {
      connection.send(JSON.stringify(dataObj));
    } else {
      connection = this.peer.connect(peerId);
      addToConnArr(connection, this.connsForSend);
      connection.on("open", () => {
        connection.send(JSON.stringify(dataObj));
      });
    }
  }

  dropMember(peerId) {
    this.send({
      type: "Drop Member",
      dropped: peerId
    });
    this.controller.dropMember(peerId);
  }
}

export default BroadCast;
