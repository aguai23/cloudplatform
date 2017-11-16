let __emitterInstance = (function() {
  let instance;

  return (newInstance) => {
    if(newInstance) {
      instance = newInstance;
    }
    return instance;
  }
}());

export default class CustomEventEmitter {
  static _emitterInstance = undefined;
  _events = {};

  constructor() {
    if(__emitterInstance()) {
      return __emitterInstance();
    }
    __emitterInstance(this);
  }

  static getEventEmitterInstance() {
    return __emitterInstance(new CustomEventEmitter());
  }

  dispatch(event, data) {
    if(!this._events[event]) {
      return;
    }

    for(let i = 0; i < this._events[event].length; i++) {
      this._events[event][i](data);
    }
  }

  subscribe(event, callback) {
    if(!this._events[event]) {
      this._events[event] = [];
    }

    this._events[event].push(callback);
  }

  unsubscribe(event) {
    delete this._events[event];
  }
}
