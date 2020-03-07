import Controller from "./controller";

let controller = new Controller(
  location.search.slice(1) || "0",
  location.origin
);
