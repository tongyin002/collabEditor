import EasyMde from "easymde";

import { getDiff } from "./util";

class Editor {
  constructor(controller) {
    this.canvas = new EasyMde({
      element: document.getElementById("editor"),
      toolbar: false
    });

    // replace default key tab to 4 spaces
    this.canvas.codemirror.setOption("extraKeys", {
      Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 3).join(" ");
        cm.replaceSelection(spaces);
      }
    });

    this.controller = controller;
    this.onChangeEvents();
  }

  /**
   * register change events on the current editor
   */
  onChangeEvents() {
    this.canvas.codemirror.on("change", (_, changeObj) => {
      switch (changeObj.origin) {
        case "setValue":
        case "Insert Char":
        case "Delete Char":
          break;
        case "redo":
        case "undo":
          this.handleLocalRedoUndo(changeObj);
          break;
        case "+input":
        case "paste":
          this.handleLocalInsert(changeObj);
          break;
        case "+delete":
        case "cut":
          this.handleLocalDelete(changeObj);
          break;
        default:
          throw new Error(`Operation ${changeObj.origin} is not supported`);
      }
    });
  }

  /**
   * when redo undo happens
   * @param {*} changeObj
   */
  handleLocalRedoUndo(changeObj) {
    let removed = changeObj.removed;
    if (removed[0].length > 0) {
      this.handleLocalDelete(changeObj);
    } else {
      this.handleLocalInsert(changeObj);
    }
  }

  /**
   * when chars are typed
   * @param {*} changeObj
   */
  handleLocalInsert(changeObj) {
    if (changeObj.removed[0].length > 0) {
      this.handleLocalDelete(changeObj); // in case of replace
    }

    let text = this.transformText(changeObj.text);
    this.controller.handleLocalInsert(text, changeObj.from);
  }

  /**
   * when chars are deleted
   * @param {*} changeObj
   */
  handleLocalDelete(changeObj) {
    this.controller.handleLocalDelete(changeObj.from, changeObj.to);
  }

  transformText(textArr) {
    if (textArr.length === 2 && textArr[0] === "" && textArr[1] === "") {
      return "\n";
    } else {
      return textArr.join("\n");
    }
  }

  replaceText(text) {
    let cursor = this.canvas.codemirror.getCursor();
    this.canvas.value(text);
    this.canvas.codemirror.setCursor(cursor);
  }

  insertText(text, locs) {
    let oldCursor = this.canvas.codemirror.getCursor();
    let diff = getDiff(text);

    this.canvas.codemirror.replaceRange(
      text,
      locs.from,
      locs.to,
      "Insert Char"
    );

    if (oldCursor.line > locs.to.line) {
      oldCursor.line += diff.line;
    } else if (oldCursor.line === locs.to.line && oldCursor.ch > locs.to.ch) {
      if (diff.line > 0) {
        oldCursor.line += diff.line;
        oldCursor.ch -= locs.to.ch;
      }
      oldCursor.ch += diff.ch;
    }
    this.canvas.codemirror.setCursor(oldCursor);
  }

  deleteText(text, locs) {
    let oldCursor = this.canvas.codemirror.getCursor();
    let diff = getDiff(text);

    this.canvas.codemirror.replaceRange("", locs.from, locs.to, "Delete Char");

    if (oldCursor.line > locs.to.line) {
      oldCursor.line -= diff.line;
    } else if (oldCursor.line === locs.to.line && oldCursor.ch > locs.to.ch) {
      if (diff.line > 0) {
        oldCursor.line -= diff.line;
        oldCursor.ch += locs.from.ch;
      }
      oldCursor.ch -= diff.ch;
    }

    this.canvas.codemirror.setCursor(oldCursor);
  }
}

export default Editor;
