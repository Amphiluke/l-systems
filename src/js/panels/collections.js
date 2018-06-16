import bankData from "../bank.js";
import ls from "../ls.js";
import dom from "../dom.js";
import channel from "../channel.js";
import plotter from "../plotter.js";

let bank = new Map();

let collectionCtrl = {
    get current() {
        return dom.ui.get("collections").value;
    },
    set current(name) {
        dom.ui.get("collections").value = name;
        collectionCtrl.fillLSystemList();
        collectionCtrl.updateControlStates();
    },

    fillBank() {
        dom.ui.get("collections").length = 0;

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
        let html = "";
        for (let name of bank.get(collection).keys()) {
            html += `<option>${name}</option>`;
        }
        let select = dom.ui.get("lSystems");
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
        dom.ui.get("collections").children[userDefined ? 1 : 0].appendChild(option);
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
        let select = dom.ui.get("collections");
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
        let select = dom.ui.get("lSystems");
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
        dom.ui.get("lSystems").add(option);
    },

    updateControlStates() {
        dom.ui.get("deleteColl").disabled = dom.ui.get("addLS").disabled =
            dom.ui.get("removeLS").disabled = !collectionCtrl.isUserDefined();
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
            let params = plain[itemName];
            params.rules = new Map(Object.keys(params.rules).map(letter => [letter, params.rules[letter]]));
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


let handlers = {
    changeCollection(e) {
        collectionCtrl.current = e.target.value;
    },

    dblClickLSystem(e) {
        collectionCtrl.setupLSystem(e.target.value);
        channel.publish("LSystemConfigured");
    },

    keyDownLSystem(e) {
        switch (e.key) {
            case "Enter":
                collectionCtrl.setupLSystem(e.target.value);
                channel.publish("LSystemConfigured");
                break;
            case " ":
                collectionCtrl.setupLSystem(e.target.value);
                plotter.plot();
                break;
            case "Delete":
                if (collectionCtrl.isUserDefined() && window.confirm("Delete the selected L-system?")) {
                    collectionCtrl.deleteLSystem(e.target.value);
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
        let select = dom.ui.get("lSystems");
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

    mouseDownExport(e) {
        let link = e.target;
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

dom.ui.get("collections").addEventListener("change", handlers.changeCollection);
dom.ui.get("lSystems").addEventListener("dblclick", handlers.dblClickLSystem);
dom.ui.get("lSystems").addEventListener("keydown", handlers.keyDownLSystem);

dom.ui.get("createColl").addEventListener("click", handlers.clickCreateCollection);
dom.ui.get("deleteColl").addEventListener("click", handlers.clickDeleteCollection);

dom.ui.get("addLS").addEventListener("click", handlers.clickAddLS);
dom.ui.get("removeLS").addEventListener("click", handlers.clickRemoveLS);

dom.ui.get("importColl").addEventListener("change", handlers.changeImport);
dom.ui.get("exportColl").addEventListener("mousedown", handlers.mouseDownExport);

window.addEventListener("beforeunload", handlers.beforeUnload);