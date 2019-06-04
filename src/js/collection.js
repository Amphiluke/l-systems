export class Collection {
    constructor({lSystems = new Map(), userDefined = true} = {}) {
        Object.defineProperties(this, {
            userDefined: {enumerable: true, value: userDefined},
            lSystems: {value: lSystems}
        });
    }

    addLSystem(lsName, params) {
        if (!this.userDefined) {
            throw new Error("Built in collection cannot be modified");
        }
        this.lSystems.set(lsName, params);
    }

    removeLSystem(lsName) {
        if (!this.userDefined) {
            throw new Error("Built in collection cannot be modified");
        }
        return this.lSystems.delete(lsName);
    }

    toJSON() {
        let json = {};
        this.lSystems.forEach((params, name) => {
            let data = json[name] = {rules: {}};
            ({axiom: data.axiom, alpha: data.alpha, theta: data.theta, iterCount: data.iterCount, step: data.step} = params);
            params.rules.forEach((rule, letter) => {
                data.rules[letter] = rule;
            });
        });
        return json;
    }

    static fromJSON(rawLSystems, userDefined) {
        let lSystems = new Map();
        Object.keys(rawLSystems).sort().forEach(lsName => {
            let params = Object.assign({}, rawLSystems[lsName]);
            params.rules = new Map(Object.entries(params.rules));
            lSystems.set(lsName, params);
        });
        return new Collection({lSystems, userDefined});
    }
}
