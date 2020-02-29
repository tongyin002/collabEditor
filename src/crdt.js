import { Char, compare } from './char';

/**
 * @class CRDT
 */
class CRDT {
    /**
     * Creates an instance of CRDT.
     * We used LSEQ algorithm. For more details, please refer to:
     * https://hal.archives-ouvertes.fr/hal-00921633/document
     * @param {number} boundry the maximum interval between two ids
     * @param {number} base maximum number of nodes in the first level
     * @memberof crdt
     */
    constructor(boundry = 10, base = 32) {
        this.boundry = boundry;
        this.base = base;
        this.siteCounter = 0;
        this.siteID = this.generateUUID();
        this.strategyMap = new Map();
        /**
         * index represents the postion of the char.
         * @type{Array<Char>}
         */

        this.chars = [];
    }

    /**
     * Inserts char passed in
     * @param {Char} char
     * @memberof CRDT
     */
    insertChar(char) {
        let position = this.lookupPositionByID(char);
        console.log(position);
        console.log(char);
        this.logChars();
        this.chars.splice(position, 0, char);
    }

    /**
     * Deletes char passed in
     * @param {Char} char
     * @returns{boolean} true if successfully delted, false otherwise.
     * @memberof CRDT
     */
    deleteChar(char) {
        let position = this.lookupPositionByID(char);
        if (compare(this.chars[position], char) !== 0) {
            return false;
        }
        this.chars.splice(position, 1);
        return true;
    }

    /**
     * Looks up according to the pos from Editor and returns the Char from chars
     * If pos not found, return null
     * @param {number} pos
     * @returns {Char} 
     * @memberof CRDT
     */
    lookupCharByPosition(pos) {
        return pos >= this.chars.length || pos < 0 ? null : this.chars[pos];
    }

    /**
     * Given the position to insert the char, returns the value of the char.
     * @param {number} pos the position where the new character will be inserted, 
     *   the character at current positon and after will be shifted to the right
     * @param {string} val
     * @returns {Char}
     * @memberof CRDT
     */
    generateChar(pos, val) {
        this.siteCounter++;
        const left = this.lookupCharByPosition(pos - 1);
        const right = this.lookupCharByPosition(pos);
        const newID = this.generateID(left == null ? [] : left.id,
            right == null ? [] : right.id);
        return new Char(newID, val, this.siteID, this.siteCounter);
    }

    /**
     *
     * @returns {string} the text of the full document.
     * @memberof CRDT
     */
    toText() {
        let text = "";
        for (let i = 0; i < this.chars.length; i++) {
            text += this.chars[i].value;
        }
        return text;
    }




    /** Private functions below */
    /**
     *
     * 
     * @param {Char} char
     * @returns {number} position of char or position before which char should be inserted
     * @memberof CRDT
     */
    lookupPositionByID(char) {
        if (this.chars.length === 0) {
            return 0;
        }
        let left = 0, right = this.chars.length - 1;
        while (left + 1 < right) {
            let mid = Math.floor((left + right) / 2);
            if (compare(char, this.chars[mid]) > 0) {
                left = mid;
            } else {
                right = mid;
            }
        }
        if (compare(char, this.chars[left]) <= 0) {
            return left;
        }

        if (compare(char, this.chars[right]) > 0) {
            return right+1;
        }
        return right;
    }

    /**
     *
     *
     * @param {Array<number>} start
     * @param {Array<number>} end
     * @returns{Arrary<number>} returns a new id that is between start and end.
     * @memberof crdt
     * @private
     */
    generateID(start, end) {
        let depth = 0, interval = 0;
        while (interval < 1) {
            interval = this.prefix(end, depth, false)[depth] - this.prefix(start, depth, true)[depth] - 1;
            depth++;
        }
        depth--;
        let step = Math.min(this.boundry, interval) - 1;
        if (this.strategyMap.get(depth) == null) {
            this.strategyMap.set(depth, Math.floor(Math.random() * 2));
        }
        let id = [];
        if (this.strategyMap.get(depth) > 0) {
            let addVal = Math.floor(Math.random() * step) + 1;
            id = this.prefix(start, depth, true);
            id[depth] += addVal;
        } else {
            let minVal = Math.floor(Math.random() * step) + 1;
            id = this.prefix(end, depth, false);
            id[depth] -= minVal;
        }
        return id;
    }

    /**
     * Generate prefix
     * @param {Array<number>} id 
     * @param {number} depth 
     * @param {bool} isStart 
     * @returns {Array<number>} new id
     * @private
     */
    prefix(id, depth, isStart) {
        let idCopy = [];
        let currBase = this.base;
        for (let i = 0; i <= depth; i++) {
            if (id.length-1 === i && i !== depth && !isStart) {
                idCopy.push(id[i]-1);
            } else if (id.length > i) {
                idCopy.push(id[i]);
            }
            else if (isStart) {
                idCopy.push(0);
            }
            else {
                idCopy.push(currBase);
            }
            currBase *= 2;
        }
        return idCopy;
    }

    generateUUID() {
        var d = new Date().getTime();//Timestamp
        var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16;//random number between 0 and 16
            if (d > 0) {//Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    logChars() {
        console.log(this.chars);
    }

}

export default CRDT;