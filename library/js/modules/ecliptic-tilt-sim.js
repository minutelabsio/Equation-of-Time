define([
    'config/colors',
    'jquery',
    'require',
    'kinetic',
    'util/helpers',
    'moddef'
], function(
    colors,
    $,
    req,
    Kinetic,
    Helpers,
    M
) {
    'use strict';

    var Pi2 = Math.PI * 2;
    var deg = 180/Math.PI;
    var earthAbove = req.toUrl('../../images/earth-north-2-rot.png');

    // Page-level Module
    var Module = M({

        // Module Constructor
        constructor: function( el ){

            var self = this;
            self.$el = $( el );
            var stage = new Kinetic.Stage({
                container: self.$el[0]
                ,width: self.$el.width()
                ,height: self.$el.height()
            });

            self.stage = stage;

            function dim( r ){
                return r/600*self.$el.width();
            }

            // vars
            self.animSpeed = 80;
            self.daysPerYear = 365;
            self.day = 0;
            self.tilt = 0;
            self.earthDist = dim(260);
            self.posColor = Helpers.adjustAlpha(colors.red, 0.8);
            self.negColor = Helpers.adjustAlpha(colors.yellow, 0.8);
            var offset = {
                x: -dim( 300 )
                ,y: -dim( 300 )
            };

            // init simulation
            var layer = new Kinetic.Layer();
            var r = 55;
            var earth = new Kinetic.Group({
                x: dim( 300 )
                ,y: dim( 300 )
            });
            this.earth = earth;

            // earth
            var imageObj = new Image();
            imageObj.onload = function() {
                var earthImg = new Kinetic.Image({
                    x: 0
                    ,y: 0
                    ,image: imageObj
                    ,width: dim( 2*r ) + 8
                    ,height: dim( 2*r ) + 8
                    ,offset: {
                        x: dim( r ) + 5
                        ,y: dim( r ) + 4
                    }
                });
                self.earthImg = earthImg;
                earth.add(earthImg);

                self.halfEarth = new Kinetic.Image({
                    x: dim( 300 )
                    ,y: dim( 300 )
                    ,image: imageObj
                    ,width: dim( r ) + 4
                    ,height: dim( 2*r ) + 8
                    ,offset: {
                        x: dim( r ) + 5
                        ,y: dim( r ) + 4
                    }
                    ,crop: {
                        x: 0
                        ,y: 0
                        ,width: 150
                        ,height: 300
                    }
                });

                self.resolve('ready');
            };
            imageObj.src = earthAbove;

            // mean ecliptic (equator)
            layer.add( new Kinetic.Circle({
                radius: self.earthDist
                ,x: 0
                ,y: 0
                ,offset: offset
                ,stroke: colors.red
                ,strokeWidth: 1
                ,dash: [5,5]
            }));

            // true ecliptic
            self.ecliptic = new Kinetic.Ellipse({
                x: 0
                ,y: 0
                ,radius: {
                    x: self.earthDist
                    ,y: self.earthDist
                }
                ,offset: offset
                ,stroke: colors.yellow
                ,strokeWidth: 1
            });

            self.eotWedge = new Kinetic.Wedge({
                x: -offset.x
                ,y: -offset.y
                ,radius: self.earthDist
                ,rotation: 90
                ,angle: 0
                ,fill: self.posColor
            });

            layer.add( self.eotWedge );

            // sun
            self.sun = new Kinetic.Group({
                x: 0
                ,y: -self.earthDist
                ,offset: offset
            });

            var sunR = 20;
            var sunCircle = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: dim(sunR)
                ,fill: colors.yellowLight
            });

            var sunCorona = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: dim(sunR*1.5)
                // ,fillRadialGradientStartPoint: { x: 0, y: 0 }
                ,fillRadialGradientStartRadius: dim(sunR)
                ,fillRadialGradientEndRadius: dim(sunR*1.5)
                ,fillRadialGradientColorStops: [0, colors.yellow, 1, 'rgba(0,0,0,0)']
            });

            self.sun.add( sunCircle );
            self.sun.add( sunCorona );

            // mean sun
            self.meanSun = new Kinetic.Group({
                x: 0
                ,y: self.earthDist
                ,offset: offset
            });

            self.meanSun.add( new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: dim(sunR)
                ,stroke: colors.red
                ,strokeWidth: 1
            }));

            layer.add(earth);
            layer.add( self.ecliptic );
            layer.add(self.sun);
            layer.add(self.meanSun);

            stage.add(layer);

            self.layer = layer;

            self.initEvents();
            self.initAnim();
            self.after('ready', function(){
                self.setDay( 0 );
                self.earth.setZIndex( 3 );
                self.layer.add( self.halfEarth );
                self.layer.draw();
            });
        }

        ,initAnim: function(){

            var self = this;

            self.anim = new Kinetic.Animation(function(frame) {
                var t = (frame.timeDiff / 1000);
                var w = self.animSpeed * 0.3;
                self.setDay( self.day + t * w );
            }, this.layer);
        }

        ,start: function(){

            this.anim.start();
        }

        ,stop: function(){

            this.anim.stop();
        }

        // set the day to change the position of the simulation
        ,setDay: function( d ){
            var self = this
                ,ang // year angle
                ,rot // day angle
                ,earth = self.earth
                ,sun = self.sun
                ,meanSun = self.meanSun
                ,eotWedge = self.eotWedge
                ,r = self.earthDist
                ,x
                ,y
                ,s
                ,eot
                ;

            // automatically cycle the days
            self.day = (d + self.daysPerYear) % self.daysPerYear;
            ang = -Pi2 * self.day / self.daysPerYear + Pi2*0.25;
            ang = ang % Pi2;

            x = r * Math.cos(ang) * Math.cos( self.tilt / deg );
            y = r * Math.sin(ang);

            sun.x( x );
            sun.y( y );

            s = 1 + 0.5 * Math.cos(ang) * Math.sin( self.tilt / deg );

            if ( s > 1 ){
                sun.setZIndex(10);
            } else {
                sun.setZIndex(2);
            }
            sun.getChildren().each(function( n ){
                n.scaleX(s);
                n.scaleY(s);
            });

            meanSun.x( r * Math.cos(ang) );
            meanSun.y( r * Math.sin(ang) );

            eot = ang * deg;
            eotWedge.rotation( eot );
            eot -= (Math.atan2( y, x ) * deg - 360) % 360;
            eot = (eot + 180) % 360 - 180;
            eotWedge.clockwise( eot > 0 );
            eotWedge.fill( eot > 0 ? self.posColor : self.negColor );
            eotWedge.angle( -eot );
        }

        ,setTilt: function( degrees ){

            if ( this.halfEarth && degrees*this.tilt <= 0 ){
                if ( degrees >= 0 ){
                    this.halfEarth.cropX( 0 );
                    this.halfEarth.offsetX( this.halfEarth.width() + 1 );
                } else {
                    this.halfEarth.cropX( 150 );
                    this.halfEarth.offsetX( 1 );
                }
            }

            this.tilt = degrees;
            this.recalc();
        }

        ,recalc: function(){
            var self = this
                ,tilt = self.tilt
                ;

            self.ecliptic.radiusX( Math.max(self.earthDist * Math.abs(Math.cos( tilt / deg )), 1) );
            self.layer.draw();
        }

        // Initialize events
        ,initEvents: function(){

            var self = this
                ;


        }

    }, ['events']);

    return Module;
});
