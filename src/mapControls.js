import EventBus from './eventBus';
import bbox from '@turf/bbox';
import * as MapUtils from './mapUtils';
import * as turfHelper from '@turf/helpers';

class FreeDraw {
    constructor(opt = {}, baseLayer) {
        this.options = opt;
        this.options.button = this.options.button || {};
        this.active = false;
        this.polygonLayer = baseLayer;
        this.eventsFnRef = {
            mouseDown: this.onMouseDown.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            mouseMove: this.draw.bind(this)
        };
        this.actions = opt.actions || {};
        this.textField = opt.textField || '';
        /* istanbul ignore next */
        document.addEventListener('mouseup', () => {
            setTimeout((prevActive) => {
                if (this.active === true && prevActive === true) {
                    this.poly = null;
                    this.eventsFnRef.mouseUp();
                    this.disableDrawMode();
                    this.polygonLayer.removePolygon();
                }
            }, 0, this.active);
        });
    }

    toggleMessage() {
        // TODO: do the subcomponent that shows a custom message from configuration when the user active the component
    }

    prepareButtons(additionalConfig = {}) {
        // TODO: from config we can receive a additional button configuration that will
        // be under the main button or aside the polygon
        // Remove polygon aside or not; close draw
        this.additional = {};
        if (additionalConfig.cancel) {
            const element = document.createElement('div');
            element.textContent = 'x';
            element.style.cssText = `position:absolute; width:20px; height:20px; border-radius:50%; 
            background:#bbb;line-height:20px;font-size:13px;box-shadow:1px 0 3px 0px #333;
            content:"\\261c";display:block;bottom:-5px;left:-5px;text-align:center;
            vertical-align:middle;color:white;'`;
            this.additional[additionalConfig.cancel.when] = this.additional[additionalConfig.cancel.when] || [];
            this.additional[additionalConfig.cancel.when].push({
                config: additionalConfig.cancel,
                render: () => {
                    this.container.appendChild(element);
                },
                unrender: () => {
                    element.parentNode.removeChild(element);
                }
            });
        }
    }

    launchAdditionals(when) {
        this.additional[when].forEach((render) => {
            render.render();
        });
    }
    removeAdditionals(when) {
        this.additional[when].forEach((unrender) => {
            unrender.unrender();
        });
    }

    onAdd(map) {
        const buttonWidthCond = this.options.button && this.options.button.width,
            width = buttonWidthCond ? this.options.button.width : '56px',
            height = this.options.button && this.options.button.height
                ? this.options.button.height : '56px',
            textcolor = this.options.button && this.options.button.text ? this.options.button.text.color : 'white',
            textsize = this.options.button && this.options.button.text ? this.options.button.text.size : '12px',
            lineheight = getProperlyLineHeight(height, textsize),
            bgcolor = this.options.button && this.options.button.background
                ? this.options.button.background.color : '#111';
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = `map-draw mapboxgl-ctrl
            ${this.options.button ? this.options.button.class : ''}`;
        this.container.style.cssText = `cursor:pointer;text-align:center;line-height:${lineheight};
            width:${width};height:${height};background-color:${bgcolor};color:${textcolor};font-size:${textsize};`;
        this.container.textContent = this.options.button && this.options.button.text
            ? this.options.button.text.text : 'FD';
        this.registerListeners();
        this.prepareButtons(this.options.additional);
        return this.container;
    }

    addActiveStyles() {
        if (this.options.button && this.options.button.active) {
            const width = this.options.button.active.width || '56px',
                height = this.options.button.active.height || '56px',
                textcolor = this.options.button.active.text && this.options.button.active.text.color
                    ? this.options.button.active.text.color : 'white',
                textsize = this.options.button.active.text && this.options.button.active.text.size
                    ? this.options.button.text.size : '12px',
                lineheight = getProperlyLineHeight(height, textsize),
                bgcolor = this.options.button.active.background && this.options.button.active.background.color
                    ? this.options.button.active.background.color : '#111';
            this.normalStyles = this.container.style.cssText;
            this.container.style.cssText += `line-height:${lineheight};width:${width};height:${height};
                background-color:${bgcolor};color:${textcolor};font-size:${textsize};`;
        }
    }

