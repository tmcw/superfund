var map;
var mm = com.modestmaps;
$.domReady(function() {
    wax.tilejson('http://tiles.mapbox.com/tmcw/api/Tileset/superfund_48b16e', function(tj) {
        map = new mm.Map('map',
            new wax.mm.connector(tj),
            null, [
                new mm.DragHandler(),
                new easey.DoubleClickHandler(),
                new easey.MouseWheelHandler(),
                new mm.TouchHandler()
            ]);
        map.setCenterZoom(new mm.Location(38, -96), 4);
        wax.mm.zoombox(map);
        wax.mm.interaction(map, tj, {
            animationOut: 'hide'
        });
    });
});
