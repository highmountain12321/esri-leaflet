
L.esri.FeatureLayer = L.esri.FeatureManager.extend({

  /**
   * Constructor
   */

  initialize: function (url, options) {
    L.esri.FeatureManager.prototype.initialize.call(this, url, options);

    this.index = L.esri._rbush();

    options = L.setOptions(this, options);

    this._layers = {};
  },

  /**
   * Feature Managment Methods
   */

  createLayers: function(features){
    var bounds = [];
    for (var i = features.length - 1; i >= 0; i--) {
      var geojson = features[i];
      var layer = this._layers[geojson.id];

      if(layer && !this._map.hasLayer(layer)){
        this._map.addLayer(layer);
      }

      if (layer && layer.setLatLngs) {
        var newLayer = L.GeoJSON.geometryToLayer(geojson, this.options);
        layer.setLatLngs(newLayer.getLatLngs());
      }

      if (layer && layer.setLatLng) {
        var newLayer = L.GeoJSON.geometryToLayer(geojson, this.options);
        layer.setLatLng(newLayer.getLatLng());
      }

      if(!layer){
        var newLayer = L.GeoJSON.geometryToLayer(geojson, this.options);
        newLayer.feature = L.GeoJSON.asFeature(geojson);

        // get bounds and add bbox
        var bbox = L.esri.Util.geojsonBounds(newLayer.feature);
        bbox.push(newLayer.feature.id);
        bounds.push(bbox);

        // style the layer
        newLayer.defaultOptions = newLayer.options;
        this.resetStyle(newLayer);

        // bubble events from layers to this
        newLayer.addEventParent(this);

        // cache the layer
        this._layers[newLayer.feature.id] = newLayer;

        // add the layer if it is within the time bounds or our layer is not time enabled
        if(!this._timeEnabled || (this._timeEnabled && this._featureWithinTimeRange(geojson)) ){
          this._map.addLayer(newLayer);
        }
      }
    };

    // load the indexes
    this.index.load(bounds);
  },

  cellEnter: function(bounds){
    var layers = this._featuresWithinBounds(bounds);
    for (var i = layers.length - 1; i >= 0; i--) {
      var layer = layers[i];
      layer.addTo(this._map);
    };
  },

  cellLeave: function(bounds){
    var layers = this._featuresWithinBounds(bounds);
    for (var i = layers.length - 1; i >= 0; i--) {
      var layer = layers[i];
      if(layer.getBounds && !(bounds.contains(layer.getBounds()) || bounds.intersects(layer.getBounds()))) {
        layer.removeFrom(this._map);
      }
      if(layer.getLatLng && !bounds.contains(layer.getLatLng())){
        layer.removeFrom(this._map);
      }
    };
  },

  addLayers: function(ids){
    for (var i = ids.length - 1; i >= 0; i--) {
      var layer = this._layers[ids[i]];
      if(layer){
        layer.addTo(this._map);
      }
    };
  },

  removeLayers: function(ids){
    for (var i = ids.length - 1; i >= 0; i--) {
      var layer = this._layers[ids[i]];
      if(layer){
        layer.removeFrom(this._map);
      }
    };
  },

  /**
   * Styling Methods
   */

  resetStyle: function (layer) {
    // reset any custom styles
    layer.options = layer.defaultOptions;
    this._setLayerStyle(layer, this.options.style);
  },

  setStyle: function (style) {
    this.eachLayer(function (layer) {
      this._setLayerStyle(layer, style);
    }, this);
  },

  _setLayerStyle: function (layer, style) {
    if (typeof style === 'function') {
      style = style(layer.feature);
    }
    if (layer.setStyle) {
      layer.setStyle(style);
    }
  },

  /**
   * Popup Methods
   */

  bindPopup: function (fn, options) {
    // @TODO
  },

  unBindPopup: function (fn, options) {
    // @TODO
  },

  openPopup: function (id, opt) {
    // @TODO
  },

  /**
   * Utility Methods
   */

  eachFeature: function (fn) {
    // @TODO
  },

  getFeature: function (id) {
    // @TODO
  },

  /**
   * Filtering Methods
   */

  _featuresWithinBounds: function(bounds){
    var results = this.index.search(bounds.toBBoxString().split(','));
    var ids = [];
    var layers = [];
    for (var i = 0; i < results.length; i++) {
      ids.push(results[i][4]);
    }
    for (var i = ids.length - 1; i >= 0; i--) {
      layers.push(this._layers[ids[i]]);
    }
    return layers;
  },

});

L.esri.featureLayer = function (options) {
  return new L.esri.FeatureLayer(options);
};