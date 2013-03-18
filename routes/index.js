
/*
 * GET home page.
 */

exports.index = function(req, res){

    var _       = require('underscore'),
        cheerio = require('cheerio'),
        request = require('request');


    /**
     * Mazda Vehicles Module
     */
    var mazdaModels = (function () {

        var host        = 'http://www.mazda.com.au/',
            vehicles    = [],
            initialised = false;

        // request Mazda Vehicles page
        request( { uri: host + 'vehicles/' }, requestHandler );

        function requestHandler(error, response, body) {
            if (error && response.statusCode !== 200) {
                console.log('Request error in requestHandler()', error);
                // TODO: render error page here...
            }

            parsePage(body);
        }

        function parsePage(body) {
            var $               = cheerio.load(body),
                $vehicleLinks   = $('#vehicles').children('a');

            $vehicleLinks.each(function(i,link) {
                var $link = $(link);
                vehicles.push(
                    {
                        slug:   $link.attr('href').replace(/\/vehicles\//,''),
                        name:   $link.text(),
                        img:    host + $link.find('img').attr('src').split('?')[0]
                    }
                );
            });

            console.log(vehicles);
            initialised = true;
        }

        return {
            hasData: function() {
                return initialised;
            },
            getSlugs: function() {

            },
            getNames: function() {
                
            },
            getBySlug: function(slug) {

            },
            getAll: function() {
                return vehicles;
            }
        };

    }());


    /**
     * Renders the jade tempate
     */
    var renderPage = function() {
        res.render(
            'index',
            {
                title: 'Specs Crêpe',
                models: mazdaModels.getAll()
            }
        );
    };

    /**
     * Check if mazdaModels has data and render page when ready
     */
    (function ready() {
        setTimeout(function() {
            if (!mazdaModels.hasData()) {
                ready();
            }
            else {
                renderPage();
            }
        }, 1000);
    }());

};