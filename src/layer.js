export default class Layer {
    constructor(opt) {
        this.opt = opt.layer;
        this.map = opt.map;
        this.added = false;
        if (this.opt.autoAdd) {
            this.addLayer();
        }
        return this;
    }
    addLayer() {
        if (this.map.getSource(this.opt.source)) {
            this.map.addLayer(this.opt);
            this.added = true;
        }
    }
    removeLayer() {
        if (this.map.getLayer(this.opt.name)) {
            this.map.removeSource(this.opt.name);
        }
    }
}
