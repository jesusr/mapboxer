import { expect } from 'chai';
import rewiremock from 'rewiremock';
import jsdom from 'mocha-jsdom';
import * as ERRORS from '../src/errors';
let MapBoxer;

class MapMock {
    constructor(opt) {
        this.created = true;
        this.opt = opt;
        this.evHandlers = [];
    }
    on(evName, fn) {
        this.evHandlers.push({ evName, fn });
    }
    triggerEvent(evName) {
        const toExecute = this.evHandlers.filter((o) => o.evName === evName);
        toExecute.forEach(o => o.fn());
    }
}
class LngLatMock {
    constructor(lng, lat) {
        return { lng, lat };
    }
}

class LngLatBoundsMock {
    constructor() {
        return {
            getCenter: () => { return { toArray: () => { return "centerArrayLngLat" } } }
        }
    }
}

rewiremock('mapbox-gl').with({
    Map: MapMock,
    LngLat: LngLatMock,
    LngLatBounds: LngLatBoundsMock
});

rewiremock.enable();

describe('Mapboxer', () => {
    jsdom({ url: 'http://localhost' });
    beforeEach(() => {
        rewiremock.enable()
        MapBoxer = require('../src/mapboxer').default;
    });
    it('Constructor without options', () => {
        expect(() => new MapBoxer()).to.throw(ERRORS.ERROR1);
    });
    it('Constructor with options but without container', () => {
        expect(() => new MapBoxer({ viewport: { center: [0, 0], zoom: 9 } })).to.throw(ERRORS.ERROR1);
    });
    it('Constructor without options but with string selector ', () => {
        document.body.appendChild(document.createElement('div'));
        const mapboxer = new MapBoxer({ 'container': 'div' });
        expect(mapboxer.options.container).to.be.instanceof(window.HTMLDivElement);
    });
    it('Constructor with options and dom element', () => {
        document.body.appendChild(document.createElement('div'));
        const mapboxer = new MapBoxer({ container: document.querySelectorAll('div')[0], viewport: { center: [0, 0], zoom: 9 } });
        expect(mapboxer.options.container).to.be.instanceof(window.HTMLDivElement);
    });
    it('Constructor with options and dom element, parsing the options', () => {
        document.body.appendChild(document.createElement('div'));
        const mapboxer = new MapBoxer({ container: document.querySelectorAll('div')[0], viewport: { center: [0, 0], zoom: 9 } });
        expect(mapboxer.options.viewport).to.be.deep.equal({ center: [0, 0], zoom: 9, radius: null, polygon: null });
    });
    it('Constructor with polygon, center and zoom', () => {
        document.body.appendChild(document.createElement('div'));
        const opt = {
            container: 'div',
            viewport: {
                center: [0, 0], zoom: 9,
                polygon: {
                    type: "FeatureCollection",
                    features: [
                        {
                            geometry: {
                                type: "MultiPolygon",
                                coordinates: [[[2.07786989, 41.40304214], [2.07756916, 41.40317249], [2.07438739, 41.40331326], [2.07786989, 41.40304214]]]
                            },
                            properties: {},
                            type: "Feature"
                        }]
                }
            }
        };
        const mapboxer = new MapBoxer(opt);
        expect(mapboxer.options.viewport.center).to.be.deep.equal(opt.viewport.center);
        expect(mapboxer.options.viewport.zoom).to.be.deep.equal(opt.viewport.zoom);
        expect(mapboxer.options.viewport.polygon).to.be.deep.equal(opt.viewport.polygon);
        expect(mapboxer.options.viewport.radius).to.be.null;
    });
    it('Constructor with polygon without center and zoom', () => {
        const el = {
            style: {
                width: '300px',
                height: '300px'
            },
            offsetHeight: 300,
            offsetWidth: 300,
            nodeType: 1
        };
        const opt = {
            container: el,
            viewport: {
                polygon: {
                    type: "FeatureCollection",
                    features: [
                        {
                            geometry: {
                                type: "MultiPolygon",
                                coordinates: [[[2.07786989, 41.40304214], [2.07756916, 41.40317249], [2.07438739, 41.40331326], [2.07786989, 41.40304214]]]
                            },
                            properties: {},
                            type: "Feature"
                        }]
                }
            }
        };
        const mapboxer = new MapBoxer(opt);
        expect(mapboxer.options.viewport.center).to.be.deep.equal('centerArrayLngLat'); // mock-calculated
        expect(mapboxer.options.viewport.zoom).to.be.deep.equal(16); // calculated
        expect(mapboxer.options.viewport.polygon).to.be.deep.equal(opt.viewport.polygon);
        expect(mapboxer.options.viewport.radius).to.be.null;
    });
    it('Constructor with center and radius', () => {
        const el = {
            style: {
                width: '300px',
                height: '300px'
            },
            offsetHeight: 300,
            offsetWidth: 300,
            nodeType: 1
        };
        const opt = {
            container: el,
            viewport: {
                center: [0, 0],
                radius: 1
            }
        };
        const circleExpected = require('./assets/circle-lng0-lat0-r1.json');
        const mapboxer = new MapBoxer(opt);
        expect(mapboxer.options.viewport.center).to.be.deep.equal(opt.viewport.center); // mock-calculated
        expect(mapboxer.options.viewport.zoom).to.be.deep.equal(14); // calculated
        expect(mapboxer.options.viewport.polygon).to.be.deep.equal(circleExpected);
        expect(mapboxer.options.viewport.radius).to.be.equal(1);
    });
    afterEach(() => rewiremock.disable());
});