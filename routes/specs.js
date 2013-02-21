
/*
 * GET specs.
 */

exports.fetch = function(req, res){

    var _       = require('underscore'),
        jsdom   = require('jsdom'),
        request = require('request');

    var model       = req.params.model,
        isMinified  = req.query.minified == 'true' ? true : false;
        modifier    = req.query.modifier;

    console.log('Model requested: ', model, req.params, req.query, isMinified);

    request(
        { uri: 'http://www.mazda.com.au/vehicles/'+ model +'/specifications' },
        function (error, response, body) {

            // swift error checking
            if (error && response.statusCode !== 200) {
                console.log('Request error.');
                // TODO: render error page here... make sure error check includes case when unknown model selected
            }

            // console.log(response);

            // data for specs
            var specs = [];

            var tickUrl   = 'http://www.mazda.com.au/brochures/base-framework/img/specs/specs_tick.gif',
                falseString  = '-';

            jsdom.env(
                {
                    html:       body,
                    scripts:    ['http://code.jquery.com/jquery.min.js']
                },
                function (error, window) {
                    var $       = window.jQuery,
                        $body   = $(window.document.body),
                        $styles = $('.spec-body');

                    // For each Body Style (Sedan, Wagon, etc.)
                    $styles.each(_parseBodyStyleHtml);

                    // console.log(specs);
                    // console.log('FIRST BODY STYLE CATEGORIES YO: ', _.pluck(specs[0].categories, 'name'));

                    // res.send('There are ' + $styles.length + ' body style(s) for the ' + model);
                    var carName = $body.find('h1').text().replace(' Specifications','');
                    res.render(
                        'specs',
                        {
                            title:      carName,
                            styles:     specs,
                            modifier:   modifier,
                            pretty:     !isMinified
                        }
                    );

                    function _parseBodyStyleHtml(i,bodyStyle) {
                        var style = {
                            name:           '',
                            image:          '',
                            slug:           '',
                            grades:         [],
                            categories:     []
                        };

                        var $bodyStyle  = $(bodyStyle),
                            $cats       = $bodyStyle.find('.spec-cat');

                        // Create array of grade names (e.g. 'Sport', 'Touring', etc.)
                        $cats.first().find('table thead th').each(function (i,grade) {
                            // the first <th> is not a grade header
                            if (i === 0) {
                                return;
                            }
                            style.grades.push( $.trim($(grade).text()) );
                        });

                        // Assign Body Style name (e.g. 'Sedan')
                        style.name  = $.trim( $bodyStyle.find('h3').text() );
                        style.image = 'http://www.mazda.com.au' + $('#specs-body').find('li').eq(i).find('img').attr('src');
                        style.slug  = slugify(style.name);

                        // Collect specs for each category (e.g. 'Powertrain', 'Chassis', etc.)
                        $cats.each(function (i,cat) {
                            var $cat    = $(cat),
                                $rows  = $cat.find('tbody tr');

                            var category    = {};
                            // category.name   = $.trim( $cat.children('h4').text() );
                            category.name   = $.trim( $('.specs-tabs').first().find('li').eq(i).text() );
                            category.specs  = [];
                            category.slug   = slugify(category.name);

                            // collect each row's cell data
                            $rows.each(function (i,rowHtml) {
                                var $row = $(rowHtml),
                                    row = [];

                                $row.find('td').each(function (i,cell) {
                                    var $cell = $(cell);

                                    // strip out any <sup> elems
                                    $cell.find('sup').remove();

                                    var text    = $.trim( $(cell).text() ),
                                        hasTick = $cell.html().search('/images/specs/tick.gif') !== -1,
                                        hasDash = text === '-';

                                    if (hasTick) {
                                        // assign true boolean as cell value if cell has a tick image
                                        row.push(tickUrl);
                                    }
                                    else if (hasDash) {
                                        row.push(falseString);
                                    }
                                    else {
                                        row.push(text);
                                    }

                                });

                                category.specs.push(row);
                            });

                            style.categories.push(category);
                        });

                        // Append Body Style object to main specs array
                        specs.push( style );
                    }

                    /**
                     * Transform text into a URL slug: spaces turned into dashes, remove non alnum
                     * @param string text
                     */
                    function slugify(text) {
                        text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
                        text = text.replace(/-/gi, "_");
                        text = text.replace(/\s/gi, "-");
                        text = text.toLowerCase();
                        return text;
                    }
                }
            );
        }
    );

};