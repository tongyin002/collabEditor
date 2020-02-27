import Editor from "./editor";
import BroadCast from "./broadcast";
import CRDT from "./crdt";
import Peer from "peerjs";

class Controller {
  constructor(host, targetPeerId) {
    this.siteId = null;
    this.editor = new Editor(this);
    this.broadcast = new BroadCast();
    this.crdt = new CRDT();
    this.peer = new Peer();
  }

  // create new editor
  createEditor() {}

  /**
   * insert to editor
   * @param {*} text string
   * @param {*} from {line: <line #>, index: <index position>}
   */
  localInsert(text, from) {
    console.log(text, from);
  }

  /**
   *  delete from editor
   * @param {*} text string
   * @param {*} from {line: <line #>, index: <index position>}
   * @param {*} to {line: <line #>, index: <index position>}
   */
  localDelete(text, from, to) {
    console.log(text, from, to);
  }

  broadcast(char) {}
}

export default Controller;
