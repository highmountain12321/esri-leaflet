/* globals L */

/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Sanborn Map Company, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

L.esri.DynamicMapLayer = L.ImageOverlay.extend({
  includes: L.esri.Mixins.identifiableLayer,

  defaultParams: {
    format: 'png24',
    transparent: true,
    f: 'image',
    bboxSR: 4326,
    imageSR: 3857,
    layers: '',
    opacity: 1,
    position: 'front'
  },

  initialize: function (url, options) {
    this.serviceUrl = L.esri.Util.cleanUrl(url);
    this._layerParams = L.Util.extend({}, this.defaultParams);

    for (var opt in options) {
      if (!this.options.hasOwnProperty(opt)) {
        this._layerParams[opt] = options[opt];
      }
    }

    this._parseLayers();
    this._parseLayerDefs();

    L.esri.get(this.serviceUrl, {}, function(response){
      this.fire("metadata", { metadata: response });
    }, this);

    L.Util.setOptions(this, options);
  },

  onAdd: function (map) {
    this._bounds = map.getBounds();
    this._map = map;

    this._moveHandler = L.esri.Util.debounce(this._update, 150, this);

    map.on("moveend", this._moveHandler, this);

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    if (map.options.crs && map.options.crs.code) {
      // spatial reference of the map
      var sr = parseInt(map.options.crs.code.split(":")[1], 10);

      // we want to output the image for the same spatial reference as the map
      this._layerParams.imageSR = sr;

      // we pass the bbox in 4326 (lat,lng)
      this._layerParams.bboxSR = (sr === 3857) ? 4326 : sr;
    }

    this._update();
  },

  onRemove: function (map) {
    if(this._image){
      map.getPanes().overlayPane.removeChild(this._image);
      this._image = null;
    }

    map.off("moveend", this._moveHandler, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  },

  setUrl: function(){},

  _imageQueue: {},

  _animateZoom: function (e) {
    console.log("animate zoom");
    var map = this._map,
        image = this._image,
        scale = map.getZoomScale(e.zoom),
        nw = this._bounds.getNorthWest(),
        se = this._bounds.getSouthEast(),

        topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
        size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
        origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

    image.style[L.DomUtil.TRANSFORM] =
            L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
  },

  _parseLayers: function () {
    if (typeof this._layerParams.layers === 'undefined') {
      delete this._layerParams.layerOption;
      return;
    }

    var action = this._layerParams.layerOption || null,
        layers = this._layerParams.layers || null,
        verb = 'show',
        verbs = ['show', 'hide', 'include', 'exclude'];

    delete this._layerParams.layerOption;

    if (!action) {
      if (layers instanceof Array) {
        this._layerParams.layers = verb + ':' + layers.join(',');
      } else if (typeof layers === 'string') {
        var match = layers.match(':');

        if (match) {
          layers = layers.split(match[0]);
          if (Number(layers[1].split(',')[0])) {
            if (verbs.indexOf(layers[0]) !== -1) {
              verb = layers[0];
            }

            layers = layers[1];
          }
        }
        this._layerParams.layers = verb + ':' + layers;
      }
    } else {
      if (verbs.indexOf(action) !== -1) {
        verb = action;
      }

      this._layerParams.layers = verb + ':' + layers;
    }
  },

  _parseLayerDefs: function () {
    if (typeof this._layerParams.layerDefs === 'undefined') {
      return;
    }

    var layerDefs = this._layerParams.layerDefs;

    var defs = [];

    if (layerDefs instanceof Array) {
      var len = layerDefs.length;
      for (var i = 0; i < len; i++) {
        if (layerDefs[i]) {
          defs.push(i + ':' + layerDefs[i]);
        }
      }
    } else if (typeof layerDefs === 'object') {
      for (var layer in layerDefs) {
        if(layerDefs.hasOwnProperty(layer)){
          defs.push(layer + ':' + layerDefs[layer]);
        }
      }
    } else {
      delete this._layerParams.layerDefs;
      return;
    }
    this._layerParams.layerDefs = defs.join(';');
  },

  _getImageUrl: function () {
    var size = this._map.getSize();

    this._layerParams.bbox = this._map.getBounds().toBBoxString();
    this._layerParams.size = size.x + ',' + size.y;

    var url = this.serviceUrl + 'export' + L.Util.getParamString(this._layerParams);

    return url;
  },

  _update: function (e) {
    console.log("update");
    if (this._map._panTransition && this._map._panTransition._inProgress) {
      return;
    }

    var zoom = this._map.getZoom();
    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
      return;
    }

    var bounds = this._map.getBounds();

    var newImage = L.DomUtil.create('img', 'leaflet-image-layer');

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      L.DomUtil.addClass(newImage, 'leaflet-zoom-animated');
    } else {
      L.DomUtil.addClass(newImage, 'leaflet-zoom-hide');
    }

    L.Util.extend(newImage, {
      galleryimg: 'no',
      onselectstart: L.Util.falseFn,
      onmousemove: L.Util.falseFn,
      onload: L.Util.bind(this._onNewImageLoad,this),
      src: this._getImageUrl(),
      'data-bounds': bounds.toBBoxString()
    });

    this._imageQueue[bounds.toBBoxString()] = newImage;

    this.fire('loading', {
      bounds: bounds
    });
  },

  _onNewImageLoad: function(e) {
    console.log("image loaded");
    if(e.target){
      var newImage = e.target,
          bbox = newImage['data-bounds'].split(','),
          bounds = L.latLngBounds([[bbox[1],bbox[0]], [bbox[3],bbox[2]] ]),
          nw = L.latLng(bounds._northEast.lat, bounds._southWest.lng),
          se = L.latLng(bounds._southWest.lat, bounds._northEast.lng),
          topLeft = this._map.latLngToLayerPoint(nw),
          size = this._map.latLngToLayerPoint(se)._subtract(topLeft);
          mapBounds = this._map.getBounds();

      if(bounds.equals(mapBounds)){
        console.log("replaceing");
        L.DomUtil.setPosition(newImage, topLeft);

        newImage.style.width = size.x + 'px';
        newImage.style.height = size.y + 'px';

        if (this._image == null) {
          if(this.options.position === 'back' && this._map._panes.overlayPane.children.length){
            this._map._panes.overlayPane.insertBefore(newImage, this._map._panes.overlayPane.children[0]);
          } else {
            this._map._panes.overlayPane.appendChild(newImage);
          }
        } else {
          this._map._panes.overlayPane.insertBefore(newImage, this._image);
          this._map._panes.overlayPane.removeChild(this._image);
        }

        this._image = newImage;
        this._bounds = bounds;

        this._updateOpacity();

        this.fire('load', {
          bounds: bounds
        });
      }

      delete this._imageQueue[newImage['data-bounds']];
    }
  }
});

L.esri.dynamicMapLayer = function (url, options) {
  return new L.esri.DynamicMapLayer(url, options);
};
