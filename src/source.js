export default class Source {
    constructor(opt) {
        this.opt = opt.source;
        this.tiles = opt.tiles;
        this.map = opt.map;
        this.added = false;
        if (this.opt.autoAdd) {
            this.addSource();
        }
        return this;
    }
    addSource() {
        this.map.addSource(this.opt.name, {
            type: this.opt.type,
            tiles: this.tiles,
            minZoom: this.opt.minZoom || 0,
            maxZoom: this.opt.maxZoom || 23
        });
        this.added = true;
    }
    removeSource() {
        if (this.map.getSource(this.opt.name)) {
            this.map.removeSource(this.opt.name);
        }
    }
}
