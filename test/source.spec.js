import { expect, assert } from 'chai';
import sinon from 'sinon';
import * as ERRORS from '../src/errors';
let Source;
class MapMock {
    constructor(opt) {
        this.created = true;
        this.opt = opt;
        this.evHandlers = [];
        this.addSource = opt.addSourceSpy;
    }
}

describe('Mapboxer Source class', () => {
    beforeEach(() => {
        Source = require('../src/source').default;
    });
    it('Constructor without options should throw error', () => {
        expect(() => new Source()).to.throw(ERRORS.ERROR4);
    });
    it('Constructor with options but without tiles or tiles, when added, should throw error', () => {
        expect(() => new Source({ source: { type: 'vector', name: 'nameExample' } })
            .addSource()).to.throw(ERRORS.ERROR5);
    });
    it('Constructor with options, map and tiles, when added, should call map instance addSource', () => {
        const addSourceSpy = sinon.spy();
        const mapmock = new MapMock({ addSourceSpy });
        const options = {
            map: mapmock,
            tiles: { vector: { tiles: ['url1', 'url2'] } },
            source: { type: 'vector', name: 'nameExample' }
        };
        const sourceInstance = new Source(options);
        sourceInstance.addSource();
        assert(addSourceSpy.calledWith(options.source.name, {
            type: options.source.type,
            tiles: options.tiles[options.source.type].tiles,
            visibility: 'visible',
            minZoom: 0,
            maxZoom: 23
        }));
    });
});
