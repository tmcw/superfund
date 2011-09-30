var map;
var mm = com.modestmaps;
$.domReady(function() {

    function gridQuery(l) {
      utfgridquery('http://d.tiles.mapbox.com/tmcw/1.0.0/superfundvoronoi/layer.json', {
        lat: l.lat,
        lon: l.lon
        }, function(f) {
            $('.your').html('<em>your superfund</em> <h2>' + f.FAC_NAME + ', <small>/' + f.LOC_CITY + ', ' + f.LOC_STATE + '</small></h3>');
            easey.slow(map, {
                location: new mm.Location(l.lat, l.lon),
                zoom: 9,
                time: 5000
            });
        });
    }

    if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(res) {
          gridQuery({
            lat: res.coords.latitude,
            lon: res.coords.longitude
          });
        });
    }

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
