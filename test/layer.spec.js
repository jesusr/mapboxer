import { expect, assert } from 'chai';
import sinon from 'sinon';
import * as ERRORS from '../src/errors';
let Layer;
class MapMock {
    constructor(opt) {
        this.created = true;
        this.opt = opt;
        this.evHandlers = [];
        this.addLayer = opt.addLayerSpy;
        this.removeLayer = opt.removeLayerSpy;
        this.getLayer = opt.getLayerSpy;
        this.getSource = opt.getSourceSpy;
    }
}

describe('Mapboxer Layer class', () => {
    beforeEach(() => {
        Layer = require('../src/layer').default;
    });
    it('Constructor without options should throw error', () => {
        expect(() => new Layer()).to.throw(ERRORS.ERROR6);
    });
    it('Constructor with options should store the options', () => {
        const addLayerSpy = sinon.spy();
        const removeLayerSpy = sinon.spy();
        const getSourceSpy = sinon.stub().returns(true);
        const getLayerSpy = sinon.stub().returns(true);
        const mapmock = new MapMock(addLayerSpy, removeLayerSpy, getSourceSpy, getLayerSpy);
        const options = {
            layer: {
                id: 'id1',
                source: 'source1',
                'source-layer': 'sourcelayer',
                type: 'circle',
                minzoom: 0,
                maxzoom: 16,
                layout: {},
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'red'
                }
            },
            map: mapmock
        };
        const layer = new Layer(options);
        expect(layer.added).to.be.equal(false);
        expect(layer.opt).to.be.equal(options.layer);
        expect(layer.map).to.be.instanceof(MapMock);
    });
    it('When the layer is added it should call map instance addLayer', () => {
        const addLayerSpy = sinon.spy();
        const removeLayerSpy = sinon.spy();
        const getSourceSpy = sinon.stub().returns(true);
        const getLayerSpy = sinon.stub().returns(true);
        const mapmock = new MapMock({ addLayerSpy, removeLayerSpy, getSourceSpy, getLayerSpy });
        const options = {
            layer: {
                id: 'id1',
                source: 'source1',
                'source-layer': 'sourcelayer',
                type: 'circle',
                minzoom: 0,
                maxzoom: 16,
                layout: {},
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'red'
                }
            },
            map: mapmock
        };
        const layer = new Layer(options);
        layer.addLayer();
        assert(addLayerSpy.calledWith(options.layer));
    });
    it('When the layer is register with autoAdd it should call map instance addLayer', () => {
        const addLayerSpy = sinon.spy();
        const removeLayerSpy = sinon.spy();
        const getSourceSpy = sinon.stub().returns(true);
        const getLayerSpy = sinon.stub().returns(true);
        const mapmock = new MapMock({ addLayerSpy, removeLayerSpy, getSourceSpy, getLayerSpy });
        const options = {
            layer: {
                id: 'id1',
                source: 'source1',
                'source-layer': 'sourcelayer',
                type: 'circle',
                minzoom: 0,
                maxzoom: 16,
                layout: {},
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'red'
                },
                autoAdd: true
            },
            map: mapmock
        };
        const layer = new Layer(options);
        expect(layer.opt).to.be.deep.equal(options.layer);
        assert(addLayerSpy.calledWith(options.layer));
    });
    it('When the layer is remove it should call map instance removeLayer', () => {
        const addLayerSpy = sinon.spy();
        const removeLayerSpy = sinon.spy();
        const getSourceSpy = sinon.stub().returns(true);
        const getLayerSpy = sinon.stub().returns(true);
        const mapmock = new MapMock({ addLayerSpy, removeLayerSpy, getSourceSpy, getLayerSpy });
        const options = {
            layer: {
                id: 'id1',
                source: 'source1',
                'source-layer': 'sourcelayer',
                type: 'circle',
                minzoom: 0,
                maxzoom: 16,
                layout: {},
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'red'
                },
                autoAdd: true
            },
            map: mapmock
        };
        const layer = new Layer(options);
        expect(layer.opt).to.be.deep.equal(options.layer);
        assert(addLayerSpy.calledWith(options.layer));
        layer.removeLayer();
        assert(removeLayerSpy.calledWith(options.layer.id));
    });
    it('When a non-added layer is removed it shouldn`t call map instance removeLayer', () => {
        const addLayerSpy = sinon.spy();
        const removeLayerSpy = sinon.spy();
        const getSourceSpy = sinon.stub().returns(false);
        const getLayerSpy = sinon.stub().returns(false);
        const mapmock = new MapMock({ addLayerSpy, removeLayerSpy, getSourceSpy, getLayerSpy });
        const options = {
            layer: {
                id: 'id1',
                source: 'source1',
                'source-layer': 'sourcelayer',
                type: 'circle',
                minzoom: 0,
                maxzoom: 16,
                layout: {},
                paint: {
                    'circle-radius': 5,
                    'circle-color': 'red'
                }
            },
            map: mapmock
        };
        const layer = new Layer(options);
        layer.addLayer();
        expect(layer.added).to.be.equal(false);
        layer.removeLayer();
        assert(removeLayerSpy.notCalled);
    });
});
