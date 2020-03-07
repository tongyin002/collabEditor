import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import { forEach, cloneDeep } from "lodash";

import Editor from "./editor";
import CRDT from "./crdt";
import Vector from "./vector";
import BroadCast from "./broadcast";

class Controller {
  constructor(targetPeerId, host) {
    this.targetPeerId = targetPeerId;
    this.host = host;
    this.id = uuidv4();
    this.members = new Map();
    this.buffer = [];

    this.peer = new Peer({
      host: location.hostname,
      port: location.port || (location.protocol === "https:" ? 443 : 80),
      path: "/peerjs",
      config: {
        iceServers: [
          { url: "stun:stun1.l.google.com:19302" },
          {
            url: "turn:numb.viagenie.ca",
            credential: "conclave-rulez",
            username: "sunnysurvies@gmail.com"
          }
        ]
      },
      debug: 1
    });

    this.editor = new Editor(this);
    this.vector = new Vector(this.id);
    this.crdt = new CRDT(this);
    this.broadcast = new BroadCast(this, this.peer);
    this.broadcast.onOpen(targetPeerId);
  }

  /**
   *
   * @param {string} text
   * @param {{line: , ch: }} from
   */
  handleLocalInsert(text, from) {
    let line = from.line;
    let ch = from.ch;

    for (let i = 0; i < text.length; i++) {
      if (text[i - 1] === "\n") {
        line++;
        ch = 0;
      }
      this.crdt.handleLocalInsert(text[i], { line: line, ch: ch });
      ch++;
    }
  }

  /**
   *
   * @param {{line: , ch: }} from
   * @param {{line: , ch: }} to
   */
  handleLocalDelete(from, to) {
    this.crdt.handleLocalDelete(from, to);
  }

  broadcastInsert(char) {
    this.broadcast.send({
      type: "Insert",
      char,
      version: this.vector.localVersion
    });
  }

  broadcastDelete(char, version) {
    this.broadcast.send({
      type: "Delete",
      char,
      version
    });
  }

  // work on remote insert / delete
  workOnOp(dataObj) {
    if (this.vector.redundantWork(dataObj.version)) return;

    if (dataObj.type === "Insert") {
      this.takeThisJob(dataObj);
    } else {
      this.buffer.push(dataObj);
    }

    this.takeJobsFromBuffer();
    this.broadcast.send(dataObj);
  }

  takeThisJob(dataObj) {
    let char = cloneDeep(dataObj.char);
    if (dataObj.type === "Insert") {
      this.crdt.handleRemoteInsert(char);
    } else if (dataObj.type === "Delete") {
      this.crdt.handleRemoteDelete(char);
    }

    this.vector.updateVersion(dataObj.version);
  }

  takeJobsFromBuffer() {
    let index = 0;
    while (index < this.buffer.length) {
      let job = this.buffer[index];
      let isApplied = this.vector.redundantWork({
        id: job.char.id,
        counter: job.char.counter
      });
      if (isApplied) {
        this.takeThisJob(job);
        this.buffer.splice(index, 1);
      } else {
        index++;
      }
    }
  }

  addMember(peerId, id) {
    if (!this.members.get(id)) {
      this.members.set(id, peerId);
    }
    this.broadcast.addMember(peerId, id);
  }

  updateURL(id) {
    this.targetPeerId = id;
    window.history.pushState({}, ""), this.host + "?" + this.targetPeerId;
  }

  copyInitialData(dataObj) {
    if (dataObj.peerId !== this.targetPeerId) {
      this.targetPeerId = dataObj.peerId;
      this.updateURL(this.targetPeerId);
    }

    forEach(dataObj.members, (peerId, id) => {
      this.addMember(peerId, id);
    });

    if (this.crdt.numOfChars() === 0) {
      this.crdt.data = cloneDeep(dataObj.crdtData);
      this.editor.replaceText(this.crdt.getText());

      this.vector.versions = cloneDeep(dataObj.versions);
    }

    this.broadcast.sendCopyCompleted(dataObj.peerId);
  }

  insertIntoEditor(char, loc) {
    let locs = {
      from: cloneDeep(loc),
      to: cloneDeep(loc)
    };

    this.editor.insertText(char.val, locs);
  }

  deleteFromEditor(char, loc) {
    let locs;
    if (char.val === "\n") {
      locs = {
        from: cloneDeep(loc),
        to: {
          line: loc.line + 1,
          ch: 0
        }
      };
    } else {
      locs = {
        from: cloneDeep(loc),
        to: {
          line: loc.line,
          ch: loc.ch + 1
        }
      };
    }

    this.editor.deleteText(char.val, locs);
  }
}

export default Controller;
