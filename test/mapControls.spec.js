import { expect } from 'chai';
import sinon from 'sinon';
import jsdom from 'mocha-jsdom';
let MapControls;
class MapMock {
    constructor(opt = {}) {
        this.created = true;
        this.opt = opt;
        this.evHandlers = [];
        this.addLayer = opt.addLayerSpy;
        this.removeLayer = opt.removeLayerSpy;
        this.getLayer = opt.getLayerSpy;
        this.getSource = opt.getSourceSpy;
    }
}

describe('Mapboxer MapControls class', () => {
    describe('FreeDraw component', () => {
        jsdom({ url: 'http://localhost' });
        beforeEach(() => {
            MapControls = require('../src/mapControls');
        });
        it('Constructor without options should create component with default configuration', () => {
            const mapmock = new MapMock();
            expect(new MapControls.FreeDraw().onAdd(mapmock));
        });
        it('Constructor with options should create component with custom configuration', () => {
            const mapmock = new MapMock();
            const options = {
                config: {
                    button: {
                        class: 'freedraw-custom-class',
                        width: '100px',
                        height: '100px',
                        background: {
                            color: '#333'
                        },
                        text: {
                            size: '30px',
                            color: 'red',
                            text: 'FD'
                        }
                    },
                    populateFilteredFeatures: {
                        active: true,
                        layers: ['points']
                    }
                },
                position: 'top-right'
            };
            const freedraw = new MapControls.FreeDraw(options);
            freedraw.onAdd(mapmock);
            expect(freedraw.options).to.be.deep.equal(options);
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
        });
        it('Constructor with options should create component with custom configuration', () => {
            const mapmock = new MapMock();
            const options = {
                config: {
                    button: {
                        class: 'freedraw-custom-class',
                        width: '100px',
                        height: '100px',
                        background: {
                            color: '#333'
                        },
                        text: {
                            size: '30px',
                            color: 'red',
                            text: 'FD'
                        }
                    },
                    populateFilteredFeatures: {
                        active: true,
                        layers: ['points']
                    }
                },
                position: 'top-right'
            };
            const freedraw = new MapControls.FreeDraw(options);
            freedraw.onAdd(mapmock);
            expect(freedraw.options).to.be.deep.equal(options);
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
        });
    });
});
