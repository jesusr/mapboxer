import * as MapboxGL from 'mapbox-gl';
import * as MapUtils from './mapUtils';
import { ERROR1, ERROR3 } from './errors';
import NamedMap from './namedMap';
import Source from './source';
import Layer from './layer';
import PolygonLayer from './subcomponents/polygonLayer';
import EventBus from './eventBus';
import * as MapControls from './mapControls';

const defaultValues = {
    center: [42, -1],
    zoom: 7
};
class MapBoxer {
    constructor(opt = {}) {
        this.sources = {};
        this.layers = {};
        this.namedMaps = {};
        if (opt.container) {
            this.options = this.parseOptions(opt);
            this.map = this.initMap(this.options);
        } else {
            throw new Error(ERROR1);
        }
    }
    initMap(opt) {
        const map = new MapboxGL.Map({
            container: opt.container,
            style: opt.style,
            zoom: opt.viewport.zoom,
            center: opt.viewport.center,
            minZoom: opt.minZoom,
            maxZoom: opt.maxZoom,
            interactive: !opt.interactiveDisabled,
            scrollZoom: !opt.scrollZoomDisabled
        });
        map.on('load', () => {
            this.loadedOnce = true;
            this.initEvents();
            this.initBaseLayer(map);
            this.initControls();
            this.initViewport();
        });
        return map;
    }
    initEvents() {
        if (this.options.filterProperties) {
            this.on('removePolygonFreeDraw', () => {
                this.options.filterProperties.layers.forEach((l) => {
                    this.map.setFilter(l.layer, null);
                });
            });
            this.on('filteredPropertiesInPolygon', (list) => {
                this.options.filterProperties.layers.forEach((l) => {
                    this.map.setFilter(l.layer, buildFilterProperties(l, list));
                });
            }, this);
        }
    }
    initBaseLayer(map) {
        this.baseLayer = null;
        if (this.options.controls.freedraw || this.options.viewport.polygon) {
            this.baseLayer = new PolygonLayer(map);
            if (this.options.viewport.polygon) {
                this.baseLayer.addPolygon(this.options.viewport.polygon);
            }
        }
        this.triggerEvent('baseLayerLoaded');
    }
    initControls() {
        this.controls = {};
        Object.keys(this.options.controls || {}).forEach((o) => {
            switch (o) {
            case 'zoom':
            case 'navigation':
                this.controls[o] = new MapboxGL.NavigationControl(this.options.controls[o].config);
                break;
            case 'freedraw':
                this.controls[o] = new MapControls.FreeDraw(this.options.controls[o].config, this.baseLayer);
                break;
            default:
                return;
            }
            this.map.addControl(this.controls[o], this.options.controls[o].position);
        });
        this.triggerEvent('ControlsLoaded');
    }
    initViewport() {
        this.cartoMapsInitialize().then(() => {
            this.sourcesInitialize();
            this.layerInitialize();
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
            console.log(vp.zoom);
            console.log(view.zoom);
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
                this.triggerEvent('cartoMapsLoaded');
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
                    tiles: this.namedMaps[element].tilejson,
                    map: this.map
                }));
            });
        });
        this.triggerEvent('SourcesLoaded');
    }
    layerInitialize() {
        Object.keys(this.options.layers || {}).forEach((element) => {
            this.layers[element] = [];
            this.options.layers[element].forEach((o) => {
                this.layers[element].push(new Layer({
                    layer: o,
                    map: this.map
                }));
            });
        });
        this.triggerEvent('LayersLoaded');
    }
    triggerEvent(event) {
        EventBus.fire(event);
    }
    on(ev, fn, ctx) {
        EventBus.register(ev, fn, ctx);
        return this;
    }
}

function buildFilterProperties(l, props) {
    const toRet = ['in', l.field];
    props.forEach((o) => {
        toRet.push(o.properties[l.field]);
    });
    return toRet;
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
