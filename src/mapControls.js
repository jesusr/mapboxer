import EventBus from './eventBus';
import bbox from '@turf/bbox';
import * as MapUtils from './mapUtils';
import * as turfHelper from '@turf/helpers';

class FreeDraw {
    constructor(opt = {}, baseLayer) {
        this.options = opt;
        this.options.config = this.options.config || {};
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

    onAdd(map) {
        const buttonWidthCond = this.options.config.button && this.options.config.button.width,
            width = buttonWidthCond ? this.options.config.button.width : '56px',
            height = this.options.config.button && this.options.config.button.height
                ? this.options.config.button.height : '56px',
            textsize = this.options.config.button ? this.options.config.button.text.size : '12px',
            lineheight = getProperlyLineHeight(height, textsize),
            bgcolor = this.options.config.button && this.options.config.button.background
                ? this.options.config.button.background.color : '#111';
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = `map-draw mapboxgl-ctrl
            ${this.options.config.button ? this.options.config.button.class : ''}`;
        this.container.style.cssText = `cursor:pointer;text-align:center;
            line-height:${lineheight};
            width: ${width};
            height: ${height};
            background-color: ${bgcolor};
            color:${this.options.config.button ? this.options.config.button.text.color : 'white'};
            font-size: ${this.options.config.button ? this.options.config.button.text.size : '56px'};`;
        this.container.textContent = this.options.config.button && this.options.config.button.text
            ? this.options.config.button.text.text : 'FD';
        this.registerListeners();
        return this.container;
    }

    onRemove() {
        if (this.container && this.container.parentNode) {
            if (document.body.classList.contains('active-draw')) {
                document.body.classList.remove('active-draw');
            }
            this.container.parentNode.removeChild(this.container);
        }
        console.log('mapnulled');
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
        this.map.getCanvas().style.cursor = '';
        this.map.off('touchstart', this.eventsFnRef.mouseDown);
        this.map.off('mousedown', this.eventsFnRef.mouseDown);
        this.map.off('touchend', this.eventsFnRef.mouseUp);
        this.map.off('mouseup', this.eventsFnRef.mouseUp);
    }

    drawMode() {
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
