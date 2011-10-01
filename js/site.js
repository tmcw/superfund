var map;
var mm = com.modestmaps;
$.domReady(function() {

    function googleDirections(a, b) {
        return 'http://maps.google.com/maps?saddr={source}&daddr={dest}'
            .replace('{source}', a.lat + ',' + a.lon)
            .replace('{dest}', encodeURIComponent(b));
    }

    function gridQuery(l) {
      utfgridquery('http://d.tiles.mapbox.com/tmcw/1.0.0/superfundvoronoi/layer.json', {
        lat: l.lat,
        lon: l.lon
        }, function(f) {
            $('.your-name').text(f.FAC_NAME);
            $('.your-location').html(f.LOC_ADD + '<br />' + f.LOC_CITY + ', ' + f.LOC_STATE);
            $('.your-directions').attr('href', googleDirections(l, f.LOC_ADD + ' ' + f.LOC_CITY + ' ' + f.LOC_STATE));
            easey.slow(map, {
                location: new mm.Location(l.lat, l.lon),
                zoom: 7,
                time: 1000
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
        wax.mm.zoomer(map).appendTo(map.parent);
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
