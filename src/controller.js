class Controller {
  constructor(editor, broadcast, crdt, peer) {
    this.siteId = null;
    this.editor = editor;
    this.broadcast = broadcast;
    this.crdt = crdt;
  }

  // create new editor
  createEditor() {}

  // insert to editor
  insert() {}

  // delete from editor
  delete() {}

  broadcast(char) {}
}

export default Controller;
