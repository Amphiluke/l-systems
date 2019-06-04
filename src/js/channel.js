let handlerRegistry = new Map();

export function publish(event, ...args) {
    let handlers = handlerRegistry.get(event);
    if (handlers) {
        handlers.forEach(handler => handler(...args));
    }
}

export function subscribe(event, handler) {
    if (event.includes(" ")) {
        event.split(" ").forEach(e => subscribe(e, handler));
        return;
    }
    let handlers = handlerRegistry.get(event);
    if (!handlers) {
        handlers = [];
        handlerRegistry.set(event, handlers);
    }
    handlers.push(handler);
}

export function unsubscribe(event, handler) {
    if (event.includes(" ")) {
        event.split(" ").forEach(e => unsubscribe(e, handler));
        return;
    }
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
