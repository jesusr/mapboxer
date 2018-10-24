
import * as unkinkPolygon from '@turf/unkink-polygon';
import * as turfHelper from '@turf/helpers';
import * as cleanCoords from '@turf/clean-coords';
import EventBus from '../eventBus';

class PolygonLayer {
    constructor(map, opt) {
        this.opt = this.parseOptions(opt);
        this.map = map;
    }

    parseOptions(opt) {
        if (!opt) {
            return {
                fillLayer: {
                    id: 'fill',
                    type: 'fill',
                    source: 'fill_source',
                    paint: {
                        'fill-opacity': 0.1,
                        'fill-outline-color': 'red'
                    }
                },
                lineLayer: {
                    id: 'line',
                    type: 'line',
                    source: 'line_source',
                    paint: {
                        'line-color': '#e5005a',
                        'line-width': 2
                    }
                }
            };
        }
    }

    addPolygon(geojson, fromDraw) {
        this.drawLine(geojson);
        this.drawPolygon(geojson);
        if (fromDraw) EventBus.fire('addedDrawnPolygon', { geojson });
        else EventBus.fire('addedPolygon');
    }

    drawPolygon(geojson) {
        // to handle if it is a multipolygon
        let poly = geojson;
        try {
            poly = unkinkPolygon.default(geojson);
        } catch (e) {
            poly = geojson;
        }

        // polygon fill: if there is a polygon it already exists
        if (!this.map.getSource('fill_source')) {
            this.map.addSource('fill_source', { type: 'geojson', data: poly });
            this.map.addLayer(this.opt.fillLayer);
        } else {
            this.map.getSource('fill_source').setData(poly);
        }
    }

    drawLine(geojson) {
        // border line: if there is a polygon it already exists
        if (!this.map.getSource('line_source')) {
            this.map.addSource('line_source', { type: 'geojson', data: geojson });
            this.map.addLayer(this.opt.lineLayer);
        } else {
            this.map.getSource('line_source').setData(geojson);
        }
    }

    removePolygon() {
        if (this.map.getLayer('fill')) {
            this.map.removeLayer('fill');
        }
        if (this.map.getLayer('line')) {
            this.map.removeLayer('line');
        }
        if (this.map.getSource('line_source')) {
            this.map.removeSource('line_source');
        }
        if (this.map.getSource('fill_source')) {
            this.map.removeSource('fill_source');
        }
        EventBus.fire('removePolygonFreeDraw');
    }
    startDraw() {
        this.geoJsonCoord = [];
        this.removePolygon();
        EventBus.fire('startFreeDraw');
    }
    draw(point) {
        this.geoJsonCoord.push(point);
        if (this.geoJsonCoord.length > 1) {
            const geoJsonLine = turfHelper.lineString(this.geoJsonCoord);
            this.drawLine(geoJsonLine);
        }
    }

    endDraw(callback) {
        if (this.geoJsonCoord.length > 1) {
            this.geoJsonCoord.push(this.geoJsonCoord[0]);
            const geojsonFill = turfHelper.polygon([this.geoJsonCoord]);
            this.addPolygon(cleanCoords.default(geojsonFill), true);
            if (callback) {
                callback(geojsonFill);
            }
            EventBus.fire('endFreeDraw');
        }
    }

}
export default PolygonLayer;
