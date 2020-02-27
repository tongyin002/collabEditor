import Controller from "./controller";

let controller = new Controller(
  location.origin,
  location.search.slice(1) || "0"
);
