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
    this.broadcast = new BroadCast();
    this.crdt = new CRDT();
    this.peer = new Peer();
    this.broadcastService = boradcastService;
    this.broadcastService.registerController(this.siteId,
       (char)=> {
         this.crdt.insertChar(char);
         this.updateEditor();
        },
       (char) => {
         this.crdt.deleteChar(char);
         this.updateEditor();
        });
  }

  // create new editor
  createEditor() {}

  /**
   * insert to editor
   * @param {*} text string
   * @param {*} from
   */
  localInsert(text, from) {
    const char = this.crdt.generateChar(from, text)
    this.crdt.insertChar(char);
    this.updateEditor();
    this.broadcastService.broadcast("insert", char, this.siteId);
  }

  /**
   *  delete from editor
   * @param {*} text string
   * @param {*} from
   * @param {*} to 
   */
  localDelete(text, from, to) {
    const char = this.crdt.lookupCharByPosition(from);
    this.crdt.deleteChar(char);
    this.broadcastService.broadcast("delete", char, this.siteId);
    this.updateEditor();
  }

  updateEditor() {
    this.editor.canvas.codemirror.getDoc().setValue(this.crdt.toText());
  }

  broadcast(char) {}
}

export default Controller;
