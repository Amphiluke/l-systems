let handlerRegistry = new Map();

let channel = {
    publish(event, ...args) {
        let handlers = handlerRegistry.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    },

    subscribe(event, handler) {
        let handlers = handlerRegistry.get(event);
        if (!handlers) {
            handlers = [];
            handlerRegistry.set(event, handlers);
        }
        handlers.push(handler);
    },

    unsubscribe(event, handler) {
        let handlers = handlerRegistry.get(event);
        if (handlers) {
            let index = handlers.indexOf(handler);
            if (index >= 0) {
                handlers.splice(index, 1);
                if (!handlers.length) {
                    handlerRegistry.delete(event);
                }
            }
        }
    }
};

export default channel;
