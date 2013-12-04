/*! Esri-Leaflet - v0.0.1-rc.2 - 2013-12-04
*   Copyright (c) 2013 Environmental Systems Research Institute, Inc.
*   Apache License*/
!function(a,Terraformer){a.esri.ClusteredFeatureLayer=a.Class.extend({includes:a.esri.Mixins.featureGrid,options:{cellSize:512,debounce:100,deduplicate:!0,createMarker:function(b,c){return new a.marker(c)},onEachMarker:void 0},initialize:function(b,c){a.Util.setOptions(this,c),this.url=a.esri.Util.cleanUrl(b),a.esri.get(this.url,{},function(a){this.fire("metadata",{metadata:a})},this),this._loaded=[],this.cluster=this.options.cluster||new a.MarkerClusterGroup},onAdd:function(a){this.cluster.addTo(a),this._initializeFeatureGrid(a)},onRemove:function(a){a.removeLayer(this.cluster),this._destroyFeatureGrid(a)},addTo:function(a){return a.addLayer(this),this},_render:function(b){if(b.features.length&&!b.error){var c=b.objectIdFieldName;if(!c)for(var d=0;d<=b.fields.length-1;d++)if("esriFieldTypeOID"===b.fields[d].type){c=b.fields[d].name;break}for(var e=b.features.length-1;e>=0;e--){var f=b.features[e],g=f.attributes[c];if(a.esri.Util.indexOf(this._loaded,g)<0){var h=Terraformer.ArcGIS.parse(f);h.id=g;var i=this.options.createMarker(h,[h.geometry.coordinates[1],h.geometry.coordinates[0]]);this.options.onEachMarker&&this.options.onEachMarker(h,i),this.cluster.addLayer(i),this._loaded.push(g)}}}}}),a.esri.ClusteredFeatureLayer.include(a.Mixin.Events),a.esri.clusteredFeatureLayer=function(b,c){return new a.esri.ClusteredFeatureLayer(b,c)}}(L,Terraformer);