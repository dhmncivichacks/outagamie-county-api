var express = require('express');
var cors = require('cors');
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

app.use(cors());

app.get('/', function (req, res) {
    res.end('Welcome!');
});

app.get('/garbagecollection', function (req, res) {
    var addr = req.query.addr;
    if (!addr) {
        return sendError(res, 'No `addr` parameter provided!');
    }
    var googleapi = `http://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GoogleApiKey}&address=${encodeURIComponent(addr)}`;
    fetch(googleapi).then(function (response) {
        return response.json();
    }).then(function (json) {
        if (!json.results || !json.results[0]) {
            return Promise.reject(new Error('No address found!'));
        }
        return json.results[0].geometry.location;
    }).then(function (location) {
        var result = [
            {
                collectionType: 'recycling',
                collectionDate: nextRecycleDate([location.lng, location.lat]).toISOString().split('T')[0]
            }
        ];
        res.json(result);
        res.end();
    }).catch(function (err) {
        console.log(err);
        sendError(res, err.message);
    });
});

server = app.listen(process.env.PORT || 3000, function () {
    var address = server.address();
    console.log('Listening on http://%s:%s', address.address, address.port);
});
