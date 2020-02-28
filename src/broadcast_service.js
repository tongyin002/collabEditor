export class BroadCastService {
    constructor () {
        this.insertCallbacks = [];
        this.deleteCallbacks = [];
    }

    broadcast(operation, char, siteId) {
        if (operation == 'insert') {
            this.insertCallbacks.forEach((item)=> {
                if (item.siteId == siteId) {
                    return;
                }
                item.callback(char);
            });
            return;
        }
        if (operation == 'delete') {
            this.deleteCallbacks.forEach((item)=> {
                if (item.siteId == siteId) {
                    return;
                }
                item.callback(char);
            });
            return;
        }
        throw "unknown operation " + operation;
    }

    /**
     *
     * TODO(shirleyxt) check if siteid already exist
     * @param {*} siteId
     * @param {*} insertCallback
     * @param {*} deleteCallback
     * @memberof BroadCastService
     */
    registerController(siteId, insertCallback, deleteCallback) {
        this.insertCallbacks.push({
            siteId,
            callback: insertCallback,
        });
        this.deleteCallbacks.push({
            siteId,
            callback: deleteCallback,
        });
    }
};