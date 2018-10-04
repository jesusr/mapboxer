import * as MapboxGL from 'mapbox-gl';
import * as MapUtils from './mapUtils';
import { ERROR1, ERROR3 } from './errors';
import NamedMap from './namedMap';
import Source from './source';
const defaultValues = {
    center: [42, -1],
    zoom: 7
};
class MapBoxer {
    constructor(opt = {}) {
        this.sources = {};
        this.namedMaps = {};
        if (opt.container) {
            this.options = this.parseOptions(opt);
            this.map = this.initMap(this.options);
        } else {
            throw new Error(ERROR1);
        }
    }
    initMap(opt) {
        const map = new MapboxGL.Map(opt);
        map.on('load', () => {
            this.loadedOnce = true;
            this.initViewport();
        });
        return map;
    }
    initViewport() {
        this.cartoMapsInitialize().then(() => {
            this.sourcesInitialize();
        }).catch(() => {
            throw Error(ERROR3);
        });
    }
    parseOptions(opt) {
        opt.container = this.parseContainer(opt.container);
        opt.viewport = this.parseViewport(opt.viewport || {}, opt.container);
        return opt;
    }
    parseViewport(vp, container) {
        let view = {};
        if (vp.polygon || (vp.radius && vp.center)) {
            view = MapUtils.getCenterZoomFromGeoJson(vp.polygon
                || (vp.polygon = MapUtils.geojsonCircle(vp.center, vp.radius)), container);
        }
        return {
            center: vp.center || view.center || defaultValues.center,
            zoom: vp.zoom || view.zoom || defaultValues.zoom,
            radius: vp.radius || null,
            polygon: vp.polygon || null
        };
    }
    parseContainer(container) {
        container = isElement(container) ? container
            : (typeof container === 'string' ? getElementFromStr(container) : null);
        if (!container) throw new Error(ERROR1);
        return container;
    }
    cartoMapsInitialize() {
        return new Promise((res, rej) => {
            const proms = [];
            Object.keys(this.options.namedMaps).forEach((element) => {
                this.namedMaps[element] = new NamedMap(this.options.namedMaps[element]);
            });
            Object.keys(this.namedMaps).forEach((element) => {
                proms.push(this.namedMaps[element].update());
            });
            Promise.all(proms).then(() => {
                res();
            }).catch((err) => {
                rej(err);
            });
        });
    }
    sourcesInitialize() {
        Object.keys(this.options.sources || {}).forEach((element) => {
            this.sources[element] = [];
            this.options.sources[element].forEach((o) => {
                this.sources[element].push(new Source({
                    source: o,
                    tiles: this.namedMaps[element],
                    map: this.map
                }));
            });
        });
    }
}

function getElementFromStr(c) {
    return selectFromDom(c)[0];
}

function selectFromDom(selector) {
    let selectorType = 'querySelectorAll';
    const index = selector.indexOf('#');
    if (index === 0) {
        selectorType = 'getElementById';
        selector = selector.substr(1, selector.length);
    }
    return document[selectorType](selector);
}

function isElement(obj) {
    return !!(obj && obj.nodeType == 1);
}

export default MapBoxer;
