import { ERROR2 } from './errors';
const defaultValue = {
    baseUrl: 'https://carto.com/user/:user/api/v1/map/named/:name?auth_token=:token'
};
export default class NamedMap {
    constructor(opt) {
        if (!opt) throw new Error(ERROR2);
        this.parseOptions(opt);
    }
    parseOptions(opt) {
        this.options = opt;
        this.options.baseUrl = this.options.baseUrl || defaultValue.baseUrl;
        this.url = this.setUrl();
        this.filter = this.options.filter;
    }
    update(newOpt) {
        if (newOpt) {
            this.parseOptions(newOpt);
            this.tilejson = null;
        }
        return this.getTilejson();
    }
    getTilejson() {
        return new Promise((res, rej) => {
            if (this.tilejson) return res(this.tilejson);
            this.loadNamedMap(this.filter).then((tilejson) => {
                this.tilejson = tilejson;
                return res(tilejson);
            }).catch((err) => {
                return rej(err);
            });
        });
    }
    setUrl() {
        return this.options.baseUrl.replace(':user', this.options.user)
            .replace(':name', this.options.name).replace(':token', this.options.token);
    }
    loadNamedMap(filter = {}) {
        return new Promise((resolve, reject) => {
            this.requestNamedMap(filter)
                .catch((err) => reject(err))
                .then((data) => data.json())
                .then((data) => resolve(this.parseNamedMapResponse(data)))
                .catch((err) => reject(err));
        });
    }
    requestNamedMap(filter) {
        return fetch(this.url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filter)
        });
    }
    parseNamedMapResponse(response) {
        if (response.metadata.tilejson.vector && response.metadata.tilejson.vector.tiles) {
            response.metadata.tilejson.vector.tiles = response.metadata.tilejson.vector.tiles.map((url) => {
                return this.options.token ? `${url}?auth_token=${this.options.token}` : url;
            });
        }
        if (response.metadata.tilejson.raster && response.metadata.tilejson.raster.tiles) {
            response.metadata.tilejson.raster.tiles = response.metadata.tilejson.raster.tiles.map((url) => {
                return this.options.token ? `${url}?auth_token=${this.options.token}` : url;
            });
        }
        return response.metadata.tilejson;
    }
}
