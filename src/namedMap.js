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
        this.filter = opt.filter;
    }
    update(newOpt) {
        this.tilejson = null;
        this.parseOptions(newOpt);
        return this.getTilejson();
    }
    getTilejson() {
        return new Promise((res, rej) => {
            if (this.tilejson) return res(this.tilejson);
            this.loadNamedMap().then((tilejson) => {
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
            fetch(this.getNamedMapUrl(this.options.name), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filter)
            }).then((response) => {
                this.parseNamedMapResponse(response, resolve, reject);
            });
        });
    }
    parseNamedMapResponse(response, resolve, reject) {
        if (response.status === 200) {
            const layergroup = response.json();
            resolve(layergroup.metadata.tilejson.vector.tiles.map((url) => {
                return `${url}?auth_token=${this.options.token}`;
            }));
        } else {
            reject(response);
        }
    }
}
