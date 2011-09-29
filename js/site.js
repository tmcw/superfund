var map;
var mm = com.modestmaps;
$.domReady(function() {
    wax.tilejson('http://a.tiles.mapbox.com/tmcw/1.0.0/tmcw.superfund_1af9ac,mapbox.world-glass/layer.json', function(tj) {
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

    $('#butte').click(function(e) {
        e.preventDefault();
        easey.slow(map, {
            zoom:8,
            location: new mm.Location(
                46.07953676396906,
                -112.68265950280083)
        });
    });


    $('#lovecanal').click(function(e) {
        e.preventDefault();
        easey.slow(map, {
            zoom:8,
            location: new mm.Location(
                43.06919439483221,
                -78.93251611607292
            )
        });
    });
});
