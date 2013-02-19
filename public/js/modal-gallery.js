/**
 * Modal Gallery Code
 *
 * This is also reliant on the 'Center Plugin' in the plugins.js file
 *
 * Adam Scoble
 * ascoble@igloo.com.au
 *
 * .gallery-heading - put this on a tag to have its contents used as the modal heading - otherwise put a span.gallery-heading around some text
 * .gallery-copy - put this on a tag to have its contents included in the modal popup, works on ULs as well
 * data-gallery="true" - put this on an anchor tag to be included in the gallery
 *
 * Markup below:
 *
 * Video gallery item:
 * <a class="slide1" data-gallery="true" data-gallery-type="video" data-gallery-src="39910" href="#"><p class="gallery-copy">This will appear in the gallery.</p><p class="gallery-copy gallery-hidden">This will appear in the gallery.</p></a>
 *
 * Image gallery item:
 * <a class="slide1" data-gallery="true" data-gallery-heading="Modal Heading" data-gallery-type="image" data-gallery-src="link-to-image-file.jpg" href="#">Link</a>
 *
 * Image with text gallery item:
 * <a class="slide1" data-gallery="true" data-gallery-heading="Modal Heading" data-gallery-type="image" data-gallery-src="link-to-image-file.jpg" href="#"><p class="gallery-copy">This will appear in the gallery.</p><p>This won't appear in the gallery.</p><p class="gallery-copy gallery-hidden">This will appear in the gallery.</p></a>
 *
 * Text gallery item:
 * <a class="slide1" data-gallery="true" data-gallery-type="text" href="#"><p class="gallery-copy">This will appear in the gallery.</p><span class="gallery-heading">This will be the gallery heading</span></p></a>
 *
 * Fullscreen item !! IMPORTANT: Fullscreen items shouldn't have the data-gallery="true" attribute !!:
 * <a data-gallery-type="fullscreen" data-gallery-src="39910" href="#">This will be a fullscreen video item</a>
 *
 * To call a new gallery use:
 * var newGallery = new Gallery();
 * Additionally you can use a different selector (for different slides, etc.):
 * var newGallery = new Gallery({ gallerySearchString : '#slide1'});
 */

window.Mazda = window.Mazda || {};

