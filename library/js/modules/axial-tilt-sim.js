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
    var earthNA = req.toUrl('../../images/earth-na.gif');

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
            self.earthDist = dim(140);
            var offset = {
                x: -dim( 300 )
                ,y: -dim( 300 )
            };

            // init simulation
            var layer = new Kinetic.Layer();
            var r = 55;
            var earth = new Kinetic.Group({
                x: -offset.x
                ,y: -offset.y
            });
            this.earth = earth;

            // earth
            var imageObj = new Image();
            imageObj.onload = function() {
                var earthImg = new Kinetic.Image({
                    x: 0
                    ,y: 0
                    ,image: imageObj
                    ,width: dim( 2*r + 8 )
                    ,height: dim( 2*r + 8 )
                    ,offset: {
                        x: dim( r + 5 )
                        ,y: dim( r + 4 )
                    }
                });
                self.earthImg = earthImg;
                earth.add(earthImg);

                // equator line
                earth.add( new Kinetic.Line({
                    points: [ -dim( r ), 0, dim( r ), 0 ]
                    ,stroke: colors.red
                    ,strokeWidth: 2
                }));

                self.resolve('ready');
            };
            imageObj.src = earthNA;

            // axial line
            earth.add( new Kinetic.Line({
                points: [ 0, -dim( r ), 0, -dim( r ) - 50 ]
                ,stroke: colors.grey
                ,strokeWidth: 2
            }));
            // handle
            self.axisHandle = new Kinetic.Circle({
                x: 0
                ,y: -dim( r ) - 50
                ,fill: colors.grey
                ,radius: 8
            });
            earth.add( self.axisHandle );

            // sun
            self.sun = new Kinetic.Group({
                x: self.earthDist
                ,y: 0
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

            layer.add(earth);
            layer.add(self.sun);
            // solar ecliptic
            layer.add( new Kinetic.Line({
                points: [ -dim( r ), 0, dim( r ), 0 ]
                ,offset: offset
                ,stroke: colors.yellow
                ,strokeWidth: 2
            }));

            stage.add(layer);
            self.layer = layer;

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
                ,r = self.earthDist
                ,s
                ;

            // automatically cycle the days
            self.day = (d + self.daysPerYear) % self.daysPerYear;
            ang = Pi2 * self.day / self.daysPerYear;

            sun.x( r * Math.cos(ang) );
            s = 1 + 0.3 * Math.sin(ang);
            if ( s > 1 ){
                sun.moveToTop();
            } else {
                sun.moveToBottom();
            }

            sun.getChildren().each(function( n ){
                n.scaleX(s);
                n.scaleY(s);
            });
        }

        // Initialize events
        ,initEvents: function(){

            var self = this
                ,drag = false
                ;

            self.axisHandle.on('mousedown touchstart', function( e ){
                e.evt.preventDefault();
                drag = true;
            });
            self.stage.on('contentMousemove contentTouchmove', function( e ){

                if ( drag ){
                    e.evt.preventDefault();

                    var x = e.evt.layerX - self.earth.x()
                        ,y = e.evt.layerY - self.earth.y()
                        ,ang = Math.atan2( x, -y ) * deg
                        ;

                    ang = Math.max(Math.min( ang, 30 ), -30);
                    self.tilt = ang;
                    self.earth.rotation( ang );
                    self.layer.draw();
                }
            });
            self.stage.on('contentMouseup contentTouchend', function( e ){
                drag = false;
            });
        }

    }, ['events']);

    return Module;
});
