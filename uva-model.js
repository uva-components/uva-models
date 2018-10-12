import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'whatwg-fetch';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'

/**
 * `uva-model`
 *
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class UvaModel extends PolymerElement {
  static get properties() {
    return {
      /** URL used to get the content from the UVA APIs */
      _url: {
        type: String,
        computed: '_makeURL(path,apiVersion)'
      },
      /** If true, automatically performs an Ajax request when parameters change */
      auto: {
        type: Boolean,
        value: false
      },
      /** The API path used in the request */
      path: {
        type: String,
        value: ""
      },
      /** True while requests are in flight to the API */
      loading: {
        type: Boolean,
        notify: true,
      },
      /** captures the last response in case we need to parse it */
      _lastResponse: {
        type: Object,
        observer: "_parseResponse"
      },
      /** The last response */
      lastResponse: {
        type: Object,
        notify: true,
        readOnly: true
      },
      /** The version (path) of the UVA data api */
      apiVersion: {
        type: String,
        value: "v1"
      },
      /** To poll the api for changes, set this to the number of milliseconds between response and new request */
      poll: Number,
//      /** If `true` and the API supports CSV then the CSV feed will be used and parsed to save on the amount of data (no duplicate property names) */
//      csv: {
//        type: Boolean,
//        value: false,
//        observer: "_CSVobserver"
//      },
//      _requestType: {
//        type: String,
//        computed: "_typeOfRequest(csv)"
//      },
//      _contentType: String,
      _apidomain: {
        type: String,
        value: "https://api.devhub.virginia.edu/"
      },
      items: {
        type: Array,
        computed: '_getItems(lastResponse)',
        notify: true
      },
      sortBy: String,
      sortOrder: {
        type: String,
        value: 'asc'
      },
      filter: Object
    };
  }
  static get observers() {
    return [
      // update lastResponse when needed
      'generateRequest(_url,auto,poll)'
    ]
  }

  ready(){
    super.ready();
    this._controller = new AbortController();
    this._signal = this._controller.signal;
  }

  generateRequest(_url,auto){
    if (this._url &&
        // called w/o parameters, just make the request
        (_url === null && auto === null)
        // or if auto is true
        || (this._url && this.auto === true)) {
      // abort any fetches
      const signal = this._signal;
      if (this._controller) this._controller.abort();
      this.loading=true;
      const _this = this;
      fetch(this._url, { signal }).then(response => {
        return response.json();
      }).then(json => {
        _this._setLastResponse(json);
        _this.loading=false;
      }).catch(err => {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Uh oh, an error!', err);
        }
        _this.loading=false;
      });
    }
  }

  /** makes the url to get the data used to make a response */
  _makeURL(path,apiVersion) {
    return this._apidomain+apiVersion+"/"+path;
  }
  /** makes the items array from the lastResponse and other parameters */
  _getItems(lastResponse) {
    if (Array.isArray(lastResponse)) {
      var items = this.lastResponse;
      if (this.filter) {
        items = _.filter(items,this.filter);
      }
      if (this.sortBy) {
        items = _.orderBy(items, this.sortBy, this.sortOrder);
      }
      return items;
    }
    return null;
  }

}

window.customElements.define('uva-model', UvaModel);
