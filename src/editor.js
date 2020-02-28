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
    // this.callDelete(changeObj); // in case of paste (replaceing some chars in editor)
    let text = this.textTransform(changeObj.text);
    const pos = this.canvas.codemirror.getDoc().indexFromPos(changeObj.from);
    this.controller.localInsert(text, pos);
  }

  callDelete(changeObj) {
    let text = this.textTransform(changeObj.removed);
    this.controller.localDelete(
      text,
      this.canvas.codemirror.getDoc().indexFromPos(changeObj.from),
      this.canvas.codemirror.getDoc().indexFromPos(changeObj.to)
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

