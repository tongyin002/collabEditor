import EasyMDE from "easymde";

class Editor {
  constructor(controller) {
    this.canvas = new EasyMDE({
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
    this.readyForChangeEvents();
  }

  // binding events to current editor
  readyForChangeEvents() {
    this.canvas.codemirror.on("change", (_, changeObj) => {
      switch (changeObj.origin) {
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
    this.callDelete(changeObj); // in case of paste (replaceing some chars in editor)
    let text = this.textTransform(changeObj.text);
    this.controller.localInsert(text, {
      line: changeObj.from.line,
      index: changeObj.from.ch
    });
  }

  callDelete(changeObj) {
    let text = this.textTransform(changeObj.removed);
    this.controller.localDelete(
      text,
      {
        line: changeObj.from.line,
        index: changeObj.from.ch
      },
      {
        line: changeObj.to.line,
        index: changeObj.to.ch
      }
    );
  }

  callRedoUndo(changeObj) {
    if (changeObj.removed.length > 0) {
      this.callDelete(changeObj);
    } else {
      this.callInsert(changeObj);
    }
  }
}

export default Editor;
