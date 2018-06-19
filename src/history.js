import { isEqual, isEmpty } from 'lodash';

class History {
    store;
    history = {};
    last = {};

    init(store) {
        this.store = store;
    }

    add(state) {
        if (state.app && this.last.app && !isEqual(state.app.layers, this.last.app.layers)) {
            this.history = {...this.last};
        }
        this.last = {...state};
    }

    undo() {
        if (!isEmpty(this.history)) {
            this.store.replaceState({...this.history});
        }
    }
}

export default new History();