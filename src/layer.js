import { ERROR6 } from './errors';
export default class Layer {
    constructor(opt) {
        if (opt) this.parseOptions(opt); else throw new Error(ERROR6);
        if (this.opt.autoAdd) this.addLayer();
        return this;
    }
    parseOptions(opt) {
        this.opt = opt.layer;
        this.map = opt.map;
        this.added = false;
    }
    addLayer() {
        if (this.map.getSource(this.opt.source)) {
            this.map.addLayer(this.opt);
            this.added = true;
        }
    }
    removeLayer() {
        if (this.map.getLayer(this.opt.id)) {
            this.map.removeLayer(this.opt.id);
        }
    }
    getSourceName() {
        return this.opt.source;
    }
    getSourceLayer() {
        return this.opt['source-layer'];
    }
}
