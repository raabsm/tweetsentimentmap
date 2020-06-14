
function GoogleMap(mapElement, options){
    this.map = new google.maps.Map(map, options);
    this.markers = [];
    this.selectedMarker = null;
}

GoogleMap.prototype.addStyle = function(filePath){
    $.getJSON(filePath, function(style){
        var styledMapType = new google.maps.StyledMapType(style);
        this.map.mapTypes.set('styled_map', styledMapType);
    })
};

GoogleMap.prototype.loadGeoJson = function(filePath, idProperty, callback) {
    this.map.data.loadGeoJson(filePath, {idPropertyName: idProperty});
    google.maps.event.addListenerOnce(this.map.data, 'addfeature', function () {
        callback();
    });
};

GoogleMap.prototype.addMarker = function(marker){
    this.markers.push(marker);
};

GoogleMap.prototype.removeAllMarkersExceptSelected = function(){
    for(var i = 0; i<this.markers.length; i++){
        if(this.markers[i] !== this.selectedMarker)
            this.markers[i].setMap(null);
    }
    this.markers = [];
    if(this.selectedMarker != null){
        this.markers.push(this.selectedMarker);
    }
};

GoogleMap.prototype.addListener = function(eventType, funct){
    this.map.data.addListener(eventType, funct);
};

GoogleMap.prototype.setStyle = function(styleFeature){
    this.map.data.setStyle(styleFeature)
};

GoogleMap.prototype.deselectMarker = function(){
    this.selectedMarker = null;
};

GoogleMap.prototype.getSelectedMarker = function(){
    return this.selectedMarker;
};

GoogleMap.prototype.getMap = function(){
    return this.map;
};

GoogleMap.prototype.selectMarker = function(marker){
    this.selectedMarker = marker;
}






