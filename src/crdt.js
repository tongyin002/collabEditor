import { concat, take, takeRight, remove, reduce } from "lodash";
import {
  getPosBefore,
  getPosAfter,
  createPos,
  mergeTwoLines,
  findInsertLoc,
  findDeleteLoc
} from "./util";

class CRDT {
  constructor(controller) {
    this.controller = controller;
    this.data = [[]];
    this.cache = [];
  }

  /**
   *
   * @param {string} c
   * @param {{line: , ch: }} from
   */
  handleLocalInsert(c, from) {
    this.controller.vector.updateCounter();

    let char = this.createNewChar(c, from);
    this.insert(char, from);

    //broadcast this insertion
    this.controller.broadcastInsert(char);
  }

  /**
   *
   * @param {{line: , ch: }} from
   * @param {{line: , ch: }} to
   */
  handleLocalDelete(from, to) {
    let deletedChars = [];

    if (from.line === to.line) {
      // only chars on a single line are deleted
      deletedChars = this.data[from.line].splice(from.ch, to.ch - from.ch);
    } else {
      // several lines are deleted
      deletedChars = this.data[from.line].splice(from.ch);
      for (let line = from.line + 1; line < to.line; line++) {
        deletedChars = concat(deletedChars, this.data[line].splice(0));
      }
      if (this.data[to.line]) {
        deletedChars = concat(
          deletedChars,
          this.data[to.line].splice(0, to.ch)
        );
      }
    }

    let lineDeleted = false;
    deletedChars.forEach(char => {
      if (char.val === "\n") lineDeleted = true;
      this.controller.vector.updateCounter();
      this.controller.broadcastDelete(
        char,
        this.controller.vector.localVersion
      );
    });

    remove(this.data, line => {
      return line.length === 0;
    });
    if (this.data.length === 0) this.data.push([]);

    // merge two lines
    if (lineDeleted && this.data[from.line + 1]) mergeTwoLines(this.data, from);
  }

  createNewChar(c, loc) {
    let posBefore = getPosBefore(this.data, loc);
    let posAfter = getPosAfter(this.data, loc);
    let posCurr = createPos(
      posBefore,
      posAfter,
      this.controller.id,
      this.cache
    );

    return { val: c, counter: 0, id: this.controller.id, pos: posCurr };
  }

  /**
   *
   * @param {*} char
   * @param {*} from
   */
  insert(char, loc) {
    if (this.data.length === loc.line) this.data.push([]);

    let curLine = this.data[loc.line];
    let left = take(curLine, loc.ch);
    let right = takeRight(curLine, curLine.length - loc.ch);

    if (char.val !== "\n") {
      this.data[loc.line] = concat(left, char, right);
    } else {
      left = concat(left, char);
      if (right.length === 0) {
        // no more lines
        this.data[loc.line] = left;
      } else {
        this.data.splice(loc.line, 1, left, right);
      }
    }
  }

  getText() {
    return reduce(
      this.data,
      (text1, line) => {
        return (
          text1 +
          reduce(
            line,
            (text2, char) => {
              return text2 + char.val;
            },
            ""
          )
        );
      },
      ""
    );
  }

  numOfChars() {
    return reduce(
      this.data,
      (num, line) => {
        return num + line.length;
      },
      0
    );
  }

  handleRemoteInsert(char) {
    let loc = findInsertLoc(char, this.data);
    this.insert(char, loc);
    this.controller.insertIntoEditor(char, loc);
  }

  handleRemoteDelete(char) {
    let loc = findDeleteLoc(char, this.data);
    if (!loc) return;
    this.data[loc.line].splice(loc.ch, 1);
    if (char.value === "\n" && this.data[loc.line + 1])
      mergeTwoLines(this.data, loc.line);

    remove(this.data, line => {
      return line.length === 0;
    });
    if (this.data.length === 0) this.data.push([]);

    this.controller.deleteFromEditor(char, loc);
  }
}

export default CRDT;
