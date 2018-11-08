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
        this.on = opt.onSpy;
        this.dragPan = {
            enable: () => { return; },
            disable: () => { return; }
        };
    }
    getCanvas() {
        return { style: {} };
    }
    getContainer() {
        return { focus: () => null };
    }
    trigger(evName) {
        const toExecute = this.evHandlers.filter((o) => o.evName === evName);
        toExecute.forEach((o) => o.fn());
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
        it('Constructor with options, add and remove should create component with custom configuration', () => {
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
            // Force parentNode on container
            const parentNode = document.createElement('div');
            parentNode.appendChild(freedraw.container);
            freedraw.onRemove(mapmock);
            expect(freedraw.map).to.be.deep.equal(null);
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
        });
        it('Constructor with options, add and remove should create component without parentNode', () => {
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
            // Force parentNode on container
            freedraw.onRemove(mapmock);
            expect(freedraw.map).to.be.deep.equal(null);
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
        });
        it('Constructor with options, add and remove mantaining the draw active (body class)', () => {
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
            // Force parentNode on container
            const event = new window.MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            freedraw.container.dispatchEvent(event);
            freedraw.container.dispatchEvent(event);
            freedraw.container.dispatchEvent(event);
            freedraw.onRemove(mapmock);
            expect(freedraw.map).to.be.deep.equal(null);
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
        });
        it('Constructor with options, add and remove mantaining the draw active (body class)', () => {
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
            // Force parentNode on container
            const event = new window.MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            freedraw.container.dispatchEvent(event);
            freedraw.container.dispatchEvent(event);
            freedraw.container.dispatchEvent(event);
            freedraw.onRemove(mapmock);
            expect(freedraw.map).to.be.deep.equal(null);
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
        });
        it('When mouseDown event, touchmove/mousemove should register and call startDraw', () => {
            const onSpy = sinon.spy();
            const mapmock = new MapMock({ onSpy });
            const polygonLayer = {
                startDraw: sinon.spy()
            };
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
            const freedraw = new MapControls.FreeDraw(options, polygonLayer);
            freedraw.onAdd(mapmock);
            // Force mousedown fired
            freedraw.onMouseDown();
            expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
            expect(polygonLayer.startDraw.calledOnce).to.be.equal(true);
            expect(onSpy.calledTwice).to.be.equal(true);
        });

        /* it('When mouseUp event, touchmove/mousemove should deregister events', (done) => {
            const onSpy = sinon.spy(), offSpy = sinon.spy();
            MapMock.prototype.off = () => { offSpy(); };
            const mapmock = new MapMock({ onSpy });
            const polygonLayer = {
                startDraw: sinon.spy(),
                endDraw: sinon.spy(),
                removePolygon: sinon.spy()
            };
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
            const freedraw = new MapControls.FreeDraw(options, polygonLayer);
            setTimeout(() => {
                freedraw.onAdd(mapmock);
                freedraw.active = true;
                // Force mousedown fired
                freedraw.onMouseDown();
                document.dispatchEvent(new window.Event('mouseup'));
                setTimeout(() => {
                    expect(freedraw.container).to.be.instanceof(window.HTMLDivElement);
                    expect(polygonLayer.startDraw.calledOnce).to.be.equal(true);
                    expect(polygonLayer.endDraw.calledOnce).to.be.equal(true);
                    expect(offSpy.getCalls().length).to.be.equal(14);
                    done();
                }, 2000);
            }, 2000);
        }, 4000); */
    });
});
