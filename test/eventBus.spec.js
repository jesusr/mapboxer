import { expect } from 'chai';
import sinon from 'sinon';
let EventBus;

describe('Mapboxer EventBus class', () => {
    beforeEach(() => {
        EventBus = require('../src/eventBus').default;
    });
    it('Get initial events should return an empty object', () => {
        expect(EventBus.get()).to.be.deep.equal({});
    });
    it('Add a events should store the event under event name object', () => {
        let event1, event2, event3, event4;
        EventBus.register('name1', event1 = sinon.spy());
        EventBus.register('name1', event2 = sinon.spy(), {});
        EventBus.register('name2', event3 = sinon.spy());
        EventBus.register('name2', event4 = sinon.spy());
        const eventsBusEvents = EventBus.get();
        expect(eventsBusEvents.name1[0].toString()).to.be.equal(event1.bind({}).toString());
        expect(eventsBusEvents.name1[1].toString()).to.be.equal(event2.bind({}).toString());
        expect(eventsBusEvents.name2[0].toString()).to.be.equal(event3.bind({}).toString());
        expect(eventsBusEvents.name2[1].toString()).to.be.equal(event4.bind({}).toString());
        EventBus.reset();
    });
    it('Fire event should execute the proper function', () => {
        const event1 = sinon.spy(), event2 = sinon.spy(), event3 = sinon.spy(), event4 = sinon.spy();
        EventBus.register('name1', () => { event1(); });
        EventBus.register('name1', () => { event2(); });
        EventBus.register('name2', () => { event3(); });
        EventBus.register('name2', () => { event4(); });
        EventBus.fire('name1');
        expect(event1.calledOnce).to.be.equal(true);
        expect(event2.calledOnce).to.be.equal(true);
        EventBus.get('name1');
        EventBus.reset();
    });
});
