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
   * @param {*} from
   */
  localInsert(text, from) {
    this.crdt.insertChar(this.crdt.generateChar(from, text));
    this.updateEditor();
  }

  /**
   *  delete from editor
   * @param {*} text string
   * @param {*} from
   * @param {*} to 
   */
  localDelete(text, from, to) {
    this.crdt.deleteChar(this.crdt.lookupCharByPosition(from));
    this.updateEditor();
  }

  updateEditor() {
    this.editor.canvas.codemirror.getDoc().setValue(this.crdt.toText());
  }

  broadcast(char) {}
}

export default Controller;
