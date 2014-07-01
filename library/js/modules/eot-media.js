define([
    'jquery',
    'jquery.nouislider',
    'hammer.jquery',
    'require',
    'popcorn',
    'moddef',
    'when'
], function(
    $,
    _noui,
    _hmr,
    req,
    Popcorn,
    M,
    when
) {
    'use strict';

    // Page-level Module
    var Module = M({

        // Module Constructor
        constructor: function( opts ){

            var self = this;

            opts = opts || {};

            self.tracks = [];
            self.promises = [];
            self.currentTrack = 0;
            self.volume = 1;
            self.initEvents();

            self.timeUpdateCallback = function(){
                var track = self.tracks[ self.currentTrack ];
                if ( track ){
                    self.emit('time', track.currentTime()/track.duration());
                }
            };

            $.each(opts.tracks, function( i, id ){
                self.initTrack( id );
            });

            when.all( self.promises ).then(function(){
                self.initControls( opts.controls );
                self.setTrack( 0 );
                self.resolve('ready');
            }).otherwise(function(){
                console.log(arguments);
            });
        }

        ,initTrack: function( id ){

            var self = this
                ,m
                ,i = self.promises.length
                ,dfd = when.defer()
                ;

            $(function(){
                m = Popcorn( id );

                self.tracks[i] = m;

                m.on('canplayall', function(){
                    dfd.resolve( m );
                });
            });

            self.promises.push( dfd.promise );
            return dfd.promise;
        }

        ,setTrack: function( idx ){

            var self = this
                ,i = self.currentTrack
                ,track
                ;

            if ( idx >= 0 && idx < self.tracks.length ){
                track = self.tracks[ i ];
                track.pause();
                track.off('timeupdate', self.timeUpdateCallback);

                self.currentTrack = idx;
                track = self.tracks[ idx ];
                track.volume( self.volume );
                track.on('timeupdate', self.timeUpdateCallback);
                track.currentTime( 0 );
            }
        }

        ,initControls: function( id ){

            var self = this
                ,el = $(id)
                ,playing = false
                ,playBtn = $('<a href="#">').addClass('play').attr('title', 'play').appendTo( el )
                ,seek = $('<div>').addClass('seek').appendTo( el )
                ,volume = $('<div>').addClass('volume').appendTo( el )
                ;

            el.hammer().on('touch', '.play', function( e ){
                e.preventDefault();
                playing = !playing;
                el.toggleClass('playing', playing);
                self.emit(playing ? 'play' : 'pause');
            });

            seek.noUiSlider({
                start: 0,
                // step: 1,
                connect: 'lower',
                range: {
                    'min': 0,
                    'max': 100
                }
            });

            volume.noUiSlider({
                start: self.volume,
                // step: 1,
                connect: 'lower',
                range: {
                    'min': 0.1,
                    'max': 1
                }
            });

            self.on('time', function( e, pct ){
                seek.val( pct * 100 );
            });

            seek.on('slide', function(){
                if ( playing ){
                    self.emit('pause');
                }
                self.emit('seek', seek.val() / 100);
            }).on('set', function(){
                if ( playing ){
                    self.emit('play');
                }
            });

            volume.on('slide', function(){
                self.emit('volume', volume.val());
            });
        }

        // Initialize events
        ,initEvents: function(){

            var self = this;

            self.on('play', function(){
                var track = self.tracks[ self.currentTrack ];
                track.play();
            });
            self.on('pause', function(){
                var track = self.tracks[ self.currentTrack ];
                track.pause();
            });
            self.on('seek', function( e, t ){
                var track = self.tracks[ self.currentTrack ];
                track.currentTime( t * track.duration() );
            });

            self.on('volume', function( e, v ){
                var track = self.tracks[ self.currentTrack ];
                self.volume = v;
                track.volume( v );
            });
        }

    }, ['events']);

    return Module;
});
