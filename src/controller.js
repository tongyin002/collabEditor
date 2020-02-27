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

  // insert to editor
  localInsert(text, from) {
    console.log(text, from);
  }

  // delete from editor
  localDelete(text, from, to) {
    console.log(text, from, to);
  }

  broadcast(char) {}
}

export default Controller;
