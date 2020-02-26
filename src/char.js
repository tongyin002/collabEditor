/**
 * 
 */
class Char {
    /**
     * 
     * @param {Array<number>} id Unique id, used in CRDT.
     * @param {string} value A single character. 
     */
    constructor(id, value, siteID, siteCounter) {
        this.id = id;
        this.value = value;
        this.siteID = siteID;
        this.sideCounter = sideCounter;
    }
}

/**
 *
 * Compare the position of two chars according to their id.
 * @param {Char} charA
 * @param {Char} charB
 * @returns 1 if charA is greater than charB, -1 if charA is less than charB, 0 if two chars are equal.
 */
export function compare (charA, charB) {
    const aLen = charA.id.length;
    const bLen = charB.id.length;
    for (let i = 0; i < Math.min(aLen, bLen); i++) {
        if (charA[i] === charB[i]) {
            continue;
        }
        return charA[i] > charB[i] ? 1 : -1;
    }
    if (aLen === bLen) {
        return 0;
    }
    return aLen > bLen ? 1 : -1;
}

export default Char;
