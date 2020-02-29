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
    let pos = from;
    for (let i = 0; i < text.length; i++) {
      const char = this.crdt.generateChar(pos, text[i])
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

  broadcast(char) {}

  addToNetwork(peerId, siteId, doc=document)
  {
    if (!this.network.find(obj => obj.siteId === siteId)) {
      this.network.push({ peerId, siteId });
      if (siteId !== this.siteId) {
        this.addToListOfPeers(siteId, peerId, doc);
      }

      this.broadcast.addToNetwork(peerId, siteId);
    }
  }


  addToListOfPeers(siteId, peerId, doc=document) {
    const listItem = doc.createElement('li');
    const node = doc.createElement('span');

// // purely for mock testing purposes
    //   let parser;
    //   if (typeof DOMParser === 'object') {
    //     parser = new DOMParser();
    //   } else {
    //     parser = {
    //       parseFromString: function() {
    //         return { firstChild: doc.createElement('div') }
    //       }
    //     }
    //   }

    const parser = new DOMParser();

    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    // COMMENTED OUT: Video editor does not work
    // const phone = parser.parseFromString(Feather.icons.phone.toSvg({ class: 'phone' }), "image/svg+xml");
    // const phoneIn = parser.parseFromString(Feather.icons['phone-incoming'].toSvg({ class: 'phone-in' }), "image/svg+xml");
    // const phoneOut = parser.parseFromString(Feather.icons['phone-outgoing'].toSvg({ class: 'phone-out' }), "image/svg+xml");
    // const phoneCall = parser.parseFromString(Feather.icons['phone-call'].toSvg({ class: 'phone-call' }), "image/svg+xml");

    node.textContent = name;
    node.style.backgroundColor = color;
    node.classList.add('peer');

    // this.attachVideoEvent(peerId, listItem);

    listItem.id = peerId;
    listItem.appendChild(node);
    // listItem.appendChild(phone.firstChild);
    // listItem.appendChild(phoneIn.firstChild);
    // listItem.appendChild(phoneOut.firstChild);
    // listItem.appendChild(phoneCall.firstChild);
    doc.querySelector('#peerId').appendChild(listItem);
  }
}



export default Controller;
