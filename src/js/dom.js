export let ui = new Map();

export function on(ref, event, handler) {
    let el = (typeof ref === "string") ? ui.get(ref) : ref;
    el.addEventListener(event, handler);
}

// Use this to search non-cached dynamic elements
export function getElementByLSID(lsid, context = document.body) {
    return context.querySelector(`[data-lsid="${lsid}"]`);
}

function cache(el, lsid) {
    ui.set(lsid, el);
    let index = lsid.indexOf(".");
    if (index > 0) {
        let groupName = lsid.slice(index);
        let group = ui.get(groupName);
        if (!group) {
            group = new Map();
            ui.set(groupName, group);
        }
        group.set(lsid.slice(0, index), el);
    }
}

[...document.body.querySelectorAll("[data-lsid]")].forEach(el => {
    cache(el, el.dataset.lsid);
});