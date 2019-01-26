import {bankData} from "../bank.js";
import {ls} from "../ls.js";
import {ui, on} from "../dom.js";
import {publish} from "../channel.js";
import {plotter} from "../plotter.js";
import {copy} from "../clipboard.js";

let bank = new Map();

let collectionCtrl = {
    get current() {
        return ui.get("collections").value;
    },
    set current(name) {
        ui.get("collections").value = name;
        collectionCtrl.fillLSystemList();
        collectionCtrl.updateControlStates();
    },

    fillBank() {
        ui.get("collections").length = 0;

        // Load built in collections
        for (let collName of Object.keys(bankData).sort()) {
            collectionCtrl.add(collName, bankData[collName], false, false);
        }
        collectionCtrl.current = bank.keys().next().value;

        // Load user defined collections (if any)
        let userCollections = localStorage.getItem("userCollections");
        if (userCollections) {
            userCollections = JSON.parse(userCollections);
            for (let collName of Object.keys(userCollections).sort()) {
                collectionCtrl.add(collName, userCollections[collName], true, false);
            }
        }
    },

    fillLSystemList(collection = collectionCtrl.current) {
        let html = [...bank.get(collection).keys()]
            .reduce((memo, name) => `${memo}<option>${name}</option>`, "");
        let select = ui.get("lSystems");
        select.innerHTML = html;
        select.selectedIndex = 0;
    },

    setupLSystem(name, collection = collectionCtrl.current) {
        let params = bank.get(collection).get(name);
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

    add(name, lSystems = {}, userDefined = true, setCurrent = true) {
        name = collectionCtrl._getValidName(name, bank);
        let collection = collectionCtrl.plainToCollection(lSystems);
        // User defined collections are editable in contrast to built in collections.
        // So we need an attribute to distinct these two types of collections
        collection.userDefined = userDefined;
        bank.set(name, collection);
        let option = document.createElement("option");
        option.text = name;
        ui.get("collections").children[userDefined ? 1 : 0].appendChild(option);
        if (setCurrent) {
            collectionCtrl.current = name;
        }
    },

    delete(collection = collectionCtrl.current) {
        if (!collectionCtrl.isUserDefined(collection)) {
            throw new Error("Built in collection cannot be deleted");
        }
        bank.delete(collection);
        if (collection === collectionCtrl.current) {
            collectionCtrl.current = bank.keys().next().value;
        }
        let select = ui.get("collections");
        select.children[1].removeChild([...select.options].find(option => option.text === collection));
    },

    isUserDefined(collection = collectionCtrl.current) {
        return !!bank.get(collection).userDefined;
    },

    deleteLSystem(name, collection = collectionCtrl.current) {
        if (!collectionCtrl.isUserDefined(collection)) {
            throw new Error("Built in collections cannot be modified");
        }
        bank.get(collection).delete(name);
        let select = ui.get("lSystems");
        select.removeChild([...select.options].find(option => option.text === name));
    },

    addLSystem(name, collection = collectionCtrl.current) {
        if (!collectionCtrl.isUserDefined(collection)) {
            throw new Error("Built in collections cannot be modified");
        }
        collection = bank.get(collection);
        name = collectionCtrl._getValidName(name, collection);
        let lSystem = new Map();
        lSystem.axiom = ls.axiom;
        lSystem.alpha = -ls.alpha * 180 / Math.PI;
        lSystem.theta = ls.theta * 180 / Math.PI;
        lSystem.step = ls.step;
        lSystem.iterCount = ls.iterCount;
        lSystem.rules = ls.rules;
        collection.set(name, lSystem);
        let option = document.createElement("option");
        option.text = name;
        ui.get("lSystems").add(option);
    },

    updateControlStates() {
        let isUserDefined = collectionCtrl.isUserDefined();
        let panel = ui.get("collections.panels");
        [...panel.querySelectorAll("[data-for='userDefined']")]
            .forEach(el => el.disabled = !isUserDefined);
        [...panel.querySelectorAll("[data-for='builtIn']")]
            .forEach(el => el.disabled = isUserDefined);
    },

    storeUserCollections() {
        let userCollections = {};
        for (let collection of bank.keys()) {
            if (collectionCtrl.isUserDefined(collection)) {
                userCollections[collection] = collectionCtrl.collectionToPlain(collection);
            }
        }
        localStorage.setItem("userCollections", JSON.stringify(userCollections));
    },

    collectionToPlain(collection = collectionCtrl.current) {
        let plain = {};
        for (let [name, params] of bank.get(collection)) {
            let data = plain[name] = {rules: {}};
            ({axiom: data.axiom, alpha: data.alpha, theta: data.theta, iterCount: data.iterCount, step: data.step} = params);
            for (let [letter, rule] of params.rules) {
                data.rules[letter] = rule;
            }
        }
        return plain;
    },

    plainToCollection(plain) {
        let collection = new Map();
        for (let itemName of Object.keys(plain).sort()) {
            let params = Object.assign({}, plain[itemName]);
            params.rules = new Map(Object.entries(params.rules));
            collection.set(itemName, params);
        }
        return collection;
    },

    _getValidName(name, map) {
        let i = 2;
        let validName = name;
        while (map.has(validName)) {
            validName = `${name} (${i++})`;
        }
        return validName;
    }
};

collectionCtrl.fillBank();
if (/[?&]ls=([^&]+)/.exec(location.search)) {
    let [collectionName, lSystemName] = decodeURIComponent(RegExp.$1).split("#");
    if (bank.has(collectionName) && bank.get(collectionName).has(lSystemName)) {
        collectionCtrl.current = collectionName;
        ui.get("lSystems").value = lSystemName;
    }
}


let handlers = {
    changeCollection(e) {
        collectionCtrl.current = e.target.value;
    },

    clickExplore() {
        collectionCtrl.setupLSystem(ui.get("lSystems").value);
        publish("LSystemConfigured");
    },

    clickView() {
        collectionCtrl.setupLSystem(ui.get("lSystems").value);
        plotter.plot();
    },

    clickPermalink() {
        let collectionName = collectionCtrl.current;
        let lSystemName = ui.get("lSystems").value;
        let link = `${location.origin}${location.pathname}?ls=` +
            encodeURIComponent(`${collectionName}#${lSystemName}`);
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
                if (collectionCtrl.isUserDefined() && window.confirm("Delete the selected L-system?")) {
                    collectionCtrl.deleteLSystem(target.value);
                }
                break;
        }
    },

    clickCreateCollection() {
        let name = window.prompt("Enter a new collection name", `collection #${bank.size + 1}`);
        if (name !== null) {
            collectionCtrl.add(name);
        }
    },

    clickDeleteCollection() {
        if (window.confirm("Delete the selected collection?")) {
            collectionCtrl.delete();
        }
    },

    clickAddLS() {
        let name = window.prompt("Enter the name of the L-system", "");
        if (name !== null) {
            collectionCtrl.addLSystem(name);
        }
    },

    clickRemoveLS() {
        let select = ui.get("lSystems");
        if (select.selectedIndex >= 0 && collectionCtrl.isUserDefined() &&
            window.confirm("Delete the selected L-system?")) {
            collectionCtrl.deleteLSystem(select.value);
        }
    },

    changeImport(e) {
        let reader = new FileReader();
        let file = e.target.files[0];
        reader.addEventListener("load", () => {
            let name = file.name.endsWith(".json") ? file.name.slice(0, -5) : file.name;
            collectionCtrl.add(name, JSON.parse(reader.result));
        });
        reader.addEventListener("error", () => {
            throw reader.error;
        });
        reader.readAsText(file);
    },

    mouseDownExport({target: link}) {
        URL.revokeObjectURL(link.href);
        let data = [JSON.stringify(collectionCtrl.collectionToPlain(), null, 2)];
        let blob = new Blob(data, {type: "application/json"});
        link.href = URL.createObjectURL(blob);
        link.download = `${collectionCtrl.current}.json`;
    },

    beforeUnload() {
        collectionCtrl.storeUserCollections();
    }
};

on("collections", "change", handlers.changeCollection);
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

on(window, "beforeunload", handlers.beforeUnload);