// import { MapDrawMessage } from './MapDraw/MapDrawMessage';
import bbox from '@turf/bbox';

import * as turfHelper from '@turf/helpers';
// import pointsWithinPolygon from '@turf/points-within-polygon';
import * as MapUtils from '../mapUtils';
import { PolygonLayer } from '../PolygonLayer';

interface IMapDraw {
  active: boolean;
  eventsFnRef: any;
  actions: any;
  map: any;
  container: any;
  eventClick: any;
  containerMessage: any;
  textField: any;
  mapComp: any;
  modalDraw?: boolean;
}

class MapDraw implements IMapDraw {
  public active: boolean;
  public drawing: boolean;
  public eventsFnRef: any;
  public actions: any;
  public map: any;
  public container: any;
  public eventClick: any;
  public containerMessage: any;
  public textField: any;
  public polygonLayer: PolygonLayer;
  public poly: any;
  public mapComp: any;
  public modalDraw?: boolean;

  public constructor(actions, textField, polygon, mapComp, modalDraw) {
    this.active = false;
    this.polygonLayer = polygon;
    this.mapComp = mapComp;

    this.onAdd = this.onAdd;
    this.onRemove = this.onRemove;
    this.eventsFnRef = {
      mouseDown: this.onMouseDown.bind(this),
      mouseUp: this.onMouseUp.bind(this),
      mouseMove: this.draw.bind(this),
    };
    this.actions = actions;
    this.textField = textField;
    this.modalDraw = modalDraw;

    document.addEventListener('mouseup', () => {
      const prevActive = this.active;
      setTimeout((prevActive) => {
        if (this.active === true && prevActive === true) {
          this.poly = null;
          this.onMouseUp(false);
          this.disableDrawMode();
          this.polygonLayer.removePolygon();
        }
      }, 0, prevActive);
    });
  }

  private onAdd(map) {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'map-draw mapboxgl-ctrl';
    this.registerListeners();
    return this.container;
  }

