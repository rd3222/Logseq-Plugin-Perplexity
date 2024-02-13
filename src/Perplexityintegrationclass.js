// Import necessary functions and libraries
import fetch from 'node-fetch';

class LSPluginUser {
  constructor(pluginLocal, caller) {
    this._pluginLocal = pluginLocal;
    this._connected = false;
    this._parent = null;
    this._child = null;
    this._shadow = null;
    this._status = null;
    this._userModel = {};
    this._call = null;
    this._callUserModel = null;
    this._debugTag = "";

    if (pluginLocal) {
      this._debugTag = pluginLocal.debugTag;
    }

    // Define the API key and headers inside the constructor to ensure they are encapsulated within each instance
    this.PERPLEXITY_API_KEY = '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';
    this.headers = {
      'Authorization': `Bearer ${this.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  async connectToChild() {
    if (this._connected) return;

    const { shadow } = this._pluginLocal;
    if (shadow) {
      await this._setupShadowSandbox();
    } else {
      await this._setupIframeSandbox();
    }
  }

  async connectToParent(options = {}) {
    if (this._connected) return;

    const isPluginLocal = this._pluginLocal != null;
    let handshakeAttempts = 0;
    const handshakeCallbacks = new Map();
    const handshakeTimeout = new Promise((resolve) => setTimeout(resolve, 60000));
    const userModel = this._extendUserModel({
      "#lspmsg#ready#": async (data) => {
        userModel['an(data?.pid)'] = ({ type, payload }) => {
          console.log(`[host (_call) -> *user] ${this._debugTag}`, type, payload);
          this.emit(type, payload);
        };
        await handshakeTimeout;
      },
      "#lspmsg#beforeunload#": async (data) => {
        const beforeUnloadCallback = new Promise((resolve) => setTimeout(resolve, 10000));
        this.emit("beforeunload", { ...beforeUnloadCallback, ...data });
        await beforeUnloadCallback;
      },
      "#lspmsg#settings#": async ({ type, payload }) => {
        this.emit("settings:changed", payload);
      },
      "#lspmsg#": async ({ ns, type, payload }) => {
        console.log(`[host (async) -> *user] ${this._debugTag} ns=${ns} type=${type}`, payload);
        if (ns && ns.startsWith("hook")) {
          this.emit(`${ns}:${type}`, payload);
        } else {
          this.emit(type, payload);
        }
      },
      "#lspmsg#reply#": ({ _sync, result }) => {
        if (handshakeCallbacks.has(_sync)) {
          const callback = handshakeCallbacks.get(_sync);
          if (callback) {
            if (result != null && result.hasOwnProperty('lt')) {
              callback.reject(result['lt']);
            } else {
              callback.resolve(result);
            }
            handshakeCallbacks.delete(_sync);
          }
        }
      },
      ...options
    });

    if (isPluginLocal) {
      await handshakeTimeout;
      return JSON.parse(JSON.stringify(this._pluginLocal.toJSON()));
    }

    const handshakeReply = new LSPluginUserModel(userModel).sendHandshakeReply();
    this._status = "pending";
    await handshakeReply.then((child) => {
      this._child = child;
      this._connected = true;
      this._call = async (type, payload, promise) => {
        if (promise) {
          const syncId = ++handshakeAttempts;
          handshakeCallbacks.set(syncId, promise);
          promise.setTag(`async call #${syncId}`);
          console.log(`async call #${syncId}`);
        }
        child.emit('an(userModel.baseInfo.id)', { type, payload });
        return promise?.promise;
      };
      this._callUserModel = async (type, payload) => {
        try {
          userModel[type](payload);
        } catch {
          console.log(`[model method] #${type} not existed`);
        }
      };
    }).finally(() => {
      this._status = undefined;
    });

    await handshakeTimeout;
    return userModel.baseInfo;
  }

  async call(type, payload = {}) {
    return this._call?.(type, payload);
  }

  async callAsync(type, payload = {}) {
    const promise = new Promise((resolve) => setTimeout(resolve, 10000));
    return this._call?.(type, payload, promise);
  }

  async callUserModel(type, payload = {}) {
    return this._callUserModel?.(type, payload);
  }

  async _setupIframeSandbox() {
    // Implementation for setting up an iframe sandbox
  }

  async _setupShadowSandbox() {
    // Implementation for setting up a shadow DOM sandbox
  }

  _extendUserModel(model) {
    // Extend the user model with additional methods or properties
  }

  _getSandboxIframeContainer() {
    // Get the container of the iframe sandbox
  }

  _getSandboxShadowContainer() {
    // Get the container of the shadow DOM sandbox
  }

  _getSandboxIframeRoot() {
    // Get the root element of the iframe sandbox
  }

  _getSandboxShadowRoot() {
    // Get the root element of the shadow DOM sandbox
  }

  set debugTag(tag) {
    this._debugTag = tag;
  }

  async destroy() {
    // Clean up and destroy the sandbox
  }

  async fetchInformation(query) {
    const model = 'text-davinci-003'; // Specify the model
    const payload = { query };
    return await this.callPerplexityAPI(model, payload);
  }

  // Method to call Perplexity API
  async callPerplexityAPI(model, payload) {
    const response = await fetch(`https://api.perplexity.ai/v1/models/${model}/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload)
    });
    return response.json();
  }
}

// Export the LSPluginUser class
export { LSPluginUser };
