var fs = require('fs'),
    csv = require('csv');
    _ = require('underscore');

// var f = fs.readFileSync(process.argv[2], 'utf8');
// 
// var lines = f.split('\n');
// 
// var headers = lines[0].split(',');
// var data = lines.splice(1);
// 
// function a(keys, data) {
//     var o = {};
//     for (var i = 0; i < keys.length; i++) {
//         o[keys[i]] = data[i];
//     }
//     return o;
// }
// 
// function b(keys) {
//     return function(data) {
//         console.log(data.match(/^(("(?:[^"]|"")*"|[^,]*)(,("(?:[^"]|"")*"|[^,]*))*)$/));
//         return a(keys, data.split(','));
//     };
// }
// 
// var objects = data.map(b(headers));
    //
var objects = [];

csv()
.fromPath(process.argv[2],{
    columns: true
})
.transform(function(data){
    objects.push(data);
    return data;
})
// .on('error', function() {
//     console.log('... error ...');
// })
.on('end', function() {
    var groups = _.groupBy(objects, function(o) {
        return o.site_epa_id;
    });
    for (var site_epa_id in groups) {
        if (!site_epa_id) continue;
        fs.writeFileSync('sites/' + site_epa_id + '.json', JSON.stringify(_(groups[site_epa_id]).sortBy(function(g) { return g.ou_sort_id; })), 'utf8');
    }
});

// var groups = _.groupBy(objects, function(o) {
//     return o.site_epa_id;
// });
// 
// for (var site_epa_id in groups) {
//     if (!site_epa_id) continue;
//     fs.writeFileSync('sites/' + site_epa_id + '.json', JSON.stringify(groups[site_epa_id]), 'utf8');
// }
