define([
    'config/colors',
    'jquery',
    'require',
    'kinetic',
    'moddef'
], function(
    colors,
    $,
    req,
    Kinetic,
    M
) {
    'use strict';

    var Pi2 = Math.PI * 2;
    var deg = 180/Math.PI;
    var earthAbove = req.toUrl('../../images/earth-north.png');

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
            self.animSpeed = 1;
            self.daysPerYear = 6;
            self.day = 0;
            self.minorAxis = dim(180); // minor axis of ellipse

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
                    ,width: dim( 2*r )
                    ,height: dim( 2*r )
                    ,rotation: 90
                    ,offset: {
                        x: dim( r )
                        ,y: dim( r )
                    }
                });
                self.earthImg = earthImg;
                earth.add(earthImg);

                stage.draw();
                self.resolve('ready');
            };
            imageObj.src = earthAbove;

            var meanSolarLine = new Kinetic.Line({
                points: [0, 0, -dim( r )*2, 0]
                ,stroke: colors.yellow
                ,strokeWidth: 2
            });

            this.meanSolarNoon = new Kinetic.Group();
            this.meanSolarNoon.add( meanSolarLine );

            var trueSolarLine = new Kinetic.Line({
                points: [0, 0, -dim( r )*2, 0]
                ,stroke: colors.blue
                ,strokeWidth: 2
            });

            this.trueSolarNoon = new Kinetic.Group();
            this.trueSolarNoon.add( trueSolarLine );

            earth.add(this.meanSolarNoon);
            earth.add(this.trueSolarNoon);

            var sun = new Kinetic.Circle({
                x: dim(300)
                ,y: dim(300)
                ,radius: dim(30)
                ,fill: colors.yellowLight
            });

            self.sun = sun;

            var sunCorona = new Kinetic.Circle({
                x: dim(300)
                ,y: dim(300)
                ,radius: dim(45)
                // ,fillRadialGradientStartPoint: { x: 0, y: 0 }
                ,fillRadialGradientStartRadius: dim(30)
                ,fillRadialGradientEndRadius: dim(45)
                ,fillRadialGradientColorStops: [0, colors.yellow, 1, 'rgba(0,0,0,0)']
            });

            self.sunCorona = sunCorona;

            layer.add(earth);

            layer.add(sunCorona);
            layer.add(sun);
            stage.add(layer);

            self.layer = layer;

            self.setEccentricity( 0.1 );
            self.initEvents();
            self.initAnim();
            self.after('ready', function(){
                self.setDay( 0 );
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

            // this.anim.start();
        }

        ,stop: function(){

            // this.anim.stop();
        }

        // set the day to change the position of the simulation
        ,setDay: function( d ){
            var self = this
                ,E // eccentric anomoly
                ,e = self.e // eccentricity
                ,rot // day angle
                ,earth = self.earth
                ,b = self.minorAxis
                ,a = self.majorAxis
                ;

            // automatically cycle the days
            self.day = d % self.daysPerYear;
            rot = Pi2 * self.day;
            E = -rot / self.daysPerYear;

            earth.offsetX( -a * (Math.cos(E) - e) );
            earth.offsetY( -b * Math.sin(E) );
            self.sunAngle( -E );
            self.stellarAngle( rot );
            self.recalc();
        }

        ,setEccentricity: function( e ){
            this.e = e;
            this.majorAxis = this.minorAxis / Math.sqrt(1 - e*e);

            this.sun.offsetX( -this.majorAxis * e );
            this.sunCorona.offsetX( -this.majorAxis * e );
            this.layer.draw();
        }

        // in radians
        ,sunAngle: function( angle ){

            angle %= Pi2;
            this.sunAng = angle * deg;
        }

        // in radians
        ,stellarAngle: function( angle ){

            angle %= Pi2;
            // convert
            angle *= deg;
            this.earthImg.rotation( 90-angle );
        }

        ,recalc: function(){
            var a = this.sunAng
                ,earth = this.earth
                ,sun = this.sun
                ,x = earth.offsetX()
                ,y = earth.offsetY()
                ;

            this.meanSolarNoon.rotation( -a );

            x -= sun.offsetX();
            y -= sun.offsetY();

            this.trueSolarNoon.rotation( Math.atan2( -y, -x ) * deg );
        }

        // Initialize events
        ,initEvents: function(){

            var self = this
                ,drag = false
                ;

            self.earth.on('mousedown touchstart', function( e ){
                // stop the anim
                self.stop();
                drag = true;
            });
            self.stage.on('contentMousemove contentTouchmove', function( e ){

                if ( drag ){
                    var x = e.evt.layerX - self.sun.x()
                        ,y = e.evt.layerY - self.sun.y()
                        ,ang = Math.atan2( -y, x )
                        ;

                    self.setDay( ang * self.daysPerYear / Pi2 );
                    self.layer.draw();
                }
            });
            self.stage.on('contentMouseup contentTouchend', function( e ){
                self.start();
                drag = false;
            });
        }

    }, ['events']);

    return Module;
});
