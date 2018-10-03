import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';
import circle from '@turf/circle';

function getCenterZoomFromGeoJson(geojson, el) {
    // calculate the zoom level from given bounds
    const MapboxGL = require('mapbox-gl');
    const bounds = bboxFromPolygon(geojson);
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    function latRad(lat) {
        const sin = Math.sin(lat * Math.PI / 180);
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }
    // [minX, minY, maxX, maxY]
    const sw = new MapboxGL.LngLat(bounds[1], bounds[0]);
    const ne = new MapboxGL.LngLat(bounds[3], bounds[2]);

    const latFraction = (latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

    const lngDiff = ne.lng - sw.lng;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = zoom(el.offsetHeight, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(el.offsetWidth, WORLD_DIM.width, lngFraction);

    return {
        zoom: Math.min(latZoom, lngZoom, ZOOM_MAX),
        center: new MapboxGL.LngLatBounds(sw, ne).getCenter().toArray(),
    };
}

function bboxFromPolygon(geojson) {
    const json = geojson.type === 'FeatureCollection' ? geojson.features[0] : geojson;
    const geometry = json.geometry || json;
    if (!Array.isArray(geometry.coordinates[0][0][0])) {
        // TODO: if (json.geometry.type === 'MultiPolygon' && json.geometry.coordinates.length === 1) {
        geometry.type = 'Polygon';
    }
    return bbox(json);
}

function isPointInPolygon(point, polygon) {
    return booleanPointInPolygon(point, polygon);
}

function getPolygonFromBbox(bbox) {
    return bboxPolygon(bbox);
}

function isIntersectedPolygons(poly1, poly2) {
    return intersect(poly1, poly2);
}

function geojsonCircle(point, radius) {
    return circle(point, radius);
}

export {
    getCenterZoomFromGeoJson,
    isPointInPolygon,
    getPolygonFromBbox,
    isIntersectedPolygons,
    geojsonCircle,
    bboxFromPolygon
}
