define([
    'jquery',
    'hammer.jquery',
    'moddef',
    'when',
    'util/helpers',
    'modules/eot-media',
    'modules/stellar-solar-sim',
    'modules/eccentric-orbit-sim',
    'modules/eot-graph',
    'modules/axial-tilt-sim',
    'modules/ecliptic-tilt-sim',
    'modules/eot-map'
], function(
    $,
    _jqhmr,
    M,
    when,
    Helpers,
    EOTMedia,
    StellarSolarSim,
    EccentricOrbitSim,
    EOTGraph,
    AxialTiltSim,
    EclipticTiltSim,
    EOTMap
) {
    'use strict';

    var Pi2 = 2*Math.PI;
    var deg = Math.PI / 180;

    function calcEOTFromTilt( ang, tilt ){
        var RA = Math.atan( Math.tan( ang ) * Math.cos( tilt * deg ) ), eot;
        // tan is discontinuous... so we make it continuous
        RA += Math.floor(ang / Math.PI + 0.5) * Math.PI;
        eot = ang - RA;
        eot = Math.abs(eot) < 1e-6 ? 0 : eot;
        return eot;
    }

    // Page-level Mediator
    var Mediator = M({

        // Mediator Constructor
        constructor: function(){

            var self = this;
            self.sims = {};
            self.initEvents();

            self.media = EOTMedia({
                controls: '#media-controls'
                ,tracks: [
                    '../../media/stellar-v-solar'
                    ,'../../media/test'
                    ,'../../media/test'
                    ,'../../media/test'
                ]
            });

            $(function(){
                self.onDomReady();
                self.resolve('domready');
            });
        }

        ,initSlides: function(){

            var self = this
                ,slides = $('.slides > section')
                ,controls = $('<div>').addClass('slide-controls').appendTo('#viewport')
                ;

            controls.append('<a href="#" class="prev">back</a><a href="#" class="next">continue</a>');
            controls.hammer().on('touch', 'a', function( e ){
                e.preventDefault();
                var $this = $(this);
                if ( $this.hasClass('next') ){
                    self.emit('slide', self.currentSlide + 1);
                } else {
                    if ( self.currentSlide > 1 ){
                        self.emit('slide', self.currentSlide - 1);
                    }
                }
            });

            self.currentSlide = 0;
            slides.hide();


            self.on('slide', function( e, idx ){
                if ( idx >= 0 && idx < slides.length ){
                    if ( idx < 2 ){
                        controls.find('.prev').fadeOut();
                    } else {
                        controls.find('.prev').fadeIn();
                    }

                    if ( idx === (slides.length - 1) || idx === 0 ){
                        controls.find('.next').fadeOut();
                    } else {
                        controls.find('.next').fadeIn();
                    }

                    controls.hide();
                    controls.children('.next').removeClass('glow').text('skip');
                    slides.not(':eq('+self.currentSlide+'),:eq('+idx+')').stop().hide();
                    slides.eq( self.currentSlide ).fadeOut(function(){
                        slides.eq( idx ).fadeIn();
                    });
                    self.currentSlide = idx;
                    // delay showing next button
                    setTimeout(function(){
                        controls.fadeIn();
                    }, 1000);
                }
            });

            self.media.on('ended', function(){
                controls.find('.next').addClass('glow').text('continue');
            });

            self.emit('slide', 0);
            self.slides = slides;
        }

        // Initialize events
        ,initEvents: function(){

            var self = this;

            $(window).on('resize', function(){
                self.emit('resize');
            });
        }

        // DomReady Callback
        ,onDomReady: function(){

            var self = this;

            self.on('slide', function( e, idx ){
                self.media.setTrack( idx - 1 );
            });

            ///////////
            // Slide 1
            this.sims.stellarSolar = StellarSolarSim('#stellar-solar-sim');

            self.on('slide', function( e, idx ){
                if ( idx !== 1 ){
                    self.sims.stellarSolar.stop();
                }
            });

            self.media.after('ready', function(){
                var track = self.media.tracks[0];
                var sim = self.sims.stellarSolar;
                track.on('play', function(){
                    sim.stop();
                }).code({
                    start: 0
                    ,end: 15
                    ,onFrame: function( e ){
                        if ( !this.paused() ){
                            var d = e.end - e.start;
                            var t = this.currentTime() - e.start;
                            t = t > d ? d : t;
                            sim.setDay( Helpers.lerp(0, 6, t/d) );
                            sim.layer.draw();
                        }
                    }
                }).code({
                    start: 17
                    ,end: 19
                    ,onFrame: function( e ){
                        if ( !this.paused() ){
                            var d = e.end - e.start;
                            var t = this.currentTime() - e.start;
                            t = t > d ? d : t;
                            sim.setDay( Helpers.lerp(0, 1, t/d) );
                            sim.layer.draw();
                        }
                    }
                }).code({
                    start: 21
                    ,end: 22
                    ,onFrame: function( e ){
                        if ( !this.paused() ){
                            var d = e.end - e.start;
                            var t = this.currentTime() - e.start;
                            t = t > d ? d : t;
                            sim.setDay( Helpers.lerp(1, 1+1/5, t/d) );
                            sim.layer.draw();
                        }
                    }
                }).code({
                    start: 27
                    ,onStart: function( e ){
                        sim.start();
                    }
                });
            });

            ///////////
            // Slide 2
            this.sims.eccentricOrbit = EccentricOrbitSim('#eccentric-orbit-sim');

            self.on('slide', function( e, idx ){
                if ( idx !== 2 ){
                    self.sims.eccentricOrbit.stop();
                }
            });

            this.sims.eccentricOrbitPlot = EOTGraph('#eccentric-orbit-plot');
            this.sims.eccentricOrbitPlot.scaleY *= 0.9;
            this.sims.eccentricOrbit.on('change:eccentricity', function(){
                self.sims.eccentricOrbitPlot.plot( function(x){
                    return self.sims.eccentricOrbit.calcEOTAngle( x * self.sims.eccentricOrbit.daysPerYear );
                }, 0.01);
            });

            this.sims.eccentricOrbit.on('change', function( e, data ){
                self.sims.eccentricOrbitPlot.setMarker( data.day / self.sims.eccentricOrbit.daysPerYear );
            });

            self.media.after('ready', function(){
                var track = self.media.tracks[1];
                var sim = self.sims.eccentricOrbit;
                track.on('play', function(){
                    sim.stop();
                }).code({
                    start: 0
                    ,end: track.duration()
                    ,onFrame: function( e ){
                        if ( !this.paused() ){
                            var d = e.end - e.start;
                            var t = this.currentTime() - e.start;
                            t = t > d ? d : t;
                            sim.setDay( Helpers.lerp(0, 60, t/d) );
                            sim.layer.draw();
                        }
                    }
                    ,onEnd: function( e ){
                        sim.start();
                    }
                });
            });

            //////////
            // Slide 3
            this.sims.axialTilt = AxialTiltSim('#axial-tilt-sim');

            self.on('slide', function( e, idx ){
                if ( idx !== 3 ){
                    self.sims.axialTilt.stop();
                }
            });

            this.sims.eclipticTilt = EclipticTiltSim('#ecliptic-tilt-sim');
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                self.sims.eclipticTilt.setTilt( tilt );
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.eclipticTilt.setDay( day );
                self.sims.eclipticTilt.layer.draw();
            });

            this.sims.axialTiltPlot = EOTGraph('#axial-tilt-plot');
            this.sims.axialTiltPlot.scaleY *= 10;
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                self.sims.axialTiltPlot.plot( function( x ){
                    return calcEOTFromTilt( x * Pi2, tilt );
                }, 0.01);
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.axialTiltPlot.setMarker( day / self.sims.axialTilt.daysPerYear );
            });

            this.sims.axialTiltMap = EOTMap('#axial-tilt-map');
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                self.sims.axialTiltMap.setTilt( tilt );
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.axialTiltMap.setDay( day );
            });

            // map move
            var mapPos;
            this.sims.axialTiltMap.$el.hammer()
                .on('dragstart', function(){
                    mapPos = parseInt($(this).css('background-position-x'));
                })
                .on('drag', function( e ){
                    this.style.backgroundPosition = (mapPos + e.gesture.deltaX)+ 'px 0';
                });

            self.media.after('ready', function(){
                var track = self.media.tracks[2];
                var sim = self.sims.axialTilt;
                track.on('play', function(){
                    sim.stop();
                }).code({
                    start: 0
                    ,end: track.duration()
                    ,onFrame: function( e ){
                        if ( !this.paused() ){
                            var d = e.end - e.start;
                            var t = this.currentTime() - e.start;
                            t = t > d ? d : t;
                            sim.setDay( Helpers.lerp(0, 6000, t/d) );
                            sim.layer.draw();
                        }
                    }
                    ,onEnd: function( e ){
                        sim.start();
                    }
                });
            });

            /////////////
            // Slide 4
            var year = 365.24;
            var vernal = 79 + 17/24;
            var perihelion = 3 + 14.5/24;
            this.sims.eccCtrl = EccentricOrbitSim('#ecc-ctrl');
            this.sims.axisCtrl = AxialTiltSim('#axis-ctrl');

            self.on('slide', function( e, idx ){
                if ( idx !== 4 ){
                    self.sims.eccCtrl.stop();
                }
            });

            this.sims.eotPlot = EOTGraph('#eot-plot');
            this.sims.eotPlot.scaleY = 400;
            function setEotFn( tilt ){
                self.sims.eotPlot.plot( function( x ){
                    return calcEOTFromTilt( (x + perihelion/year - vernal/year) * Pi2, tilt ) + self.sims.eccCtrl.calcEOTAngle( x * self.sims.eccCtrl.daysPerYear );
                }, 0.01);
            }
            this.sims.axisCtrl.on('change:tilt', function( e, tilt ){
                setEotFn( tilt );
            });
            this.sims.eccCtrl.on('change:eccentricity', function(){
                setEotFn( self.sims.axisCtrl.tilt );
            });
            this.sims.eccCtrl.on('change', function( e, data ){
                var x = (data.day / self.sims.eccCtrl.daysPerYear);
                self.sims.eotPlot.setMarker( x );
                self.sims.axisCtrl.setDay( x * self.sims.axisCtrl.daysPerYear );
                self.sims.axisCtrl.layer.draw();
            });
            setEotFn( self.sims.axisCtrl.tilt );

            self.media.after('ready', function(){
                var track = self.media.tracks[3];
                var sim = self.sims.eccCtrl;
                track.on('play', function(){
                    sim.stop();
                }).code({
                    start: 0
                    ,end: track.duration()
                    ,onFrame: function( e ){
                        if ( !this.paused() ){
                            var d = e.end - e.start;
                            var t = this.currentTime() - e.start;
                            t = t > d ? d : t;
                            sim.setDay( Helpers.lerp(0, 60, t/d) );
                            sim.layer.draw();
                        }
                    }
                    ,onEnd: function( e ){
                        sim.start();
                    }
                });
            });

            //////////////
            // General

            when.all($.map(this.sims, function( s ){
                return s.after('ready');
            })).then(function(){
                self.initSlides();
                $('.slides').css('top', '0');
            }).otherwise(function(){
                window.console && console.log(arguments);
            });

            function firstplay( e ){
                self.resolve('welcome');
            }

            self.media.on('play', firstplay);

            $('.welcome .giant-play').hammer().on('touch', function( e ){
                e.preventDefault();
                self.resolve('welcome');
            });

            self.after('welcome').then(function(){
                self.media.off('play', firstplay);
                self.on('slide', function(){
                    self.media.emit('play');
                });

                self.emit('slide', 1);
            });

            /////////////
            // Resizing
            this.sims.eccentricOrbit.emit('change:eccentricity', this.sims.eccentricOrbit.e);
            this.sims.axialTilt.emit('change:tilt', this.sims.axialTilt.tilt);

            self.on('resize', Helpers.debounce(function(){
                $.each(self.sims, function(name, sim){
                    if ( sim.setup ){
                        var par = sim.$el.parents('.slides > section');
                        var vis = par.is(':visible');

                        if ( !vis ){
                            par.show();
                        }

                        sim.setup();

                        if ( !vis ){
                            par.hide();
                        }
                    }
                });

                self.sims.eccentricOrbit.emit('change:eccentricity', self.sims.eccentricOrbit.e);
                self.sims.axialTilt.emit('change:tilt', self.sims.axialTilt.tilt);
                self.sims.eccentricOrbitPlot.scaleY *= 0.9;
                self.sims.axialTiltPlot.scaleY *= 10;
                self.sims.eotPlot.scaleY = 400;
                setEotFn( self.sims.axisCtrl.tilt );

            }, 1000));
        }

    }, ['events']);

    return new Mediator();
});
