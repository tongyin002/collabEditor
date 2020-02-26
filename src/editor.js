import EasyMDE from "easymde";

class Editor {
  constructor() {
    this.canvas = new EasyMDE({
      element: document.getElementById("MyID"),
      toolbar: false
    });

    // replace default key tab to 4 spaces
    this.canvas.codemirror.setOption("extraKeys", {
      Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 3).join(" ");
        cm.replaceSelection(spaces);
      }
    });

    this.readyForChangeEvents();
  }

  // binding events to current editor
  readyForChangeEvents() {
    this.canvas.codemirror.on("change", (_, changeObj) => {
      console.log(changeObj.origin);
      switch (changeObj.origin) {
        case "redo":
          this.redo(changeObj);
          break;
        case "undo":
          this.undo(changeObj);
          break;
        case "+input":
        case "paste":
          this.insert(changeObj);
          break;
        case "+delete":
          this.delete(changeObj);
          break;
        default:
          throw new Error(
            "Operation " + changeObj.origin + " is not supported!"
          );
      }
    });
  }

  redo(changeObj) {}

  undo(changeObj) {}

  insert(changeObj) {
    let text = changeObj.text;
    let from = changeObj.from;
    let to = changeObj.to;
    console.log(text, from, to);
  }

  delete(changeObj) {}
}

export default Editor;
