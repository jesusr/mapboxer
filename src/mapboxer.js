import * as MapboxGL from 'mapbox-gl';
import * as MapUtils from './mapUtils';
import { ERROR1 } from './errors';
const defaultValues = {
    center: [42, -1],
    zoom: 7
};
class MapBoxer {
    constructor(opt = {}) {
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
        this.cartoMapsInitialize();
    }
    parseOptions(opt) {
        opt.container = this.parseContainer(opt.container);
        opt.viewport = this.parseViewport(opt.viewport || {}, opt.container);
        return opt;
    }
    parseViewport(vp, container) {
        let view = {};
        if (vp.polygon || (vp.radius && vp.center)) {
            view = MapUtils.getCenterZoomFromGeoJson(vp.polygon || (vp.polygon = MapUtils.geojsonCircle(vp.center, vp.radius)), container);
        }
        return {
            center: vp.center || view.center || defaultValues.center,
            zoom: vp.zoom || view.zoom || defaultValues.zoom,
            radius: vp.radius || null,
            polygon: vp.polygon || null
        };
    }
    parseContainer(container) {
        container = isElement(container) ? container : (typeof container === 'string' ? getElementFromStr(container) : null);
        if (!container) throw new Error(ERROR1);
        return container;
    }
    cartoMapsInitialize() {

    }
    loadNamedMapTiles(url, mapName, filter = {}) {
        return new Promise((resolve, reject) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filter), // builder named-maps has no parameter provider
            });
            if (response.status === 200) {
                const layergroup = await response.json();
                resolve(layergroup.metadata.tilejson.vector.tiles.map((url) => {
                    return url + '?auth_token=' + consts.CARTO_MAPS[mapName].CARTO_TOKEN;
                }));
            } else {
                reject(response);
            }
        }
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