(function ($, window, document, undefined) {
    function Gallery(options){
        this.items = []; // Array that stores all gallery items, populated in _init()
        this.config = $.extend({}, this.defaults, options || {});
        this.overlay;
        this.modal;
        this.currentItemIndex;
        this.closeButton;
        this.headingSpan;
        this.currentItemSpan;
        this.totalItemsSpan;
        this.active = false;
        this.videoCanClose = true;
        this.specsLoaded = false;

        this._init();
    }

    Gallery.prototype = {
        defaults: {
            gallerySearchString: 'div', // Selector string used to create gallery links
            galleryItems: true,
            specWindow: true,
            fadeTime: 200 // Animation length of overlay fade in and modal fade in (2 x this value is total animation time)
        },
        _init : function(){
            if(this.config.galleryItems){
                this._BuildGalleryItems();
            }

            this._BuildFullscreenItems();
            this._BuildModalAndOverlay();
            
            if(this.config.specWindow){
                this._BuildSpecItems();
            }
        },
        _BuildGalleryItems : function(){
            var self = this,
                $galleryItems = $(this.config.gallerySearchString + ' [data-gallery]');

            if($galleryItems.length){
                $galleryItems.each(function(index, elem){
                    var galleryItem = new GalleryItem(index, elem);
                    self.items.push(galleryItem);
                    $(elem).on('click', function(event){
                        event.preventDefault();
                        self.show(this);
                    });
                });
            } else {
                // console.log("Modal-Gallery Error #0001: Please update your gallery search string to match your data attribute");
            }
        },
        _BuildFullscreenItems : function(){
            var self = this,
                $fullscreenItems = $(this.config.gallerySearchString + ' [data-gallery-type="fullscreen"]');
            if($fullscreenItems.length){
                $fullscreenItems.each(function(index, elem){
                    $(elem).on('click', function(event){
                        event.preventDefault();
                        self.playFullScreenVideo(this);
                    });
                });
            }

            //This is for all modal video links if the modal is disabled, they will instead show as full screen.
            if(!this.config.galleryItems){
                var $galleryItems = $(this.config.gallerySearchString + ' [data-gallery-type="video"]');

                if($galleryItems.length){
                    $galleryItems.each(function(index, elem){
                        $(elem).on('click', function(event){
                            event.preventDefault();
                            self.playFullScreenVideo(this);
                        });
                    });
                }

            }
        },
        _BuildSpecItems : function(){
            var self = this,
                $specItems = $(this.config.gallerySearchString + ' [data-gallery-type="specs"]');

            if($specItems.length){
                $specItems.each(function(index, elem){
                    $(elem).on('click', function(event){
                        event.preventDefault();
                        self.showSpecWindow();
                    });
                });
            }
        },
        _BuildModalAndOverlay : function(){
            this.overlay = $('#gallery-overlay');
            this.modal = $('#gallery-modal');

            var $body = $('body');

            if(!this.overlay.length){
                var overlayMarkup = $('<div id="gallery-overlay"></div>');
                $body.append(overlayMarkup);
                this.overlay = $('#gallery-overlay');
            } else {
                // console.log("Modal-Gallery Warning: Overlay already exists, using existing overlay");
            }

            if(!this.modal.length){
                //This is the markup for the specifications table
                // var specMarkup = $('#tmpl-specs').html();
                var modalMarkup = $('<div id="gallery-modal"><h3></h3><div class="gallery-content"></div><div class="gallery-footer"><span class="current-item"></span><span class="slash">&nbsp;/&nbsp;</span><span class="total-items"></span></div><a class="prev" href="#"></a><a class="next" href="#"></a><a class="close" href="#"></a></div>');
                var specsUrl = $(".specs-page").attr("data-specs-url");
                $body.append(modalMarkup);
                this.modal = $('#gallery-modal');
                this._fetchSpecs(specsUrl);
            } else {
                // console.log("Modal-Gallery Warning: Modal already exists, using existing modal");
            }

            this._RemoveTableWhitespace();

            this.modal = $('#gallery-modal');
            this.headingSpan = $('#gallery-modal h3');
            this.contentContainer = $('#gallery-modal div.gallery-content');
            this.currentItemSpan = $('#gallery-modal span.current-item');
            this.slashSpan = $('#gallery-modal span.slash');
            this.totalItemsSpan = $('#gallery-modal span.total-items');
            this.prevButton = $('#gallery-modal a.prev');
            this.nextButton = $('#gallery-modal a.next');
            this.closeButton = $('#gallery-modal a.close');

            /**
             * The below code uses a short plugin contained in plugin.js
             */
            this.modal.center();
            var self = this;
            $(window).bind('resize', function() {
                self.modal.center();
            });
        },
        _RemoveTableWhitespace : function(){
            var expr = new RegExp('>[ \t\r\n\v\f]*<', 'g'),
                tbhtml = $('.specifications-set table');

            tbhtml.each(function(index, elem){
                var $elem = $(elem),
                    html = $elem.html();
                $elem.html(html.replace(expr, '><'));
            });

        },
        _ToggleClickListeners : function(){
            var self = this,
                specModal = this.modal.hasClass('specs');

            this.active = !this.active;
            
            if(this.active){
                this.overlay.on('click', function(e){
                    self.hide();
                    e.preventDefault();
                });

                this.closeButton.on('click', function(e){
                    self.hide();
                    e.preventDefault();
                });
                this.prevButton.on('click', function(e){
                    self._GoToPrevItem();
                    e.preventDefault();
                });
                this.nextButton.on('click', function(e){
                    self._GoToNextItem();
                    e.preventDefault();
                });

            } else {
                this.overlay.off('click');
                this.closeButton.off('click');
                this.prevButton.off('click');
                this.nextButton.off('click');

                // if(specModal){
                //     $tabSet.find('a').each(function(index, elem){
                //         $(elem).off('click');
                //     });

                //     $tableTabs.find('a').each(function(index, elem){
                //         $(elem).off('click');
                //     });
                // }
            }


        },
        _GetIndexFromElement : function(element){
            var index,
                elem = element;
            jQuery.each(this.items, function(i, item){
                if(item.elem == elem){
                    index = i;
                }
            });
            return index;
        },
        _CheckNavigationDisabledClass : function(index){
            var firstSlide = (index === 0) ? true : false,
                lastSlide = (index == this.items.length - 1) ? true : false;

            if(firstSlide && lastSlide) {
                this.slashSpan.addClass('hide');
                this.prevButton.addClass('hide');
                this.nextButton.addClass('hide');
            } else if(firstSlide){
                this.slashSpan.removeClass('hide');
                this.prevButton.removeClass('hide');
                this.nextButton.removeClass('hide');
                this.prevButton.addClass('disabled');
                this.nextButton.removeClass('disabled');
            } else if(lastSlide){
                this.slashSpan.removeClass('hide');
                this.nextButton.removeClass('hide');
                this.prevButton.removeClass('hide');
                this.nextButton.addClass('disabled');
                this.prevButton.removeClass('disabled');
            } else {
                this.slashSpan.removeClass('hide');
                this.prevButton.removeClass('hide');
                this.nextButton.removeClass('hide');
                this.prevButton.removeClass('disabled');
                this.nextButton.removeClass('disabled');
            }
        },
        _GetItemMediaMarkup : function(index){
            var markup;
            if ( this.items[index].type == 'image' && this.items[index].src) {
                markup = '<img class="gallery-media" src="' + this.items[index].src + '" />';
            } else if ( this.items[index].type == 'video' && this.items[index].src){
                markup = '<div id="movideo-holder"></div>';
            } else {
                markup = '';
            }

            return markup;
        },
        _GoToPrevItem : function(){
            var index = (this.currentItemIndex > 0) ? this.currentItemIndex - 1 : 0;

            this._GoToItem(index);
        },
        _GoToNextItem : function(){
            var index = (this.currentItemIndex != this.items.length - 1) ? this.currentItemIndex + 1 : this.items.length - 1;
            this._GoToItem(index);
        },
        _GoToItem : function(index){
            if(index != this.currentItemIndex && this.videoCanClose){
                this._destroyVideo();

                var item = this.items[index],
                    mediaMarkup = this._GetItemMediaMarkup(index);

                this._CheckNavigationDisabledClass(index);

                this.currentItemIndex = index;

                this.headingSpan.empty().html(item.heading);

                this.contentContainer.empty().html(mediaMarkup + item.copyMarkup);

                if(this.items[index].type == 'video' && this.items[index].src){
                    this._ieBlockVideoClose();

                    var movId = this.items[index].src;

                    this._callMovideoPlayer(movId);
                }

                if(this.items.length > 1){
                    this.currentItemSpan.empty().html((item.index + 1).toString());
                } else {
                    this.currentItemSpan.empty();
                }
            }
        },
        show : function(element){
            var self = this,
                elem = element;

            if(!this.active){
                this.modal.center();
                var index = this._GetIndexFromElement(elem);

                this._ToggleClickListeners();
                this._CheckNavigationDisabledClass(index);

                var itemLength = this.items.length;
                if(itemLength > 1){
                    this.totalItemsSpan.empty().html(itemLength);
                } else {
                    this.totalItemsSpan.empty();
                }

                this.overlay.css('filter', 'alpha(opacity=50)');
                this.overlay.fadeIn(self.config.fadeTime, function(){
                    if(self.active){ // Allows the gallery to be closed while opening
                        self.modal.fadeIn(self.config.fadeTime, function(){
                            self._GoToItem(index);
                        });
                    }
                });

                $(window).trigger('Gallery:show', this);

                this.initKeyStrokes();
            }
        },
        hide : function(){
            var self = this;

            if(this.active && this.videoCanClose){
                this._ToggleClickListeners();

                this.currentItemIndex = null;

                this._destroyVideo();

                this.modal.fadeOut(self.config.fadeTime, function(){
                    self.headingSpan.empty();
                    self.contentContainer.empty();
                    self.currentItemSpan.empty();
                    if(!self.active){ // Allows the gallery to be opened while closing
                        self.overlay.fadeOut(self.config.fadeTime, function(){
                            if(self.modal.hasClass('fullscreen')){
                                self.modal.removeClass('fullscreen');
                                self.modal.center();
                            }

                            if(self.modal.hasClass('specs')){
                                self.modal.removeClass('specs');
                                self.modal.center();
                            }
                        });
                    }
                });
                self.disableNav();
                $(window).trigger('Gallery:hide', this);
            }
        },
        initKeyStrokes : function(){
            var gallery = this;

            $(document).bind('keydown.theStrokes', function(e){
                var direction = {left: 37, up: 38, right: 39, down: 40 }
                switch (e.keyCode) {
                    case direction.left:
                        gallery._GoToPrevItem();
                        break;
                    case direction.right:
                        gallery._GoToNextItem();
                        break;
                };
            });
        },
        disableNav : function(){
            $(document).unbind('keydown.theStrokes');
        },
        playFullScreenVideo : function(elem){
            this.modal.addClass('fullscreen');
            this.modal.center();

            var self = this,
                element = elem;

            if(!this.active){
                
                this._ieBlockVideoClose();
                
                this._ToggleClickListeners();

                this.overlay.css('filter', 'alpha(opacity=50)');
                this.overlay.fadeIn(self.config.fadeTime, function(){
                    if(self.active){ // Allows the gallery to be closed while opening
                        self.modal.fadeIn(self.config.fadeTime, function(){
                            var mediaMarkup = '<div id="movideo-holder"></div>',
                                movId = $(element).data().gallerySrc;

                            self.contentContainer.empty().html(mediaMarkup);

                            self._callMovideoPlayer(movId);
                        });
                    }
                });
            }
            $(window).trigger('Gallery:show', this);
        },
        showSpecWindow : function(){
            this.modal.addClass('specs');
            this.modal.center();

            var self = this;

            if(!this.active){

                this._ToggleClickListeners();

                this.overlay.css('filter', 'alpha(opacity=50)');
                this.overlay.fadeIn(self.config.fadeTime, function(){
                    if(self.active){ // Allows the gallery to be closed while opening
                        self.modal.fadeIn(self.config.fadeTime, function(){
                            self.contentContainer.empty();
                        });
                    }
                });
            }
            $(window).trigger('Gallery:show', this);
        },
        _fetchSpecs: function(specsUrl) {
            var specsUrl = specsUrl;
            $.ajax({
                url: specsUrl,
                method: 'GET',
                dataType: 'html',
                async: true,
                success: $.proxy(this._appendSpecs, this)
            });
            $('#gallery-modal')
                .addClass('specs-loading')
                .prepend('<div id="specs-loading">Loading Full Specifications...</div>');
        },
        _appendSpecs: function(html) {
            var self = this;
            $('#gallery-modal')
                .prepend(html)
                .removeClass('specs-loading')
                .find('#specs-loading')
                    .remove();
                self.specsLoaded = true;
                self._bindSpecs();

        },
        _bindSpecs: function() {
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
                
        },
        _callMovideoPlayer : function(movId){
            this.player = $('#movideo-holder').player({
                apiKey:'movideoIgloo',
                iosAppAlias: 'ipad-application',
                flashAppAlias: 'universal-flash',
                mediaId:movId,
                autoPlay: true
            });
        },
        /**
         * Pausing the movideo player before we hide the modal in <=IE9. The player seems to be 
         * firing progress events even after the modal is closed, which is causing errors in IE. 
         * So we pause the player to stop those progress events firing.
         */
        _ieBlockVideoClose : function(){
            var self = this,
                isFlashEnabled = MOVIDEO.utils.getDevice().flashEnabled,
                lessThanIE9 = $('html').hasClass('lt-ie9');
            if(isFlashEnabled && lessThanIE9){
                this.videoCanClose = false;
                
                this.modal.bind("playerplay", function(event, data) {
                    self.videoCanClose = true;
                });
            }

            
        },
        _destroyVideo: function() {
            
            // console.log('_destroyVideo: attempting');
            if (this.contentContainer.find('#movideo-holder').length) {
                // console.log('_destroyVideo: destroyiung');
                this.player.player('stop');
                this.player = null;
                this.contentContainer.find('#movideo-holder').trigger('playerremoved').remove();
            }
        }
    };

    function GalleryItem(index, elem){
        this.index = index;
        this.elem = elem;
        this.$elem = $(elem);
        this.data = this.$elem.data();
        this.heading = '';
        this.type = '';
        this.src = '';
        this.copyMarkup = '';

        this._init();
    }

    GalleryItem.prototype = {
        _init : function(){
            this._GetElementData();
        },
        _GetElementData : function(){
            this.heading = this._GetElementHeading();
            this.type = this._GetElementType();
            this.src = this._GetElementSrc();
            this.copyMarkup = this._GetCopyMarkup();
        },
        _GetElementHeading : function(){
            var $heading = this.$elem.find('.gallery-heading'),
                heading;

            if(this.data.galleryHeading){
                heading = this.data.galleryHeading;
            } else if($heading.length){
                heading = $heading.html();
            } else {
                heading = '';
            }
            return heading;
        },
        _GetElementType : function(){
            var type = (this.data.galleryType) ? this.data.galleryType : 'image';
            return type;
        },
        _GetElementSrc : function(){
            var src = (this.data.gallerySrc) ? this.data.gallerySrc : '';
            return src;
        },
        _GetCopyMarkup : function(){
            var $paragraphs = this.$elem.find('.gallery-copy'),
            copyMarkup = '';
            if($paragraphs){
                $paragraphs.each(function(index, elem){
                    var paragraphWithoutBreaks = $(elem).html().replace(/<br\s?\/?>/gi, ' ');
                    if ($(elem).is('ul')){
                        copyMarkup += '<ul>' + paragraphWithoutBreaks + '</ul>';
                    } else {
                        copyMarkup += '<p>' + paragraphWithoutBreaks + '</p>';
                    }
                });
            } else {
                copyMarkup = '';
            }
            
            return copyMarkup;
        }
    };

    // expose constructor to the global object
    window.Mazda.Gallery = Gallery;

    // var gaz1 = new Gallery({gallerySearchString: '#frame1'});
    // var gaz2 = new Gallery({gallerySearchString: '#frame2'});
    // var gaz3 = new Gallery({gallerySearchString: '#frame3'});
    // var gaz4 = new Gallery({gallerySearchString: '#frame4'});
    // var gaz5 = new Gallery({gallerySearchString: '#frame5'});
    // var gaz6 = new Gallery({gallerySearchString: '#frame6'});
    // var gaz7 = new Gallery({gallerySearchString: '#frame7'});
    // var gaz8 = new Gallery({gallerySearchString: '#frame8'});
    // var gaz9 = new Gallery({gallerySearchString: '#frame9'});
    // var gaz10 = new Gallery({gallerySearchString: '#frame10'});
    // var gaz11 = new Gallery({gallerySearchString: '#frame11'});
    // var gaz12 = new Gallery({gallerySearchString: '#frame12'});
    // var gaz13 = new Gallery({gallerySearchString: '#frame13'});
    // var gaz14 = new Gallery({gallerySearchString: '#frame14'});
    // var gaz15 = new Gallery({gallerySearchString: '#frame15'});
    // var gaz16 = new Gallery({gallerySearchString: '#frame16'});
    // var gaz17 = new Gallery({gallerySearchString: '#frame17'});
    // var gaz18 = new Gallery({gallerySearchString: '#frame18'});
    // var gaz19 = new Gallery({gallerySearchString: '#frame19'});

})(jQuery, window, document);

