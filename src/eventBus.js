const events = {};
const EventBus = {
    fire: (ev, params) => {
        if (!events[ev]) return;
        events[ev].forEach((fn) => {
            fn(params);
        });
    },
    register: (ev, fn, ctx) => {
        if (events[ev] && Array.isArray(events[ev])) events[ev].push(fn.bind(ctx || {}));
        else events[ev] = [fn.bind(ctx || {})];
    },
    reset: () => {
        Object.keys(events).forEach((o) => {
            events[o] = [];
        });
    }
};
export default EventBus;
