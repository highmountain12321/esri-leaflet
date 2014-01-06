/*! Esri-Leaflet - v0.0.1-beta.3 - 2014-01-05
*   Copyright (c) 2014 Environmental Systems Research Institute, Inc.
*   Apache License*/
L.esri={_callback:{}},L.esri.Support={CORS:!!(window.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest)},L.esri.RequestHandlers={CORS:function(a,b,c,d){var e=new XMLHttpRequest;b.f="json",e.onreadystatechange=function(){var a;if(4===e.readyState){try{a=JSON.parse(e.responseText)}catch(b){a={error:"Could not parse response as JSON."}}d?c.call(d,a):c(a)}},e.open("GET",a+L.esri.Util.serialize(b),!0),e.send(null)},JSONP:function(a,b,c,d){var e="c"+(1e9*Math.random()).toString(36).replace(".","_");b.f="json",b.callback="L.esri._callback."+e;var f=L.DomUtil.create("script",null,document.body);f.type="text/javascript",f.src=a+L.esri.Util.serialize(b),f.id=e,L.esri._callback[e]=function(a){d?c.call(d,a):c(a),document.body.removeChild(f),delete L.esri._callback[e]}}},L.esri.get=L.esri.Support.CORS?L.esri.RequestHandlers.CORS:L.esri.RequestHandlers.JSONP,L.esri.Util={debounce:function(a,b){var c=null;return function(){var d=this||d,e=arguments;clearTimeout(c),c=setTimeout(function(){a.apply(d,e)},b)}},roundAwayFromZero:function(a){return a>0?Math.ceil(a):Math.floor(a)},trim:function(a){return a.replace(/^\s\s*/,"").replace(/\s\s*$/,"")},cleanUrl:function(a){return a=L.esri.Util.trim(a),"/"!==a[a.length-1]&&(a+="/"),a},serialize:function(a){var b="?";for(var c in a)if(a.hasOwnProperty(c)){var d=c,e=a[c];b+=encodeURIComponent(d),b+="=",b+=encodeURIComponent(e),b+="&"}return b.substring(0,b.length-1)},indexOf:function(a,b,c){if(c=c||0,a.indexOf)return a.indexOf(b,c);for(var d=c,e=a.length;e>d;d++)if(a[d]===b)return d;return-1},extentToBounds:function(a){var b=new L.LatLng(a.ymin,a.xmin),c=new L.LatLng(a.ymax,a.xmax);return new L.LatLngBounds(b,c)},boundsToExtent:function(a){return{xmin:a.getSouthWest().lng,ymin:a.getSouthWest().lat,xmax:a.getNorthEast().lng,ymax:a.getNorthEast().lat,spatialReference:{wkid:4326}}},boundsToEnvelope:function(a){var b=L.esri.Util.boundsToExtent(a);return{x:b.xmin,y:b.ymin,w:Math.abs(b.xmin-b.xmax),h:Math.abs(b.ymin-b.ymax)}}},L.esri.Mixins={},L.esri.Mixins.featureGrid={_activeRequests:0,_initializeFeatureGrid:function(a){this._map=a,this._previousCells=[],this.center=this._map.getCenter(),this.origin=this._map.project(this.center),this._moveHandler=L.esri.Util.debounce(function(a){"zoomend"===a.type&&(this.origin=this._map.project(this.center),this._previousCells=[]),this._requestFeatures(a.target.getBounds())},this.options.debounce,this),a.on("zoomend resize move",this._moveHandler,this),this._requestFeatures(a.getBounds())},_destroyFeatureGrid:function(a){a.off("zoomend resize move",this._moveHandler,this)},_requestFeatures:function(a){var b=this._cellsWithin(a);b&&this.fire("loading",{bounds:a});for(var c=0;c<b.length;c++)this._makeRequest(b[c],b,a)},_makeRequest:function(a,b,c){this._activeRequests++;var d={geometryType:"esriGeometryEnvelope",geometry:JSON.stringify(L.esri.Util.boundsToExtent(a.bounds)),outFields:"*",outSR:4326,inSR:4326};this.options.token&&(d.token=this.options.token),L.esri.get(this.url+"query",d,function(a){this._activeRequests--,this._activeRequests<=0&&this.fire("load",{bounds:c}),!a.error||499!==a.error.code&&498!==a.error.code?this._render(a):this._authenticating||(this._authenticating=!0,this.fire("authenticationrequired",{retry:L.Util.bind(function(a){this._authenticating=!1,this.options.token=a,this._previousCells=[],this._requestFeatures(this._map.getBounds())},this)}))},this)},_cellsWithin:function(a){var b=this._map.getSize(),c=this._map.project(this._map.getCenter());Math.min(this.options.cellSize/b.x,this.options.cellSize/b.y);for(var d=a.pad(.1),e=[],f=this._map.project(d.getNorthWest()),g=this._map.project(d.getSouthEast()),h=f.subtract(c).divideBy(this.options.cellSize),i=g.subtract(c).divideBy(this.options.cellSize),j=Math.round((this.origin.x-c.x)/this.options.cellSize),k=Math.round((this.origin.y-c.y)/this.options.cellSize),l=L.esri.Util.roundAwayFromZero(h.x)-j,m=L.esri.Util.roundAwayFromZero(i.x)-j,n=L.esri.Util.roundAwayFromZero(h.y)-k,o=L.esri.Util.roundAwayFromZero(i.y)-k,p=l;m>p;p++)for(var q=n;o>q;q++){var r="cell:"+p+":"+q,s=L.esri.Util.indexOf(this._previousCells,r)>=0;if(!s||!this.options.deduplicate){var t=this._cellExtent(p,q),u=t.getCenter(),v=u.distanceTo(t.getNorthWest()),w=u.distanceTo(this.center),x={row:p,col:q,id:r,center:u,bounds:t,distance:w,radius:v};e.push(x),this._previousCells.push(r)}}return e.sort(function(a,b){return a.distance-b.distance}),e},_cellExtent:function(a,b){var c=this._cellPoint(a,b),d=this._cellPoint(a+1,b+1),e=this._map.unproject(c),f=this._map.unproject(d);return L.latLngBounds(e,f)},_cellPoint:function(a,b){var c=this.origin.x+a*this.options.cellSize,d=this.origin.y+b*this.options.cellSize;return[c,d]}},L.esri.Mixins.identifiableLayer={identify:function(a,b,c){var d={sr:"4326",mapExtent:JSON.stringify(L.esri.Util.boundsToExtent(this._map.getBounds())),tolerance:5,geometryType:"esriGeometryPoint",imageDisplay:this._map._size.x+","+this._map._size.y+",96",geometry:JSON.stringify({x:a.lng,y:a.lat,spatialReference:{wkid:4326}})};this.options.layers&&(d.layers=this.options.layers);var e;"function"==typeof b&&"undefined"==typeof c?(c=b,e=d):"object"==typeof b&&(b.layerDefs&&(b.layerDefs=this.parseLayerDefs(b.layerDefs)),e=L.Util.extend(d,b)),L.esri.get(this.serviceUrl+"/identify",e,c)},parseLayerDefs:function(a){return a instanceof Array?"":"object"==typeof a?JSON.stringify(a):a}},function(a){var b="https:"!==window.location.protocol?"http:":"https:",c="line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;",d="position:absolute; top:-38px; right:2px;",e="<img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+d+"'>",f=function(a){return"<span class='esri-attributions' style='"+c+"'>"+a+"</span>"};a.esri.BasemapLayer=a.TileLayer.extend({statics:{TILES:{Streets:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",attributionUrl:"https://static.arcgis.com/attribution/World_Street_Map",options:{minZoom:1,maxZoom:19,subdomains:["server","services"],attribution:f("Esri")+e}},Topographic:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",attributionUrl:"https://static.arcgis.com/attribution/World_Topo_Map",options:{minZoom:1,maxZoom:19,subdomains:["server","services"],attribution:f("Esri")+e}},Oceans:{urlTemplate:b+"//server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",attributionUrl:"https://static.arcgis.com/attribution/Ocean_Basemap",options:{minZoom:1,maxZoom:16,subdomains:["server","services"],attribution:f("Esri")+e}},NationalGeographic:{urlTemplate:"https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,subdomains:["server","services"],attribution:f("Esri")+e}},DarkGray:{urlTemplate:b+"//tiles{s}.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Dark_Gray_Base_Beta/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:10,subdomains:[1,2],attribution:f("Esri, DeLorme, HERE")+e}},DarkGrayLabels:{urlTemplate:b+"//tiles{s}.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Dark_Gray_Reference_Beta/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:10,subdomains:[1,2]}},Gray:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,subdomains:["server","services"],attribution:f("Esri, NAVTEQ, DeLorme")+e}},GrayLabels:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,subdomains:["server","services"]}},Imagery:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,subdomains:["server","services"],attribution:f("Esri, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community")+e}},ImageryLabels:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,subdomains:["server","services"]}},ImageryTransportation:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,subdomains:["server","services"]}},ShadedRelief:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:13,subdomains:["server","services"],attribution:f("ESRI, NAVTEQ, DeLorme")+e}},ShadedReliefLabels:{urlTemplate:b+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:12,subdomains:["server","services"]}}}},initialize:function(b,c){var d;if("object"==typeof b&&b.urlTemplate&&b.options)d=b;else{if("string"!=typeof b||!a.esri.BasemapLayer.TILES[b])throw new Error("L.esri.BasemapLayer: Invalid parameter. Use one of 'Streets', 'Topographic', 'Oceans', 'NationalGeographic', 'Gray', 'GrayLabels', 'DarkGray', 'DarkGrayLabels', 'Imagery', 'ImageryLabels', 'ImageryTransportation', 'ShadedRelief' or 'ShadedReliefLabels'");d=a.esri.BasemapLayer.TILES[b]}var e=a.Util.extend(d.options,c);if(a.TileLayer.prototype.initialize.call(this,d.urlTemplate,a.Util.setOptions(this,e)),d.attributionUrl){var f=d.attributionUrl;this._dynamicAttribution=!0,this._getAttributionData(f)}},_dynamicAttribution:!1,bounds:null,zoom:null,onAdd:function(b){return!b.attributionControl&&console?(console.warn("L.esri.BasemapLayer requires attribution. Please set attributionControl to true on your map"),void 0):(a.TileLayer.prototype.onAdd.call(this,b),this._dynamicAttribution&&(this.on("load",this._handleTileUpdates,this),this._map.on("viewreset zoomend dragend",this._handleTileUpdates,this)),this._map.on("resize",this._resizeAttribution,this),void 0)},onRemove:function(b){this._dynamicAttribution&&(this.off("load",this._handleTileUpdates,this),this._map.off("viewreset zoomend dragend",this._handleTileUpdates,this)),this._map.off("resize",this._resizeAttribution,this),a.TileLayer.prototype.onRemove.call(this,b)},_handleTileUpdates:function(a){var b,c;"load"===a.type&&(b=this._map.getBounds(),c=this._map.getZoom()),("viewreset"===a.type||"dragend"===a.type||"zoomend"===a.type)&&(b=a.target.getBounds(),c=a.target.getZoom()),this.attributionBoundingBoxes&&b&&c&&(b.equals(this.bounds)&&c===this.zoom||(this.bounds=b,this.zoom=c,this._updateMapAttribution()))},_resizeAttribution:function(){var a=this._map.getSize().x;this._getAttributionLogo().style.display=600>a?"none":"block",this._getAttributionSpan().style.maxWidth=.75*a+"px"},_getAttributionData:function(b){this.attributionBoundingBoxes=[],a.esri.RequestHandlers.JSONP(b,{},this._processAttributionData,this)},_processAttributionData:function(b){for(var c=0;c<b.contributors.length;c++)for(var d=b.contributors[c],e=0;e<d.coverageAreas.length;e++){var f=d.coverageAreas[e],g=new a.LatLng(f.bbox[0],f.bbox[1]),h=new a.LatLng(f.bbox[2],f.bbox[3]);this.attributionBoundingBoxes.push({attribution:d.attribution,score:f.score,bounds:new a.LatLngBounds(g,h),minZoom:f.zoomMin,maxZoom:f.zoomMax})}this.attributionBoundingBoxes.sort(function(a,b){return a.score<b.score?-1:a.score>b.score?1:0}),this.bounds&&this._updateMapAttribution()},_getAttributionSpan:function(){return this._map._container.querySelectorAll(".esri-attributions")[0]},_getAttributionLogo:function(){return this._map._container.querySelectorAll(".esri-attribution-logo")[0]},_updateMapAttribution:function(){for(var a="",b=0;b<this.attributionBoundingBoxes.length;b++){var c=this.attributionBoundingBoxes[b];if(this.bounds.intersects(c.bounds)&&this.zoom>=c.minZoom&&this.zoom<=c.maxZoom){var d=this.attributionBoundingBoxes[b].attribution;-1===a.indexOf(d)&&(a.length>0&&(a+=", "),a+=d)}}this._getAttributionSpan().innerHTML=a,this._resizeAttribution()}}),a.esri.basemapLayer=function(b,c){return new a.esri.BasemapLayer(b,c)}}(L);