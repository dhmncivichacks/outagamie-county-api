var express = require('express');
var fetch = require('node-fetch');
var nextRecycleDate = require('outagamie-county-recycling').getNextRecycleDate;
var app = express();
var server;

function sendError(res, message) {
    res.status(500);
    res.json({
        error: message
    });
    res.end();
}

app.get('/', function (req, res) {
    res.end('Welcome!');
});

app.get('/garbagecollection', function (req, res) {
    var addr = req.query.addr;
    if (!addr) {
        return sendError(res, 'No `addr` parameter provided!');
    }
    var googleapi = 'http://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(addr);
    fetch(googleapi).then(function (response) {
        return response.json();
    }).then(function (json) {
        if (!json.results || !json.results[0]) {
            Promise.reject(new Error('No address found!'));
        }
        return json.results[0].geometry.location;
    }).then(function (location) {
        var result = [
            {
                collectionType: 'recycling',
                collectionDate: nextRecycleDate([location.lng, location.lat]).toISOString()
            }
        ];
        res.json(result);
        res.end();
    }).catch(function (err) {
        console.log(err);
        sendError(res, err.message);
    })
});

server = app.listen(process.env.PORT || 3000, function () {
    var address = server.address();
    console.log('Listening on http://%s:%s', address.address, address.port);
});


//[{"collectionType":"trash","collectionDate":"2015-10-23"},{"collectionType":"trash","collectionDate":"2015-10-30"},{"collectionType":"recycling","collectionDate":"2015-10-30"},{"collectionType":"trash","collectionDate":"2015-11-06"},{"collectionType":"trash","collectionDate":"2015-11-13"},{"collectionType":"recycling","collectionDate":"2015-11-13"}]
