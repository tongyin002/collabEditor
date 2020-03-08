import { random, some, remove, last, head } from "lodash";
/**
 *
 * @param {{val: string, counter: int, id: int, pos: array}} char1
 * @param {*} char2
 */
function compareChars(char1, char2) {
  for (let i = 0; i < Math.min(char1.pos.length, char2.pos.length); i++) {
    let p1 = char1.pos[i];
    let p2 = char2.pos[i];
    let res = comparePos(p1, p2);

    if (res !== 0) {
      return res;
    }
  }

  if (char1.pos.length < char2.pos.length) {
    return -1;
  } else if (char1.pos.length > char2.pos.length) {
    return 1;
  }

  return 0;
}

/**
 *
 * @param {{val: , id: }} pos1
 * @param {*} pos2
 */
function comparePos(pos1, pos2) {
  if (pos1.val < pos2.val) {
    return -1;
  } else if (pos1.val > pos2.val) {
    return 1;
  }

  if (pos1.id < pos2.id) {
    return -1;
  } else if (pos1.id > pos2.id) {
    return 1;
  }

  return 0;
}

/**
 *
 * @param {*} crdt
 * @param {{line: , ch: }} loc
 */
function getPosBefore(dataArr, loc) {
  let line = loc.line;
  let ch = loc.ch;

  if (line === 0 && ch === 0) {
    return [];
  } else if (ch === 0) {
    line--;
    ch = dataArr[line].length - 1;
  } else {
    ch--;
  }

  return dataArr[line][ch].pos;
}

function getPosAfter(dataArr, loc) {
  let line = loc.line;
  let ch = loc.ch;

  const numOfLines = dataArr.length;
  const numOfChars = (dataArr[line] && dataArr[line].length) || 0;

  if (line === numOfLines - 1 && ch === numOfChars) {
    // no more chars
    return [];
  } else if (line < numOfLines - 1 && ch === numOfChars) {
    // next char is on the next line
    line++;
    ch = 0;
  } else if (line >= numOfLines && ch === 0) {
    return [];
  }
  return dataArr[line][ch].pos;
}

function createPos(pos1, pos2, id, cache = [], level = 0, pos = []) {
  let limit = Math.pow(2, level) * 32;

  if (!!!cache[level]) {
    cache[level] = level % 2 === 0 ? "left" : "right";
  }

  let temp1 = pos1[level] || { val: 0, id };
  let temp2 = pos2[level] || { val: limit, id };

  if (temp1.val + 1 < temp2.val) {
    pos.push({ val: createBetween(temp1.val, temp2.val, cache[level]), id });
    return pos;
  } else if (comparePos(temp1, temp2) === 0) {
    pos.push(temp1);
    return createPos(pos1, pos2, id, cache, level + 1, pos);
  } else {
    pos.push(temp1);
    return createPos(pos1, [], id, cache, level + 1, pos);
  }
}

function createBetween(val1, val2, plan) {
  let min;
  let max;

  if (val2 - val1 < 10) {
    max = val2 - 1;
    min = val1 + 1;
  } else {
    switch (plan) {
      case "left":
        max = val2 - 1;
        min = max - 9;
        break;
      default:
        min = val1 + 1;
        max = min + 9;
        break;
    }
  }

  return random(min, max, false);
}

function mergeTwoLines(dataArr, from) {
  let merged = concat(dataArr[from.line], dataArr[from.line + 1]);
  dataArr.splice(from.line, 2, merged);
}

function hasTooManyConns(members, connsForReceive, connsForSend) {
  let limit = Math.max(members.size / 2, 5);
  return connsForSend.length > limit || connsForReceive.length > limit;
}

function addToConnArr(connection, connArr) {
  if (
    !some(connArr, conn => {
      return conn.peer === connection.peer;
    }) &&
    !!connection
  ) {
    connArr.push(connection);
  }
}

function updateVersionWith(ver1, ver2) {
  if (ver2.counter <= ver1.counter) {
    remove(ver1.notSeen, counter => {
      return counter === ver2.counter;
    });
  } else if (ver2.counter === ver1.counter + 1) {
    ver1.counter++;
  } else {
    for (let i = ver1.counter + 1; i < ver2.counter; i++) {
      ver1.notSeen.push(i);
    }
    ver1.counter = ver2.counter;
  }
}

function findInsertLoc(char, dataArr) {
  let top = 0;
  let bottom = dataArr.length - 1;
  let firstLine = dataArr[top];
  let lastLine = dataArr[bottom];

  if (
    !firstLine ||
    firstLine.length == 0 ||
    compareChars(char, head(firstLine)) < 0
  ) {
    return { line: 0, ch: 0 };
  }

  if (compareChars(char, last(lastLine)) > 0) {
    return last(lastLine).val === "\n"
      ? { line: bottom + 1, ch: 0 }
      : { line: bottom, ch: lastLine.length };
  }

  while (top < bottom - 1) {
    let mid = Math.floor(top + (bottom - top) / 2);
    let line = dataArr[mid];

    if (compareChars(char, last(line)) === 0) {
      return { line: mid, ch: line.length - 1 };
    } else if (compareChars(char, last(line)) < 0) {
      bottom = mid;
    } else {
      top = mid;
    }
  }

  let topLine = dataArr[top];
  let bottomLine = dataArr[bottom];
  if (compareChars(char, last(topLine)) <= 0) {
    return { line: top, ch: findIndex(char, topLine) };
  } else {
    return { line: bottom, ch: findIndex(char, bottomLine) };
  }
}

function findIndex(char, line) {
  let l = 0;
  let r = line.length - 1;

  while (l < r - 1) {
    let mid = Math.floor(l + (r - l) / 2);
    if (compareChars(char, line[mid]) === 0) {
      return mid;
    } else if (compareChars(char, line[mid]) < 0) {
      r = mid;
    } else {
      l = mid;
    }
  }

  return compareChars(char, line[l]) === 0 ? l : r;
}

function getDiff(cs) {
  let ret = { line: 0, ch: 0 };
  for (let i = 0; i < cs.length; i++) {
    if (cs[i] === "\n") {
      ret.line++;
      ret.ch = 0;
    } else {
      ret.ch++;
    }
  }
  return ret;
}

function findDeleteLoc(char, dataArr) {
  let top = 0;
  let bottom = dataArr.length - 1;
  let firstLine = dataArr[top];
  let lastLine = dataArr[bottom];

  if (
    !lastLine ||
    lastLine.length === 0 ||
    compareChars(char, head(firstLine)) < 0
  )
    return false;

  if (compareChars(char, last(lastLine)) > 0) return false;

  while (top < bottom - 1) {
    let mid = Math.floor(top + (bottom - top) / 2);
    let line = dataArr[mid];

    if (compareChars(char, last(line)) === 0) {
      return { line: mid, ch: line.length - 1 };
    } else if (compareChars(char, last(line)) < 0) {
      bottom = mid;
    } else {
      top = mid;
    }
  }

  let topLine = dataArr[top];
  let bottomLine = dataArr[bottom];
  if (compareChars(char, last(topLine)) <= 0) {
    let index = findIndex(char, topLine);
    return { line: top, ch: index };
  } else {
    let index = findIndex(char, bottomLine);
    return { line: bottom, ch: index };
  }
}

export {
  compareChars,
  comparePos,
  getPosBefore,
  getPosAfter,
  createPos,
  mergeTwoLines,
  hasTooManyConns,
  addToConnArr,
  updateVersionWith,
  findInsertLoc,
  getDiff,
  findDeleteLoc
};
