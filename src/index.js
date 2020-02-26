import Controller from "./controller";
import Editor from "./editor";
import CRDT from "./crdt";
import BroadCast from "./broadcast";
import Peer from "peerjs";

let controller = new Controller(
  new Editor(),
  new BroadCast(),
  new CRDT(),
  new Peer()
);
