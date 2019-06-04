import * as collections from "../collections.js";
import {ls} from "../ls.js";
import {ui, on} from "../dom.js";
import {publish, subscribe} from "../channel.js";
import {plotter} from "../plotter.js";
import {copy} from "../clipboard.js";

let collectionCtrl = {
    get current() {
        return ui.get("collections").value;
    },
    set current(name) {
        let select = ui.get("collections");
        if (!name) {
            select.selectedIndex = -1;
            collectionCtrl.filterLSystemsByName("");
        } else {
            select.value = name;
            collectionCtrl.filterLSystemsByCollection(name);
        }
        collectionCtrl.updateControlStates();
    },

    init() {
        subscribe("collectionAdded", colName => {
            collectionCtrl.fillCollections();
            collectionCtrl.current = colName;
        });
        subscribe("collectionRemoved", colName => {
            let {current} = collectionCtrl;
            collectionCtrl.fillCollections();
            if (colName === current) {
                current = collections.getNames()[0];
            }
            collectionCtrl.current = current;
        });
        subscribe("LSystemAdded LSystemRemoved", () => {
            let {current} = collectionCtrl;
            collectionCtrl.fillLSystemList();
            collectionCtrl.current = current;
        });
        collectionCtrl.fillCollections();
        collectionCtrl.current = collections.getNames()[0];
    },

    fillCollections() {
        let select = ui.get("collections");
        let reduceFn = (memo, name) => `${memo}<option>${name}</option>`;
        select.children[0].innerHTML = collections.getNames("built in").reduce(reduceFn, "");
        select.children[1].innerHTML = collections.getNames("user defined").reduce(reduceFn, "");
        collectionCtrl.fillLSystemList();
    },

    fillLSystemList() {
        let select = ui.get("lSystems");
        select.innerHTML = collections.getLSystemList()
            .reduce((memo, {name, collection}) => `${memo}<option value="${name}::${collection}">${name}</option>`, "");
        select.selectedIndex = 0;
    },

    filterLSystemsByCollection(collection = collectionCtrl.current) {
        let options = [...ui.get("lSystems").options];
        options.forEach(option => {
            option.classList.toggle("hidden", !option.value.endsWith("::" + collection));
        });
        collectionCtrl.updateSelected();
    },

    filterLSystemsByName(name) {
        let options = [...ui.get("lSystems").options];
        options.forEach(option => {
            option.classList.toggle("hidden", !!name && !option.text.includes(name));
        });
        collectionCtrl.updateSelected();
    },

    updateSelected() {
        let options = [...ui.get("lSystems").options];
        let selected = options.find(option => option.selected);
        if (selected && selected.classList.contains("hidden")) {
            let visible = options.find(option => !option.classList.contains("hidden"));
            if (visible) {
                visible.selected = true;
            }
        }
    },

    setupLSystem(name, collection = collectionCtrl.current) {
        let params = collections.getLSystemParams(name, collection);
        if (!params) {
            return;
        }
        ls.reset();
        ls.axiom = params.axiom;
        ls.alpha = -params.alpha * Math.PI / 180;
        ls.theta = params.theta * Math.PI / 180;
        ls.step = params.step;
        ls.iterCount = params.iterCount;
        ls.setRules(params.rules);
    },

    updateControlStates() {
        let collection = collectionCtrl.current;
        let isUserDefined = collection ? collections.isUserDefined(collectionCtrl.current) : false;
        let panel = ui.get("collections.panels");
        [...panel.querySelectorAll("[data-for='userDefined']")]
            .forEach(el => el.disabled = !isUserDefined);
        [...panel.querySelectorAll("[data-for='builtIn']")]
            .forEach(el => el.disabled = isUserDefined);
    }
};

collectionCtrl.init();


