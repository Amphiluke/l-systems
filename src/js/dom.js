let dom = {
    ui: new Map(),

    cache(el, lsId) {
        let index = lsId.indexOf(".");
        if (index >= 0) {
            let groupName = "." + lsId.slice(index + 1);
            let group = this.ui.get(groupName);
            if (!group) {
                group = new Map();
                this.ui.set(groupName, group);
            }
            group.set(lsId.slice(0, index), el);
        } else {
            this.ui.set(lsId, el);
        }
    }
};

for (let el of document.body.querySelectorAll("[data-ls-id]")) {
    dom.cache(el, el.dataset.lsId);
}

export default dom;