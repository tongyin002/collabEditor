import EasyMDE from "easymde";

class Editor {
  constructor(controller, elementId) {
    this.canvas = new EasyMDE({
      element: document.getElementById(elementId),
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
    this.readyForChangeEvents();
  }

  // binding events to current editor
  readyForChangeEvents() {
    this.canvas.codemirror.on("change", (_, changeObj) => {
      switch (changeObj.origin) {
        case undefined:
        case "setValue":
          return;
        case "redo":
        case "undo":
          this.callRedoUndo(changeObj);
          break;
        case "+input":
        case "paste":
          this.callInsert(changeObj);
          break;
        case "+delete":
          this.callDelete(changeObj);
          break;
        case "setValue":
          // Used to update value;
          console.log("setting value");
          break;
        default:
          throw new Error(
            "Operation " + changeObj.origin + " is not supported!"
          );
      }
    });
  }

  textTransform(text) {
    if (text.length === 2 && text[1] === "" && text[2] === "") {
      // new line char entered
      return "\n";
    } else {
      // multiline chars pasted
      return text.join("\n");
    }
  }

  callInsert(changeObj) {
    if (changeObj.removed.length > 0 && changeObj.removed[0].length > 0) {
      this.callDelete(changeObj); // in case of paste (replaceing some chars in editor)
    }
    let text = this.textTransform(changeObj.text);
    const pos = this.canvas.codemirror.getDoc().indexFromPos(changeObj.from);
    this.controller.localInsert(text, pos);
  }

  callDelete(changeObj) {
    let text = this.textTransform(changeObj.removed);
    const from = this.canvas.codemirror.getDoc().indexFromPos(changeObj.from);
    const to = from + text.length;
    this.controller.localDelete(text, from, to);
  }

  callRedoUndo(changeObj) {
    if (changeObj.removed.length > 0) {
      this.callDelete(changeObj);
    } else {
      this.callInsert(changeObj);
    }
  }

  workOnInsertOrder(text, from, to) {
    let cursorPos = this.canvas.codemirror.getCursor();
    let diff = this.getPosDiff(text);

    this.canvas.codemirror.replaceRange(text, from, to);

    // update cursor position
    if (cursorPos.line > to.line) {
      cursorPos.line += diff.line;
    } else if (cursorPos.line === to.line && cursorPos.ch > to.ch) {
      if (diff.line > 0) {
        cursorPos.line += diff.line;
        cursorPos.ch -= to.ch;
      }
      cursorPos.ch += diff.ch;
    }

    this.canvas.codemirror.setCursor(cursorPos);
  }

  getPosDiff(text) {
    let ret = { line: 0, ch: 0 };
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\n") {
        ret.line++;
        ret.ch = 0;
      } else {
        ret.ch++;
      }
    }
    return ret;
  }

  workOnDeleteOrder(text, from, to) {
    let cursorPos = this.canvas.codemirror.getCursor();
    let diff = this.getPosDiff(text);

    this.canvas.codemirror.replaceRange("", from, to);

    //update cursor position
    if (cursorPos.line > to.line) {
      cursorPos.line -= diff.line;
    } else if (cursorPos.line == to.line && cursorPos.ch > to.ch) {
      if (diff.line > 0) {
        cursorPos.line -= diff.line;
        cursorPos.ch += from.ch;
      }
      cursorPos.ch -= diff.ch;
    }

    this.canvas.codemirror.setCursor(cursorPos);
  }
}

export default Editor;

