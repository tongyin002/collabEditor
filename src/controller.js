import Editor from "./editor";
import BroadCast from "./broadcast";
import CRDT from "./crdt";
import Peer from "peerjs";
import { BroadCastService } from "./broadcast_service";

class Controller {
  constructor(host, targetPeerId, elementId, boradcastService) {
    // TODO(shirleyxt): switch back siteId once finished testing.
    this.siteId = elementId;
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
    // this.broadcastService = boradcastService;
    // this.broadcastService.registerController(
    //   this.siteId,
    //   char => {
    //     this.crdt.insertChar(char);
    //     this.updateEditor();
    //   },
    //   char => {
    //     this.crdt.deleteChar(char);
    //     this.updateEditor();
    //   }
    // );

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
      this.broadcastService.broadcast("insert", char, this.siteId);
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
      this.broadcastService.broadcast("delete", char, this.siteId);
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

  handleRemoteOperation(dataObj) {}

  exportOriginalData(dataObj) {}

  broadcast(char) {}
}

export default Controller;
