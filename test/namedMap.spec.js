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
                    vector: { tiles: ['url1?auth_token=token', 'url2?auth_token=token'] }
                });
            done();
            requestNamedMapStub.restore();
        });
    });
    it('When a registered named map is updated with new options', (done) => {
        const requestNamedMapStub = sinon.stub(NamedMap.prototype, 'requestNamedMap')
            .resolves({
                json: function () {
                    return {
                        metadata: {
                            tilejson: {
                                raster: { tiles: ['url1', 'url2'] }
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
        const filterArr = ['id', '0'];
        namedMapInstance.update().then(() => {
            namedMapInstance.update({ user: 'user', name: 'name', token: 'token', filter: filterArr }).then(() => {
                assert(requestNamedMapStub.calledWith(filterArr), '["id", "0"]');
                expect(namedMapInstance.options).to.be.deep.equal(
                    {
                        user: 'user',
                        name: 'name',
                        token: 'token',
                        filter: filterArr,
                        baseUrl: 'https://carto.com/user/:user/api/v1/map/named/:name?auth_token=:token'
                    });
                expect(namedMapInstance.tilejson).to.be.deep.equal(
                    {
                        raster: { tiles: ['url1?auth_token=token', 'url2?auth_token=token'] }
                    });
                done();
                requestNamedMapStub.restore();
            });
        });
    });
    it('When a registered named map is updated without new options', (done) => {
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
            name: 'name'
        });
        namedMapInstance.update().then(() => {
            namedMapInstance.update().then(() => {
                expect(namedMapInstance.options).to.be.deep.equal(
                    {
                        user: 'user',
                        name: 'name',
                        baseUrl: 'https://carto.com/user/:user/api/v1/map/named/:name?auth_token=:token'
                    });
                expect(namedMapInstance.tilejson).to.be.deep.equal(
                    {
                        vector: { tiles: ['url1', 'url2'] },
                        raster: { tiles: ['url1', 'url2'] }
                    });
                done();
                requestNamedMapStub.restore();
            });
        });
    });
    it('When a registered named map is updated and there is no response (catch error)', (done) => {
        const requestNamedMapStub = sinon.stub(NamedMap.prototype, 'requestNamedMap')
            .rejects('error message');
        const namedMapInstance = new NamedMap({
            user: 'user',
            name: 'name',
            token: 'token'
        });
        namedMapInstance.update().catch((e) => {
            expect(e).to.be.instanceof(Error);
            done();
            requestNamedMapStub.restore();
        });
    });
});
