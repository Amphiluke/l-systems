import dom from "../dom.js";

let panel = dom.ui.get(".panels").get("exporting"),
    exportLink = dom.ui.get("exportImg"),
    canvas = dom.ui.get("canvas");

let exportCtrl = {
    makeLink(mimeType = "image/png") {
        URL.revokeObjectURL(exportLink.href);
        canvas.toBlob(blob => {
            let ext = mimeType.slice(mimeType.lastIndexOf("/") + 1);
            exportLink.href = URL.createObjectURL(blob);
            exportLink.download = `l-system.${ext}`;
            exportLink.innerHTML = `Download ${ext.toUpperCase()}…`;
            panel.classList.add("ls-export-requested");
        }, mimeType);
    },

    unmakeLink() {
        panel.classList.remove("ls-export-requested");
    }
};

let handlers = {
    clickExportControl(e) {
        let target = e.target;
        if (target === exportLink) {
            exportCtrl.unmakeLink();
        } else if (target.dataset.mimeType) {
            exportCtrl.makeLink(target.dataset.mimeType);
        }
    }
};

panel.querySelector(".ls-export-controls").addEventListener("click", handlers.clickExportControl);