  private onRemove() {
    if (this.container && this.container.parentNode) {
      if (document.body.classList.contains('active-draw')) {
        document.body.classList.remove('active-draw');
      }
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
  }

  private registerListeners() {
    this.eventClick = this.container.addEventListener('click', this.evClickHandler.bind(this));
  }

  private toggleMessage(v) {
    if (v) {
      if (!this.containerMessage) {
        this.polygonLayer.removePolygon();
        this.containerMessage = document.createElement('div');
        this.containerMessage.className = `map-draw-message`;
        const textElem = document.createElement('p');
        textElem.textContent = this.textField || '';
        this.containerMessage.appendChild(textElem);
      }
      this.map.getContainer().appendChild(this.containerMessage);
    } else {
      if (this.containerMessage && this.map.getContainer().contains(this.containerMessage)) {
        this.map.getContainer().removeChild(this.containerMessage);
      }
    }
  }

  private evClickHandler(e?) {
    this.active = !this.active;
    if (e) {
      this.toggleMessage(this.active);
    }
    this.container.className = `map-draw mapboxgl-ctrl ${this.active ? 'active' : ''}`;
    this.map.getContainer().focus();
    this.actions.mapResultsDrawControlClick(this.active);
    this.deactivatePoisClick();

    // Modified: Launch custom dispatch for analytics tracking
    if (typeof e === 'object' && e.type === 'click' && this.active) {
      this.actions.dataLayerMapDrawClick();
    }

    return this.active ? this.drawMode() : this.drawDeactive();
  }

  public disableDrawMode() {
    this.active = false;
    this.toggleMessage(this.active);
    this.container.className = `map-draw mapboxgl-ctrl ${this.active ? 'active' : ''}`;
    this.actions.mapResultsDrawControlClick(this.active);
    return this.drawDeactive();
  }

  public drawDeactive() {
    this.showLayers();
    this.map.dragPan.enable();
    document.body.classList.remove('active-draw');
    this.map.getCanvas().style.cursor = '';
    this.map.off('touchstart', this.eventsFnRef.mouseDown);
    this.map.off('mousedown', this.eventsFnRef.mouseDown);
    this.map.off('touchend', this.eventsFnRef.mouseUp);
    this.map.off('mouseup', this.eventsFnRef.mouseUp);
    this.activatePoisClick();
  }

  public activatePoisClick() {
    setTimeout(() => {
      if (this.map) {
        this.map.on('click', 'pois', this.mapComp.clickPois);
        this.map.on('click', 'pois_price', this.mapComp.clickPoisPrice);
        this.map.on('click', 'pois_price_selected', this.mapComp.clickPoisPriceSelected);
        this.map.on('click', 'agg', this.mapComp.clickOnCluster);
      }
    }, 200);
  }

  public deactivatePoisClick() {
    if (this.map) {
      this.map.off('click', 'pois', this.mapComp.clickPois);
      this.map.off('click', 'pois_price', this.mapComp.clickPoisPrice);
      this.map.off('click', 'pois_price_selected', this.mapComp.clickPoisPriceSelected);
      this.map.off('click', 'agg', this.mapComp.clickOnCluster);
    }
  }

  public drawMode() {
    this.hideLayers();
    this.map.dragPan.disable();
    document.body.classList.add('active-draw');
    this.map.getCanvas().style.cursor = 'crosshair';
    if (this.drawing) {
      this.polygonLayer.removePolygon();
    }
    this.map.on('touchstart', this.eventsFnRef.mouseDown);
    this.map.on('mousedown', this.eventsFnRef.mouseDown);
    this.map.on('touchend', this.eventsFnRef.mouseUp);
    this.map.on('mouseup', this.eventsFnRef.mouseUp);
  }

  private onMouseDown() {
    this.map.on('touchmove', this.eventsFnRef.mouseMove);
    this.map.on('mousemove', this.eventsFnRef.mouseMove);
    this.polygonLayer.startDraw();
    this.toggleMessage(false);
  }

  private onMouseUp(populateFeatures = true) {
    this.showLayers();
    this.map.off('touchmove', this.eventsFnRef.mouseMove);
    this.map.off('mousemove', this.eventsFnRef.mouseMove);

    this.polygonLayer.endDraw((poly) => { this.poly = poly; });
    this.drawing = true;
    this.evClickHandler();
    this.map.off('touchstart', this.eventsFnRef.mouseDown);
    this.map.off('mousedown', this.eventsFnRef.mouseDown);
    this.map.off('touchend', this.eventsFnRef.mouseUp);
    this.map.off('mouseup', this.eventsFnRef.mouseUp);
    this.map.dragPan.enable();
    if (this.poly && populateFeatures) {
      this.populateFeaturesInPolygon(this.poly);
    }
  }

  public setVisibility(val) {
    this.container = document.querySelector('.map-draw.mapboxgl-ctrl') || this.container;
    if (val) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }

  protected showLayers() {
    if (this.map.getLayer('pois')) {
      this.map.setPaintProperty('pois', 'icon-opacity', 1);
    }
    if (this.map.getLayer('pois_price')) {
      this.map.setPaintProperty('pois_price', 'icon-opacity', 1);
      this.map.setPaintProperty('pois_price', 'text-opacity', 1);
    }
    if (this.map.getLayer('poi_selected')) {
      this.map.setPaintProperty('poi_selected', 'icon-opacity', 1);
    }
    if (this.map.getLayer('pois_price_selected')) {
      this.map.setPaintProperty('pois_price_selected', 'icon-opacity', 1);
      this.map.setPaintProperty('pois_price_selected', 'text-opacity', 1);
    }
    if (this.map.getLayer('agg')) {
      this.map.setPaintProperty('agg', 'icon-opacity', 1);
      this.map.setPaintProperty('agg', 'text-opacity', 1);
    }

    const popup = document.querySelector('.mapboxgl-popup');
    if (popup) {
      setTimeout(() => {
        popup.classList.remove('on-draw-selected');
      }, 200);
    }

    const mapMenu = document.querySelector('.map-menu');
    if (mapMenu) {
      setTimeout(() => {
        mapMenu.classList.remove('on-draw-selected');
      }, 200);
    }
  }

  protected hideLayers() {
    if (this.map.getLayer('pois')) {
      this.map.setPaintProperty('pois', 'icon-opacity', 0);
    }
    if (this.map.getLayer('pois_price')) {
      this.map.setPaintProperty('pois_price', 'icon-opacity', 0);
      this.map.setPaintProperty('pois_price', 'text-opacity', 0);
    }
    if (this.map.getLayer('poi_selected')) {
      this.map.setPaintProperty('poi_selected', 'icon-opacity', 0);
    }
    if (this.map.getLayer('pois_price_selected')) {
      this.map.setPaintProperty('pois_price_selected', 'icon-opacity', 0);
      this.map.setPaintProperty('pois_price_selected', 'text-opacity', 0);
    }
    if (this.map.getLayer('agg')) {
      this.map.setPaintProperty('agg', 'icon-opacity', 0);
      this.map.setPaintProperty('agg', 'text-opacity', 0);
    }
    const popup = document.querySelector('.mapboxgl-popup');
    if (popup) { popup.classList.add('on-draw-selected'); }

    const mapMenu = document.querySelector('.map-menu');
    if (mapMenu) { mapMenu.classList.add('on-draw-selected'); }
  }

  public populateFeaturesInPolygon(poly) {
    if (this.modalDraw) {
      this.actions.mapResultsDrawnFeatureModal(poly);
    } else {
      this.actions.mapResultsDrawnFeature(this.filterByPolygon(poly), poly);
    }
  }

  public filterByPolygon(poly) {
    if (this.map.getZoom > 15) {
      return null;
    }
    const abbox = bbox(poly);
    const features = this.map.queryRenderedFeatures(
      [this.map.project([abbox[0], abbox[1]]),
      this.map.project([abbox[2], abbox[3]])],
      { layers: ['pois', 'pois_price'] },
    );
    const toRet = features.filter((f) => {
      return MapUtils.isPointInPolygon(turfHelper.point(f.geometry.coordinates), poly);
    });
    return toRet;
  }

  public draw(e) {
    this.polygonLayer.draw([e.lngLat.lng, e.lngLat.lat]);
  }
}
export { MapDraw, IMapDraw }
