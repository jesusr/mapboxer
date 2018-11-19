import { Popup } from 'mapbox-gl';
export default class Infobox {
    constructor(feature, opt) {
        this.feature = feature;
        this.opt = opt;
        this.container = null;
        this.events = {};
        this.open();
    }
    open() {
        this.closePopUp();

        this.element = this.createDomElement();
        this.popup = new Popup({
            closeButton: false, closeOnClick: false,
            offset: { bottom: [0, -19], left: [14, -5], right: [-14, -5], top: [0, 17] }
        }).setLngLat(this.feature.geometry.coordinates.slice()).setDOMContent(this.element);
        this.popup.addTo(this.opt.map);
        const closeElement = document.createElement('div');
        closeElement.classList.add('close-content');
        const infobox = document.querySelector('.mapboxgl-popup-content');
        infobox.insertAdjacentElement('afterbegin', closeElement);
        this.addCloseListener();
    }

    destroy() {
        this.closePopUp();
        this.clear();
        document.removeEventListener('click', this.events.close);
    }

    createDomElement() {
        const el = document.createElement('div');
        el.appendChild(this.getContentHTML());
        return el;
    }

    closePopUp() {
        if (this.popup && this.popup.isOpen()) {
            this.popup.remove();
        }
    }

    clear() {
        this.popup = null;
    }

    addCloseListener() {
        this.events.close = document.querySelector('.close-content').addEventListener('click', () => {
            if (this.popup) {
                this.popup.remove();
            }
        }, false);
    }
    getContentHTML() {
        const toret = document.createElement('span');
        toret.textContent = this.feature.properties.cartodb_id;
        return toret;
    }
}
