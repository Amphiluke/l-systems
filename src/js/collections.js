import {bankData} from "./bank.js";
import {Collection} from "./collection.js";
import {publish} from "./channel.js";

let collectionCtrl = {
    bank: new Map(),

    fillBank() {
        // Load built in collections
        Object.keys(bankData).sort().forEach(colName => {
            collectionCtrl.add(colName, bankData[colName], false);
        });

        // Load user defined collections (if any)
        let storage = localStorage.getItem("userCollections");
        if (!storage) {
            return;
        }
        let userCollections = {};
        try {
            userCollections = JSON.parse(storage);
        } catch (e) {
            localStorage.removeItem("userCollections");
            console.error("Cannot parse stored user collections");
        }
        Object.keys(userCollections).sort().forEach(colName => {
            collectionCtrl.add(colName, userCollections[colName]);
        });
    },

    add(colName, lSystems = {}, userDefined = true) {
        colName = collectionCtrl.getValidName(colName, collectionCtrl.bank);
        collectionCtrl.bank.set(colName, Collection.fromJSON(lSystems, userDefined));
        if (userDefined) {
            collectionCtrl.storeUserCollections();
        }
        publish("collectionAdded", colName);
    },

    remove(colName) {
        if (!collectionCtrl.bank.has(colName)) {
            return;
        }
        if (!collectionCtrl.isUserDefined(colName)) {
            throw new Error("Built in collection cannot be deleted");
        }
        collectionCtrl.bank.delete(colName);
        collectionCtrl.storeUserCollections();
        publish("collectionRemoved", colName);
    },

    isUserDefined(colName) {
        return collectionCtrl.bank.get(colName).userDefined;
    },

    addLSystem(lsName, params, colName) {
        if (!collectionCtrl.bank.has(colName)) {
            return;
        }
        lsName = collectionCtrl.getValidName(lsName, collectionCtrl.bank.get(colName).lSystems);
        collectionCtrl.bank.get(colName).addLSystem(lsName, params);
        collectionCtrl.storeUserCollections();
        publish("LSystemAdded", lsName, colName);
    },

    removeLSystem(lsName, colName) {
        if (!collectionCtrl.bank.has(colName)) {
            return;
        }
        if (collectionCtrl.bank.get(colName).removeLSystem(lsName)) {
            collectionCtrl.storeUserCollections();
            publish("LSystemRemoved", lsName, colName);
        }
    },

    storeUserCollections() {
        let userCollections = {};
        collectionCtrl.bank.forEach((collection, colName) => {
            if (collection.userDefined) {
                userCollections[colName] = collection;
            }
        });
        // JSON.stringify converts collection instances to plain objects due to overridden .toJSON
        localStorage.setItem("userCollections", JSON.stringify(userCollections));
    },

    getValidName(name, map) {
        let i = 2;
        let validName = name;
        while (map.has(validName)) {
            validName = `${name} (${i++})`;
        }
        return validName;
    }
};

collectionCtrl.fillBank();


export function getNames(filterType = "all") {
    let colNames = [...collectionCtrl.bank.keys()];
    if (filterType === "built in") {
        return colNames.filter(colName => !collectionCtrl.isUserDefined(colName));
    }
    if (filterType === "user defined") {
        return colNames.filter(colName => collectionCtrl.isUserDefined(colName));
    }
    return colNames;
}

export function isUserDefined(colName) {
    return collectionCtrl.isUserDefined(colName);
}

export function add(colName, lSystems) {
    collectionCtrl.add(colName, lSystems);
}

export function remove(colName) {
    collectionCtrl.remove(colName);
}

export function getLSystemList() {
    let lsList = [];
    collectionCtrl.bank.forEach((collection, colName) => {
        collection.lSystems.forEach((lSystem, lsName) => {
            lsList.push({name: lsName, collection: colName});
        });
    });
    return lsList;
}

export function getLSystemParams(lsName, colName) {
    let collection = collectionCtrl.bank.get(colName);
    return collection && collection.lSystems.get(lsName);
}

export function addLSystem(lsName, params, colName) {
    collectionCtrl.addLSystem(lsName, params, colName);
}

export function removeLSystem(lsName, colName) {
    collectionCtrl.removeLSystem(lsName, colName);
}

export function getRawCollection(colName) {
    let collection = collectionCtrl.bank.get(colName);
    return collection ? collection.toJSON() : null;
}
