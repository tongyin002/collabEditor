import Editor from "./editor";
import BroadCast from "./broadcast";
import CRDT from "./crdt";
import Peer from "peerjs";
import { BroadCastService } from "./broadcast_service";

class Controller {
  constructor(host, targetPeerId, elementId) {
    this.host = host;
    this.siteId = this.generateUUID();
    this.editor = new Editor(this, elementId);
    this.crdt = new CRDT();
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

    this.broadcast = new BroadCast(this, this.peer);
    this.broadcast.bindServerEvents(targetPeerId);
  }

  // create new editor
  createEditor() {}

  /**
   * insert to editor
   * @param {*} text string
   * @param {*} from
   */
  localInsert(text, from) {
    let pos = from;
    for (let i = 0; i < text.length; i++) {
      const char = this.crdt.generateChar(pos, text[i]);
      this.crdt.insertChar(char);
      this.broadcastInsertion(char);
      pos++;
    }
    this.updateEditor();
  }

  /**
   *  delete from editor
   * @param {*} text string
   * @param {*} from
   * @param {*} to
   */
  localDelete(text, from, to) {
    let pos = from;
    console.log(`from: ${from}, to: ${to}`);
    for (let i = from; i < to; i++) {
      console.log(`intended position: ${pos}`);
      const char = this.crdt.lookupCharByPosition(pos);
      this.crdt.deleteChar(char);
      this.broadcastDeletion(char);
    }
    this.updateEditor();
  }

  updateEditor() {
    const cursor = this.editor.canvas.codemirror.getCursor();
    this.editor.canvas.codemirror.getDoc().setValue(this.crdt.toText());
    this.editor.canvas.codemirror.setCursor(cursor);
  }

  updatePageURL(id, win = window) {
    const newURL = this.host + "?" + id;
    win.history.pushState({}, "", newURL);
  }

  updateSharedLink(id, doc = document) {
    let link = this.host + "?" + id;
    let ptag = doc.querySelector("#link");
    ptag.textContent = link;
  }

  handleRemoteOperation(operation) {
    let cursor = this.editor.canvas.codemirror.getCursor();
    let cursorPos = this.editor.canvas.codemirror.getDoc().indexFromPos(cursor);
    console.log(cursor);
    console.log(cursorPos);
    if (operation.type === "insert") {
      let pos = this.crdt.insertChar(operation.char);
      if (pos < cursorPos) {
        cursorPos++;
      }
    } else if (operation.type === "delete") {
      let pos = this.crdt.deleteChar(operation.char);
      if (pos < cursorPos) {
        cursorPos--;
      }
    }
    this.editor.canvas.codemirror.getDoc().setValue(this.crdt.toText());
    let newCursor = this.editor.canvas.codemirror.getDoc().posFromIndex(cursorPos);
    this.editor.canvas.codemirror.setCursor(newCursor);    
    console.log(newCursor);
    console.log(cursorPos);   
  }

  populateCRDT(initialStruct) {
    const content = initialStruct.map(char => {
      return new Char(char.id, char.value, char.siteId, char.siteCounter);
    });
    this.crdt.chars = content;
    this.updateEditor();
  }

  broadcastInsertion(char) {
    const operation = {
      type: "insert",
      char: char
    };

    this.broadcast.send(operation);
  }

  broadcastDeletion(char) {
    const operation = {
      type: "delete",
      char: char
    };

    this.broadcast.send(operation);
  }

  generateUUID() {
    var d = new Date().getTime(); //Timestamp
    var d2 = (performance && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16; //random number between 0 and 16
      if (d > 0) {
        //Use timestamp until depleted
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        //Use microseconds since page-load if supported
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

export default Controller;
