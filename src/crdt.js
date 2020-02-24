class crdt {
    

    constructor(boundry, base, strategy) {
        this.boundry = boundry;
        this.base = base;
        this.strategy = strategy;
        this.S = {};
    }

    generatesID(start, end) {
        let depth = 0, interval = 0;
        while (interval < 1) {
            depth++;
        }
    }

    /**
     * Generate prefix
     * @param {Array<number>} id 
     * @param {number} depth 
     * @param {bool} isStart 
     * @param {number} base
     * @return {number} the value at depth
     */
    prefix(id, depth, isStart, base) {
        if (id.length < depth) {
            return 
        }
        
    }

}