let handlers = {
    changeCollection(e) {
        collectionCtrl.current = e.target.value;
    },

    clickToggleSearch() {
        let panel = ui.get("collections.panels");
        panel.classList.toggle("ls-search-mode");
        if (panel.classList.contains("ls-search-mode")) {
            collectionCtrl.current = "";
        } else {
            collectionCtrl.current = collections.getNames()[0];
        }
    },

    searchLS() {
        collectionCtrl.filterLSystemsByName(ui.get("searchLS").value);
    },

    clickExplore() {
        collectionCtrl.setupLSystem(...ui.get("lSystems").value.split("::"));
        publish("LSystemConfigured");
    },

    clickView() {
        collectionCtrl.setupLSystem(...ui.get("lSystems").value.split("::"));
        plotter.plot();
    },

    clickPermalink() {
        let lSystemId = ui.get("lSystems").value;
        let link = `${location.origin}${location.pathname}?ls=${encodeURIComponent(lSystemId)}`;
        copy(link)
            .then(() => {
                ui.get("permalink.clipboard").classList.add("copied");
            })
            .catch(() => {
                ui.get("permalink.clipboard").classList.add("failed");
            })
            .then(() => {
                setTimeout(() => {
                    ui.get("permalink.clipboard").classList.remove("copied", "failed");
                }, 2000);
            });
    },

    keyDownLSystem({key, target}) {
        switch (key) {
            case "Enter":
                handlers.clickExplore();
                break;
            case " ":
                handlers.clickView();
                break;
            case "Delete":
                if (collections.isUserDefined(collectionCtrl.current) && window.confirm("Delete the selected L-system?")) {
                    collections.removeLSystem(target.text, collectionCtrl.current);
                }
                break;
        }
    },

    clickCreateCollection() {
        let name = window.prompt("Enter a new collection name",
            `collection #${collections.getNames().length + 1}`);
        if (name) {
            collections.add(name);
        }
    },

    clickDeleteCollection() {
        if (window.confirm("Delete the selected collection?")) {
            collections.remove(collectionCtrl.current);
        }
    },

    clickAddLS() {
        let lsName = window.prompt("Enter the name of the L-system", "");
        if (lsName) {
            let params = {
                axiom: ls.axiom,
                alpha: -ls.alpha * 180 / Math.PI,
                theta: ls.theta * 180 / Math.PI,
                step: ls.step,
                iterCount: ls.iterCount,
                rules: ls.rules
            };
            collections.addLSystem(lsName, params, collectionCtrl.current);
        }
    },

    clickRemoveLS() {
        let select = ui.get("lSystems");
        if (select.selectedIndex >= 0 && collections.isUserDefined(collectionCtrl.current) &&
            window.confirm("Delete the selected L-system?")) {
            collections.removeLSystem(select.options[select.selectedIndex].text, collectionCtrl.current);
        }
    },

    changeImport(e) {
        let reader = new FileReader();
        let file = e.target.files[0];
        reader.addEventListener("load", () => {
            let name = file.name.endsWith(".json") ? file.name.slice(0, -5) : file.name;
            collections.add(name, JSON.parse(reader.result));
        });
        reader.addEventListener("error", () => {
            throw reader.error;
        });
        reader.readAsText(file);
    },

    mouseDownExport({target: link}) {
        URL.revokeObjectURL(link.href);
        let data = [JSON.stringify(collections.getRawCollection(collectionCtrl.current), null, 2)];
        let blob = new Blob(data, {type: "application/json"});
        link.href = URL.createObjectURL(blob);
        link.download = `${collectionCtrl.current}.json`;
    }
};

on("collections", "change", handlers.changeCollection);
on("toggleSearch", "click", handlers.clickToggleSearch);
on("searchLS", "input", handlers.searchLS);
on("lSystems", "keydown", handlers.keyDownLSystem);
on("lSystems", "dblclick", handlers.clickExplore);
on("explore", "click", handlers.clickExplore);
on("view", "click", handlers.clickView);

on(ui.get("permalink.clipboard"), "click", handlers.clickPermalink);

on("createColl", "click", handlers.clickCreateCollection);
on("deleteColl", "click", handlers.clickDeleteCollection);

on("addLS", "click", handlers.clickAddLS);
on("removeLS", "click", handlers.clickRemoveLS);

on("importColl", "change", handlers.changeImport);
on("exportColl", "mousedown", handlers.mouseDownExport);
on("exportColl", "touchstart", handlers.mouseDownExport);


if (/[?&]ls=([^&]+)/.exec(location.search)) {
    let lSystemId = decodeURIComponent(RegExp.$1);
    let option = ui.get("lSystems").querySelector(`option[value="${lSystemId}"]`);
    if (option) {
        collectionCtrl.current = lSystemId.split("::")[1];
        option.selected = true;
        handlers.clickView();
    }
}
