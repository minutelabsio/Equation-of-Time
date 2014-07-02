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
    var earthAbove = req.toUrl('../../images/earth-north-2.png');

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
            var bgLayer = new Kinetic.Layer();
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
                    ,rotation: 90
                    ,offset: {
                        x: dim( r ) + 5
                        ,y: dim( r ) + 4
                    }
                });
                self.earthImg = earthImg;
                earth.add(earthImg);

                self.resolve('ready');
            };
            imageObj.src = earthAbove;

            var meanSolarLine = new Kinetic.Line({
                points: [0, 0, -dim( r )*1.75, 0]
                ,stroke: colors.red
                ,strokeWidth: 2
            });

            this.meanSolarNoon = new Kinetic.Group();
            this.meanSolarNoon.add( meanSolarLine );

            var trueSolarLine = new Kinetic.Line({
                points: [0, 0, -dim( r )*1.75, 0]
                ,stroke: colors.yellow
                ,strokeWidth: 2
            });

            this.trueSolarNoon = new Kinetic.Group();
            this.trueSolarNoon.add( trueSolarLine );

            earth.add(this.meanSolarNoon);
            earth.add(this.trueSolarNoon);

            this.eotWedge = new Kinetic.Wedge({
                x: 0
                ,y: 0
                ,fill: colors.red
                ,radius: dim( r ) * 1.5
                ,angle: 0
            });

            earth.add( this.eotWedge );

            self.sun = new Kinetic.Group({
                x: 0
                ,y: 0
                ,offset: {
                    x: -dim( 300 )
                    ,y: -dim( 300 )
                }
                ,draggable: true
                ,dragBoundFunc: function( pos ){
                    pos.y = this.getAbsolutePosition().y;
                    pos.x = Math.min(Math.max( 0, pos.x ), dim(100));
                    return pos;
                }
            });

            var sunCircle = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: dim(30)
                ,fill: colors.yellowLight
            });

            var sunCorona = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: dim(45)
                // ,fillRadialGradientStartPoint: { x: 0, y: 0 }
                ,fillRadialGradientStartRadius: dim(30)
                ,fillRadialGradientEndRadius: dim(45)
                ,fillRadialGradientColorStops: [0, colors.yellow, 1, 'rgba(0,0,0,0)']
            });

            self.sun.add( sunCircle );
            self.sun.add( sunCorona );
            self.sun.add( new Kinetic.Circle({
                x: 0
                ,y: dim( 50 )
                ,radius: 5
                ,fill: colors.blue
                ,stroke: colors.greyDark
                ,strokeWidth: 2
            }));

            self.orbitLine = new Kinetic.Ellipse({
                radius: {
                    x: 1
                    ,y: 1
                }
                ,x: dim( 300 )
                ,y: dim( 300 )
                ,stroke: colors.deepGreyLight
                ,strokeWidth: 2
                ,dash: [5,5]
            });

            var sunGuides = new Kinetic.Group({
                x: dim( 300 )
                ,y: dim( 350 )
            });

            var eccLine = new Kinetic.Line({
                points: [ 0, 0, dim(100), 0 ]
                ,stroke: colors.greyDark
                ,strokeWidth: 2
                ,dash: [ 5, 5 ]
            });

            sunGuides.add( eccLine );
            sunGuides.add( new Kinetic.Line({
                points: [ 0, -8, 0, 8 ]
                ,stroke: colors.greyDark
                ,strokeWidth: 4
            }));
            sunGuides.add( new Kinetic.Line({
                points: [ dim(100), -8, dim(100), 8 ]
                ,stroke: colors.greyDark
                ,strokeWidth: 4
            }));

            self.eText = new Kinetic.Text({
                text: 'e = 0.1'
                ,x: 0
                ,y: 16
                ,width: ( 100 )
                ,stroke: colors.greyDark
                ,strokeWidth: 1
                ,fontFamily: '"latin-modern-mono-light", Courier, monospace'
                ,fontSize: 18
                ,align: 'center'
            });

            sunGuides.add( self.eText );

            bgLayer.add(self.orbitLine);
            bgLayer.add(sunGuides);
            layer.add(self.sun);
            layer.add(earth);

            stage.add(bgLayer);
            stage.add(layer);

            self.layer = layer;
            self.bgLayer = bgLayer;

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

            this.anim.start();
        }

        ,stop: function(){

            this.anim.stop();
        }

        // set the day to change the position of the simulation
        ,setDay: function( d ){
            var self = this
                ,E // eccentric anomoly
                ,meanAng
                ,e = self.e // eccentricity
                ,rot // day angle
                ,earth = self.earth
                ,b = self.minorAxis
                ,a = self.majorAxis
                ;

            // automatically cycle the days
            self.day = (d + self.daysPerYear) % self.daysPerYear;
            rot = Pi2 * self.day;
            meanAng = -rot / self.daysPerYear;
            E = meanAng + e * Math.sin( meanAng ) / ( 1 - e * Math.cos( meanAng ) );

            earth.offsetX( -a * (Math.cos(E) ) );
            earth.offsetY( -b * Math.sin(E) );
            self.sunAngle( -meanAng );
            self.stellarAngle( rot );
            self.recalc();
            self.emit('change', {
                day: self.day
                ,E: E
                ,eotAngle: self.eotWedge.angle()
            });
        }

        ,calcEOTAngle: function( d ){

            var self = this
                ,E // eccentric anomoly
                ,meanAng
                ,e = self.e // eccentricity
                ,rot // day angle
                ,earth = self.earth
                ,b = self.minorAxis
                ,a = self.majorAxis
                ,theta // true anomoly
                ,cosE
                ;

            rot = Pi2 * d;
            meanAng = rot / self.daysPerYear;
            E = meanAng + e * Math.sin( meanAng ) / ( 1 - e * Math.cos( meanAng ) );
            cosE = Math.cos( E );
            theta = Math.acos( (cosE - e)/(1 - e * cosE) );
            if ( E > Math.PI ){
                theta = Pi2 - theta;
            }
            return (meanAng - theta);
        }

        ,setEccentricity: function( e ){
            this.e = e;
            this.majorAxis = this.minorAxis / Math.sqrt(1 - e*e);

            this.sun.x( this.majorAxis * e );
            this.orbitLine.radiusX( this.majorAxis );
            this.orbitLine.radiusY( this.minorAxis );
            this.eText.text('e = '+e.toFixed(2));
            this.layer.draw();
            this.bgLayer.draw();
            this.emit('change:eccentricity', e);
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
                ,eot
                ;

            this.meanSolarNoon.rotation( -a );

            x += sun.x();
            y += sun.y();

            this.trueSolarNoon.rotation( Math.atan2( -y, -x ) * deg );

            eot = this.trueSolarNoon.rotation() % 360 - this.meanSolarNoon.rotation() % 360;
            this.eotWedge.clockwise( eot > 0 );
            this.eotWedge.angle( (-eot + 360) % 360 );
            this.eotWedge.fill( eot > 0 ? colors.yellow : colors.red );
            this.eotWedge.rotation( (this.trueSolarNoon.rotation() + 180)%360 );
        }

        // Initialize events
        ,initEvents: function(){

            var self = this
                ,drag = false
                ,startAgain = false
                ;

            self.earth.on('mousedown touchstart', function( e ){
                e.evt.preventDefault();
                startAgain = self.anim.isRunning();
                // stop the anim
                self.stop();
                drag = true;
            });
            self.stage.on('contentMousemove contentTouchmove', function( e ){

                if ( drag ){
                    e.evt.preventDefault();

                    var x = e.evt.layerX + self.sun.offsetX()
                        ,y = e.evt.layerY + self.sun.offsetY()
                        ,e = self.e // eccentricity
                        ,b = self.minorAxis
                        ,a = self.majorAxis
                        ,ang = Math.atan2( -y * a / b, x )
                        ;
                    ang -= e * Math.sin( ang );
                    self.setDay( ang * self.daysPerYear / Pi2 );
                    self.layer.draw();
                }
            });
            self.stage.on('contentMouseup contentTouchend', function( e ){
                if ( startAgain ) {
                    self.start();
                }
                drag = false;
            });

            self.sun.on('dragmove', function( e ){
                self.setEccentricity( self.sun.x()/self.majorAxis );
            });
        }

    }, ['events']);

    return Module;
});
