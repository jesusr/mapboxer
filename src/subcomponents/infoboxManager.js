import Infobox from './infobox';

class InfoboxManager {

    /**
     * InfoboxManager descriptor
     * @param {*} opt
     * limit n {number} of infoboxes allowed
     */
    constructor() {
        this.infoboxes = [];
    }
    options(opt) {
        this.opt = opt;
    }
    open(feature, opt) {
        // control duplicate infobox
        const filtered = this.infoboxes.filter((o) => o.feature === feature);
        if (filtered.length > 0) {
            // TODO: here we can see if options has been changed and go to
            // modify the infobox options without recreate (update)
            return;
        }
        if (this.infoboxes.length >= this.opt.limit) {
            this.infoboxes.shift().destroy();
        }
        return this.infoboxes.push(new Infobox(feature, opt || this.opt));
    }
}

export default new InfoboxManager();