    removeActiveStyles() {
        if (this.normalStyles) this.container.style.cssText = this.normalStyles;
    }

    onRemove() {
        if (this.container && this.container.parentNode) {
            if (document.body.classList.contains('active-draw')) {
                document.body.classList.remove('active-draw');
            }
            this.container.parentNode.removeChild(this.container);
        }
        this.map = null;
    }

    registerListeners() {
        this.eventClick = this.container.addEventListener('click', this.evClickHandler.bind(this));
    }

    evClickHandler(e) {
        this.active = !this.active;
        if (e && this.textField !== '') {
            this.toggleMessage(this.active);
        }
        this.container.className = `map-draw mapboxgl-ctrl ${this.active ? 'active' : ''}`;
        this.map.getContainer().focus();
        return this.active ? this.drawMode() : this.drawDeactive();
    }

    onMouseDown() {
        this.map.on('touchmove', this.eventsFnRef.mouseMove);
        this.map.on('mousemove', this.eventsFnRef.mouseMove);
        this.polygonLayer.startDraw();
        if (this.textField !== '') {
            this.toggleMessage(false);
        }
    }
    /* istanbul ignore next */
    onMouseUp() {
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
        if (this.poly && this.options.populateFilteredFeatures
            && this.options.populateFilteredFeatures.active) {
            EventBus.fire('filteredPropertiesInPolygon',
                this.populateFeaturesInPolygon(this.poly, this.options.populateFilteredFeatures.layers));
        }
    }

    draw(e) {
        this.polygonLayer.draw([e.lngLat.lng, e.lngLat.lat]);
    }

    drawDeactive() {
        this.map.dragPan.enable();
        document.body.classList.remove('active-draw');
        this.removeActiveStyles();
        this.removeAdditionals('onActivate');
        this.map.getCanvas().style.cursor = '';
        this.map.off('touchstart', this.eventsFnRef.mouseDown);
        this.map.off('mousedown', this.eventsFnRef.mouseDown);
        this.map.off('touchend', this.eventsFnRef.mouseUp);
        this.map.off('mouseup', this.eventsFnRef.mouseUp);
    }

    drawMode() {
        this.map.dragPan.disable();
        document.body.classList.add('active-draw');
        this.addActiveStyles();
        this.launchAdditionals('onActivate');
        this.map.getCanvas().style.cursor = 'crosshair';
        if (this.drawing) {
            this.polygonLayer.removePolygon();
        }
        this.map.on('touchstart', this.eventsFnRef.mouseDown);
        this.map.on('mousedown', this.eventsFnRef.mouseDown);
        this.map.on('touchend', this.eventsFnRef.mouseUp);
        this.map.on('mouseup', this.eventsFnRef.mouseUp);
    }

    disableDrawMode() {
        this.active = false;
        if (this.textField !== '') {
            this.toggleMessage(this.active);
        }
        this.container.className = `map-draw mapboxgl-ctrl ${this.active ? 'active' : ''}`;
        return this.drawDeactive();
    }

    setVisibility(val) {
        this.container = document.querySelector('.map-draw.mapboxgl-ctrl') || this.container;
        if (val) {
            this.container.classList.remove('hidden');
        } else {
            this.container.classList.add('hidden');
        }
    }

    populateFeaturesInPolygon(poly, layers) {
        return this.filterByPolygon(poly, layers);
    }

    filterByPolygon(poly, layers) {
        if (this.map.getZoom > 15) return null;
        const abbox = bbox(poly);
        const features = this.map.queryRenderedFeatures(
            [this.map.project([abbox[0], abbox[1]]), this.map.project([abbox[2], abbox[3]])],
            { layers },
        );
        return features.filter((f) => MapUtils.isPointInPolygon(turfHelper.point(f.geometry.coordinates), poly));
    }
}

function getProperlyLineHeight(containerHeight, elementHeight) {
    const eh = elementHeight.replace('px', ''),
        ch = containerHeight.replace('px', '');
    return `${Math.floor(ch / eh * 100)}%`;
}

export { FreeDraw };
