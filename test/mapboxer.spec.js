import { expect } from 'chai';
import rewiremock from 'rewiremock';
import jsdom from 'mocha-jsdom';
import sinon from 'sinon';
import * as ERRORS from '../src/errors';
import NamedMap from '../src/namedMap';
let MapBoxer;
const addSourceSpy = sinon.spy();
const xhr = sinon.useFakeXMLHttpRequest();
class MapMock {
    constructor(opt) {
        this.created = true;
        this.opt = opt;
        this.evHandlers = [];
    }
    on(evName, fn) {
        this.evHandlers.push({ evName, fn });
    }
    trigger(evName) {
        const toExecute = this.evHandlers.filter((o) => o.evName === evName);
        toExecute.forEach((o) => o.fn());
    }
    addSource() {
        addSourceSpy();
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
            getCenter: () => { return { toArray: () => { return 'centerArrayLngLat'; } }; }
        };
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
        rewiremock.enable();
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
        const mapboxer = new MapBoxer({ container: 'div' });
        expect(mapboxer.options.container).to.be.instanceof(window.HTMLDivElement);
    });
    it('Constructor with options and dom element', () => {
        document.body.appendChild(document.createElement('div'));
        const mapboxer = new MapBoxer({
            container: document.querySelectorAll('div')[0],
            viewport: { center: [0, 0], zoom: 9 }
        });
        expect(mapboxer.options.container).to.be.instanceof(window.HTMLDivElement);
    });
    it('Constructor with options and dom element, parsing the options', () => {
        document.body.appendChild(document.createElement('div'));
        const mapboxer = new MapBoxer({
            container: document.querySelectorAll('div')[0],
            viewport: { center: [0, 0], zoom: 9 }
        });
        expect(mapboxer.options.viewport).to.be.deep.equal({ center: [0, 0], zoom: 9, radius: null, polygon: null });
    });
    it('Constructor with polygon, center and zoom', () => {
        document.body.appendChild(document.createElement('div'));
        const opt = {
            container: 'div',
            viewport: {
                center: [0, 0], zoom: 9,
                polygon: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [
                                    [
                                        [2.07786989, 41.40304214],
                                        [2.07756916, 41.40317249],
                                        [2.07438739, 41.40331326],
                                        [2.07786989, 41.40304214]
                                    ]
                                ]
                            },
                            properties: {},
                            type: 'Feature'
                        }]
                }
            }
        };
        const mapboxer = new MapBoxer(opt);
        expect(mapboxer.options.viewport.center).to.be.deep.equal(opt.viewport.center);
        expect(mapboxer.options.viewport.zoom).to.be.deep.equal(opt.viewport.zoom);
        expect(mapboxer.options.viewport.polygon).to.be.deep.equal(opt.viewport.polygon);
        expect(mapboxer.options.viewport.radius).to.be.equal(null);
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
                    type: 'FeatureCollection',
                    features: [
                        {
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: [
                                    [
                                        [2.07786989, 41.40304214],
                                        [2.07756916, 41.40317249],
                                        [2.07438739, 41.40331326],
                                        [2.07786989, 41.40304214]
                                    ]
                                ]
                            },
                            properties: {},
                            type: 'Feature'
                        }]
                }
            }
        };
        const mapboxer = new MapBoxer(opt);
        expect(mapboxer.options.viewport.center).to.be.deep.equal('centerArrayLngLat'); // mock-calculated
        expect(mapboxer.options.viewport.zoom).to.be.deep.equal(16); // calculated
        expect(mapboxer.options.viewport.polygon).to.be.deep.equal(opt.viewport.polygon);
        expect(mapboxer.options.viewport.radius).to.be.equal(null);
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
    it('Named maps attached with url base', () => {
        document.body.appendChild(document.createElement('div'));
        const opt = { container: 'div', viewport: { center: [0, 0], zoom: 9 } };
        opt.namedMaps = {
            services: {
                baseUrl: 'https://carto.com/user/:user/api/v1/map/named/:name?auth_token=:token',
                user: 'user',
                name: 'name',
                token: 'token'
            }
        };
        const mapboxer = new MapBoxer(opt);
        mapboxer.map.trigger('load');
        expect(mapboxer.namedMaps.services).to.be.instanceof(NamedMap);
        expect(mapboxer.namedMaps.services.url).to.be
            .equal('https://carto.com/user/user/api/v1/map/named/name?auth_token=token');
    });
    it('Named maps attached without url base, gets the default base url', () => {
        document.body.appendChild(document.createElement('div'));
        const opt = { container: 'div', viewport: { center: [0, 0], zoom: 9 } };
        opt.namedMaps = {
            services: {
                user: 'user',
                name: 'name',
                token: 'token'
            }
        };
        const mapboxer = new MapBoxer(opt);
        mapboxer.map.trigger('load');
        expect(mapboxer.namedMaps.services).to.be.instanceof(NamedMap);
        expect(mapboxer.namedMaps.services.url).to.be
            .equal('https://carto.com/user/user/api/v1/map/named/name?auth_token=token');
    });
    it('Sources attached, autoadded or not', (done) => {
        const requests = [];
        xhr.onCreate = function (x) {
            requests.push(x);
        };
        const response = {
            layergroup: {
                metadata: {
                    tilejson: {
                        vector: {
                            tiles: ['a', 'b']
                        }
                    }
                }
            }
        };
        document.body.appendChild(document.createElement('div'));
        const opt = { container: 'div', viewport: { center: [0, 0], zoom: 9 } };
        opt.namedMaps = {
            services: { user: 'user', name: 'name', token: 'token' }
        };
        opt.sources = {
            services: [{
                id: 'services',
                type: 'vector',
                autoAdd: true
            }, {
                id: 'services2',
                type: 'geojson',
                autoAdd: false
            }]
        };
        const mapboxer = new MapBoxer(opt);
        mapboxer.map.trigger('load');
        requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response));
        setTimeout(() => {
            expect(mapboxer.sources.services.length).to.be.equal(2);
            expect(mapboxer.sources.services[0].added).to.be.equal(true);
            expect(mapboxer.sources.services[1].added).to.be.equal(false);
            done();
        }, 1000);
    });
    afterEach(() => {
        rewiremock.disable();
    });
});
