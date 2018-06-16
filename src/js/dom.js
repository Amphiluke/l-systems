let dom = {
    ui: new Map(),

    cache(el, lsId) {
        let index = lsId.indexOf(".");
        if (index >= 0) {
            let groupName = lsId.slice(index);
            let group = this.ui.get(groupName);
            if (!group) {
                group = new Map();
                this.ui.set(groupName, group);
            }
            group.set(lsId.slice(0, index), el);
        } else {
            this.ui.set(lsId, el);
        }
    },

    // Use this to search non-cached dynamic elements
    getElementByLSID(lsId, context = document.body) {
        return context.querySelector(`[data-ls-id="${lsId}"]`);
    }
};

for (let el of document.body.querySelectorAll("[data-ls-id]")) {
    dom.cache(el, el.dataset.lsId);
}

export default dom;