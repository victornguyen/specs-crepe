(function ($) {

	$(function() {

        var CREPE = {

            select: (function () {

                // cache elems
                var model       = null, // set in _setSelectedModel()
                    $dropdown   = $('#dropdown'),
                    $trigger    = $dropdown.children('.btn'),
                    $options    = $dropdown.find('.dropdown-menu a'),
                    $modifier   = $('#modifier input'),
                    $minified   = $('#minified input'),
                    $submit     = $('#submit');
                    $help       = $('#help');

                // bind event handlers
                $options.click( _handleSelect );
                $submit.click( _handleSubmit );

                // create popover for modifier field
                $modifier.popover();

                function _handleSelect (e) {
                    e.preventDefault();
                    _setSelectedModel(this);
                    _setSelectLabel(model.name);
                    _enableSubmit();
                }

                function _handleSubmit(e) {
                    e.preventDefault();

                    var model = _getSelectedModel();

                    _setLoading(model.name);

                    CREPE.results.hide();

                    CREPE
                        .data.fetch( model.slug, _getModifier(), _isMinified() )
                        .then(function(response) {
                            CREPE.results.init(model, response);
                            _setSelectLabel(model.name);
                            _setReady();
                        });
                }

                function _setLoading(label) {
                    $submit.button('loading');
                }

                function _setReady() {
                    $submit.button('reset');
                }

                function _disableSubmit() {
                    $submit.attr('disabled', 'disabled');
                    // $help.fadeIn(100);
                }

                function _enableSubmit() {
                    $submit.removeAttr('disabled');
                    // $help.fadeOut(100);
                }

                function _setSelectedModel(option) {
                    var $option = $(option);
                    model = {
                        slug: $option.attr('href').replace(/#/,''),
                        name: $option.text(),
                        img:  $option.attr('data-img')
                    };
                    console.log('selected', model.slug);
                }

                function _getSelectedModel() {
                    return model;
                }

                function _isMinified() {
                    return $minified.is(':checked');
                }

                function _getModifier() {
                    return $modifier.val();
                }

                function _setSelectLabel (label) {
                    var defaultLabel    = 'Select a model',
                        spacing         = '&nbsp;&nbsp;&nbsp;';
                    $trigger
                        .html((label || defaultLabel) + spacing)
                        .append('<span class="caret"></span>');
                }

                return {
                    getSelectedModel: _getSelectedModel
                };

            }()),

            data: {
                fetch: function(slug, modifier, isMinified){
                    return $.get('/specs/' + slug, { minified:isMinified, modifier:modifier });
                }
            },

            results: (function () {

                var $results    = $('#results'),
                    $html       = $('#html'),
                    $img        = $('#image'),
                    $name       = $results.find('h3'),
                    $trigger    = $('#modal-trigger');

                $trigger.click(function() {
                    CREPE.modal.show();
                });

                // var editor = CodeMirror.fromTextArea(
                //     $html[0],
                //     {
                //         mode:           'text/html',
                //         tabMode:        'indent',
                //         lineWrapping:   true
                //     }
                // );

                // window.ed = editor;

                return {

                    init: function(model, html) {
                        console.log('results.init()', model.slug);

                        CREPE.modal.update(html);

                        this.updateHtml(html);
                        this.updateImage(model.img);
                        this.updateName(model.name);
                        this.show();
                    },

                    show: function() {
                        $results.fadeIn();
                    },

                    hide: function(){
                        $results.fadeOut(100);
                    },

                    updateHtml: function(html) {
                        $html.text(html);
                        // editor.setValue(html);
                        // editor.focus();
                        // editor.refresh();
                    },

                    updateImage: function(src) {
                        $img.attr('src', src);
                    },

                    updateName: function(name) {
                        $name.text(name);
                    }

                };

            }()),

            modal: (function () {

                var $modal      = $('#gallery-modal'),
                    $overlay    = $('#gallery-overlay'),
                    $close      = $modal.find('.close');

                $close.click(function(e) {
                    e.preventDefault();
                    CREPE.modal.close();
                });

                $overlay.click(function() {
                    CREPE.modal.close();
                });

                // ripped from modal-gallery.js
                function _bindTabs() {
                    // console.log('bdingin specs');
                    var $setContainer = $('#specifications-module'),
                        $tabContainers = $('.specifications-set'),
                        $tabSet = $setContainer.find('ul.tab-set li'),
                        $tableTabs = $tabContainers.find('ul.table-tabs li');

                    $tabSet.find('a').each(function(index, elem){
                        var $elem = $(elem);
                        $elem.on('click', function(event){
                            event.preventDefault();
                            $tabContainers.hide();
                            
                            var href = $elem.attr('href');
                            href = href.substring(href.indexOf('#'));

                            var $targetTabContainer = $setContainer.find(href);

                            $targetTabContainer.show();

                            $tabSet.removeClass('current');
                            $elem.parent().addClass('current');
                        });
                    });

                    $tableTabs.find('a').each(function(index, elem){
                        var $elem = $(elem),
                            $currentSet = $elem.parents('.specifications-set'),
                            $currentTableTabs = $currentSet.find('ul.table-tabs li'),
                            $tables = $currentSet.find('table:not(.table-headings)');
                        $elem.on('click', function(event){
                            event.preventDefault();
                            $tables.hide();

                            var href = $elem.attr('href');
                            href = href.substring(href.indexOf('#') + 1);

                            var $targetTable = $currentSet.find('.' + href);

                            $targetTable.show();

                            $currentTableTabs.removeClass('current');
                            $elem.parent().addClass('current');
                        });
                    });
                }

                return {

                    update: function(html){
                        $modal
                            .find('#specs')
                                .remove()
                                .end()
                            .prepend(html);
                        _bindTabs();
                    },

                    show: function() {
                        $modal
                            .addClass('specs')
                            .center();

                        $overlay
                            .css('filter', 'alpha(opacity=50)')
                            .fadeIn(200, function(){
                                $modal.fadeIn(200);
                            });
                    },

                    close: function() {
                        $modal.fadeOut(100, function(){
                            $overlay.fadeOut(100);
                        });
                    },

                    rebind: _bindTabs

                };

            }())

        };

        window.vic = CREPE.select;


	});

    /* Center Div Plugin (For modal gallery) */
    (function(b){b.fn.extend({center:function(a){a=b.extend({inside:window,transition:0,minX:0,minY:0,withScrolling:!0,vertical:!0,horizontal:!0},a);return this.each(function(){var d={position:"absolute"};if(a.vertical){var c=(b(a.inside).height()-b(this).outerHeight())/2;a.withScrolling&&(c+=b(a.inside).scrollTop()||0);c=c>a.minY?c:a.minY;b.extend(d,{top:c+"px"})}a.horizontal&&(c=(b(a.inside).width()-b(this).outerWidth())/2,a.withScrolling&&(c+=b(a.inside).scrollLeft()||0),c=c>a.minX?c:a.minX,b.extend(d,
    {left:c+"px"}));0<a.transition?b(this).animate(d,a.transition):b(this).css(d);return b(this)})}})})(jQuery);

}(jQuery));