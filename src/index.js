import Controller from "./controller";
import { BroadCastService } from "./broadcast_service";

//let broadcastService = new BroadCastService;

let controller0 = new Controller(
  location.origin,
  location.search.slice(1) || "0",
  "editor1",
);


