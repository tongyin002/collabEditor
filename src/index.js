import Controller from "./controller";

let controller = new Controller(
  location.origin,
  location.search.slice(1) || "0"
);

// debug
let editor = controller.editor;
let cm = editor.canvas.codemirror;
