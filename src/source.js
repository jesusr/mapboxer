import { ERROR4, ERROR5 } from './errors';
export default class Source {
    constructor(opt = {}) {
        this.opt = opt.source || {};
        this.tiles = opt.tiles;
        this.map = opt.map || null;
        this.added = false;
        if (!this.opt.name || !this.opt.type) throw new Error(ERROR4);
        if (this.opt.autoAdd) this.addSource();
        return this;
    }
    addSource() {
        if (!(this.tiles && this.tiles[this.opt.type] && this.map)) throw new Error(ERROR5);
        this.map.addSource(this.opt.name, {
            type: this.opt.type,
            tiles: this.tiles[this.opt.type].tiles,
            visibility: 'visible',
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
