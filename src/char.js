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
 *
 * @param {Char} charA
 * @param {Char} charB
 */
export function compare (charA, charB) {

}

export default Char;
