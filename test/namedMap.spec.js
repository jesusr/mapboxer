import { expect, assert } from 'chai';
import sinon from 'sinon';
import * as ERRORS from '../src/errors';
let NamedMap;

describe('Mapboxer NamedMap class', () => {
    beforeEach(() => {
        NamedMap = require('../src/namedMap').default;
    });
    it('Constructor without options should throw error', () => {
        expect(() => new NamedMap()).to.throw(ERRORS.ERROR2);
    });
    it('When a registered named map is updated, should get tiles url and add the token', (done) => {
        const requestNamedMapStub = sinon.stub(NamedMap.prototype, 'requestNamedMap')
            .resolves({
                json: function () {
                    return {
                        metadata: {
                            tilejson: {
                                raster: { tiles: ['url1', 'url2'] },
                                vector: { tiles: ['url1', 'url2'] }
                            }
                        }
                    };
                }
            });
        const namedMapInstance = new NamedMap({
            user: 'user',
            name: 'name',
            token: 'token'
        });
        namedMapInstance.update().then(() => {
            assert(requestNamedMapStub.calledWith({}));
            expect(namedMapInstance.options).to.be.deep.equal(
                {
                    user: 'user',
                    name: 'name',
                    token: 'token',
                    baseUrl: 'https://carto.com/user/:user/api/v1/map/named/:name?auth_token=:token'
                });
            expect(namedMapInstance.tilejson).to.be.deep.equal(
                {
                    vector: { tiles: ['url1?auth_token=token', 'url2?auth_token=token'] },
                    raster: { tiles: ['url1?auth_token=token', 'url2?auth_token=token'] }
                });
            done();
            requestNamedMapStub.restore();
        });
    });
    it.only('When a registered named map is updated with new options', (done) => {
        const requestNamedMapStub = sinon.stub(NamedMap.prototype, 'requestNamedMap')
            .resolves({
                json: function () {
                    return {
                        metadata: {
                            tilejson: {
                                raster: { tiles: ['url1', 'url2'] },
                                vector: { tiles: ['url1', 'url2'] }
                            }
                        }
                    };
                }
            });
        const namedMapInstance = new NamedMap({
            user: 'user',
            name: 'name',
            token: 'token'
        });
        namedMapInstance.update().then(() => {
            namedMapInstance.update({ user: 'user', name: 'name', token: 'token', filter: ['id', '0'] }).then(() => {
                assert(requestNamedMapStub.calledWith(['id', '0']), '["id", "0"]');
                expect(namedMapInstance.options).to.be.deep.equal(
                    {
                        user: 'user',
                        name: 'name',
                        token: 'token',

                        baseUrl: 'https://carto.com/user/:user/api/v1/map/named/:name?auth_token=:token'
                    });
                expect(namedMapInstance.tilejson).to.be.deep.equal(
                    {
                        vector: { tiles: ['url1?auth_token=token', 'url2?auth_token=token'] },
                        raster: { tiles: ['url1?auth_token=token', 'url2?auth_token=token'] }
                    });
                done();
                namedMapInstance.restore();
            });
        });
    });
});
