/* globals Terraformer, L */

L.esri.FeatureLayer = L.GeoJSON.extend({
  initialize: function(url, options){
    this.index = new Terraformer.RTree();
    this.url = url;
    L.GeoJSON.prototype.initialize.call(this, [], options);
  },
  onAdd: function(map){
    L.LayerGroup.prototype.onAdd.call(this, map);
    this.updateFeatures(map);
  },
  onRemove: function(map){
    L.LayerGroup.prototype.onRemove.call(this, map);
    map.off("viewreset moveend", L.Util.bind(this.updateFeatures, this));
  },
  updateFeatures: function(map){
    var draw = L.Util.bind(function(){
      var newBounds = map.getBounds();
      var envelope = L.esri.Util.boundsToEnvelope(newBounds);

      this.index.search(envelope).then(L.Util.bind(function(results){
        this.eachLayer(L.Util.bind(function(layer){
          var id = layer.feature.id;
          var layerid;
          this._toggleLayerVisibility(layer, results.indexOf(id) === -1);
        }, this));
      }, this));

      L.esri.get(this.url+"query", {
        geometryType: "esriGeometryEnvelope",
        geometry: JSON.stringify(L.esri.Util.boundsToExtent(newBounds)),
        outFields:"*",
        outSr: 4326
      }, L.Util.bind(function(response){
        if(response.objectIdFieldName && response.features.length && !response.error){
          var idKey = response.objectIdFieldName;
          for (var i = response.features.length - 1; i >= 0; i--) {
            var feature = response.features[i];
            var id = feature.attributes[idKey];
            if(!this._layers[id]){
              var geojson = Terraformer.ArcGIS.parse(feature);
              geojson.id = id;
              this.index.insert(geojson,id);
              this.addData(geojson);
            }
          }
        }
      }, this));
    },this);

    var tryDraw = L.Util.bind(function(){
      clearTimeout(this._delay);
      this._delay = setTimeout(L.Util.bind(function(){
        draw();
      },this), 250);
    },this);

    map.on("viewreset moveend", tryDraw);

    draw();
  },
  getLayerId: function(layer){
    return layer.feature.id;
  },
  _toggleLayerVisibility: function(layer, hide){
    var command = (hide) ? "addClass": "removeClass";

    // icon
    if(layer._icon){
      L.DomUtil[command](layer._icon,"esri-leaflet-hidden-feature");
    }

    // shadow
    if(layer._shadow){
      L.DomUtil[command](layer._shadow,"esri-leaflet-hidden-feature");
    }

    // misc layers
    if(layer._layers){
      for(var layerid in layer._layers){
        if(layer._layers.hasOwnProperty(layerid)){
          L.DomUtil[command](layer._layers[layerid]._container, "esri-leaflet-hidden-feature");
        }
      }
    }

  }
});

L.esri.featureLayer = function(url, options){
  return new L.esri.FeatureLayer(url, options);
};