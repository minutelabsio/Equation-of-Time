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
    var earthAbove = req.toUrl('../../images/earth-north-3-pm.png');

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
            self.earthDist = dim(180);

            // init simulation
            var layer = new Kinetic.Layer();
            var r = 50;
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

                self.shadow = new Kinetic.Wedge({
                    x: 0
                    ,y: 0
                    ,radius: dim( r ) - 2
                    ,angle: 180
                    ,fill: 'rgba(0, 0, 0, 0.3)'
                    ,rotation: 270
                });

                earth.add( self.shadow );

                self.resolve('ready');
            };
            imageObj.src = earthAbove;

            // stellar wedge
            var wedgeStellar = new Kinetic.Wedge({
                x: 0
                ,y: 0
                ,radius: dim( r ) * 1.3
                ,angle: 0
                ,fill: colors.blue
                ,stroke: colors.blue
                ,strokeWidth: 0
                ,rotation: 180
                ,scaleY: -1
            });

            var wedgeStellarFull = new Kinetic.Wedge({
                x: 0
                ,y: 0
                ,radius: dim( r ) * 1.3
                ,angle: 360
                ,opacity: 0
                ,fill: colors.blue
                ,stroke: colors.blue
                ,strokeWidth: 0
                ,rotation: 180
                ,scaleY: -1
            });

            var wedgeDiff = new Kinetic.Arc({
                x: 0
                ,y: 0
                ,innerRadius: dim( r ) * 1.3
                ,outerRadius: dim( r ) * 1.55
                ,angle: 0
                ,fill: colors.yellow
                ,stroke: colors.yellow
                ,strokeWidth: 0
                ,rotation: 180
                ,scaleY: -1
            });

            var wedgeDiffFull = new Kinetic.Arc({
                x: 0
                ,y: 0
                ,innerRadius: dim( r ) * 1.3
                ,outerRadius: dim( r ) * 1.55
                ,angle: 360
                ,opacity: 0
                ,fill: colors.yellow
                ,stroke: colors.yellow
                ,strokeWidth: 0
                ,rotation: 180
                ,scaleY: -1
            });

            self.stellarLabel = new Kinetic.Text({
                text: '0'
                ,x: 0
                ,y: 0
                ,offset: {
                    x: 2 * dim( r ) + 20
                    ,y: 13
                }
                ,fill: colors.blue
                ,strokeWidth: 1
                ,fontFamily: '"latin-modern-mono-light", Courier, monospace'
                ,fontSize: 26
                ,align: 'center'
            });

            self.solarLabelRadius = 2 * dim( r ) + 13;
            self.solarLabel = new Kinetic.Text({
                text: '0'
                ,x: -self.solarLabelRadius
                ,y: 0
                ,offset: {
                    x: 6
                    ,y: 13
                }
                ,fill: colors.yellow
                ,strokeWidth: 1
                ,fontFamily: '"latin-modern-mono-light", Courier, monospace'
                ,fontSize: 26
                ,align: 'center'
            });

            var solarLine = new Kinetic.Line({
                points: [-dim( r ) * 1.3, 0, -dim( r )*2, 0]
                ,stroke: colors.yellow
                ,strokeWidth: 2
            });

            this.solarNoon = new Kinetic.Group();
            this.solarNoon.add( solarLine );

            var stellarLine = new Kinetic.Line({
                points: [0, 0, -dim( r )*2, 0]
                ,stroke: colors.blue
                ,strokeWidth: 2
            });

            this.stellarNoon = new Kinetic.Group();
            this.stellarNoon.add( stellarLine );

            this.wedgeStellar = wedgeStellar;
            this.wedgeStellarFull = wedgeStellarFull;
            this.wedgeDiff = wedgeDiff;
            this.wedgeDiffFull = wedgeDiffFull;

            earth.add(this.solarNoon);
            earth.add(wedgeDiff);
            earth.add(wedgeDiffFull);
            earth.add(this.stellarNoon);
            earth.add(wedgeStellar);
            earth.add(wedgeStellarFull);
            earth.add(self.stellarLabel);
            earth.add(self.solarLabel);

            var sun = new Kinetic.Circle({
                x: dim(300)
                ,y: dim(300)
                ,radius: dim(30)
                ,fill: colors.yellow
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

            layer.add(earth);

            layer.add(sunCorona);
            layer.add(sun);
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
                ,r = self.earthDist
                ;

            // automatically cycle the days
            self.day = (d + self.daysPerYear) % self.daysPerYear;

            self.stellarLabel.text( Math.floor(self.day) );
            self.solarLabel.text( Math.floor(self.day - self.day/self.daysPerYear) );

            rot = Pi2 * self.day;
            ang = rot / self.daysPerYear;

            earth.offsetX( -r * Math.cos(-ang) );
            earth.offsetY( -r * Math.sin(-ang) );
            self.sunAngle( ang );
            self.stellarAngle( rot );
            self.updateDiff();
        }

        // in radians
        ,sunAngle: function( angle ){

            angle %= Pi2;
            this.sunAng = angle * deg;
            this.solarLabel.x( -Math.cos( angle ) * this.solarLabelRadius );
            this.solarLabel.y( Math.sin( angle ) * this.solarLabelRadius );
            this.shadow.rotation( -angle * deg - 90 );
        }

        // in radians
        ,stellarAngle: function( angle ){

            angle %= Pi2;
            // convert
            angle *= deg;

            // if the angle seems to have crossed the 360 deg mark
            if ( this.wedgeStellar.angle() > 340 && angle < 20 ){
                this.wedgeStellarFull.opacity( this.wedgeStellar.opacity() );
                var tween = new Kinetic.Tween({
                  node: this.wedgeStellarFull,
                  opacity: 0,
                  duration: .3,
                  easing: Kinetic.Easings.Linear
                });

                // play tween
                tween.play();
            }

            this.wedgeStellar.setAngle( angle );
            this.earthImg.rotation( 90-angle );
        }

        ,updateDiff: function(){
            var a = this.sunAng;
            var angle = this.wedgeStellar.getAngle() - a;
            angle = (angle + 360) % 360;

            // if the angle seems to have crossed the 360 deg mark
            if ( this.wedgeDiff.angle() > 340 && angle < 20 ){
                this.wedgeDiffFull.opacity( this.wedgeDiff.opacity() );
                var tween = new Kinetic.Tween({
                  node: this.wedgeDiffFull,
                  opacity: 0,
                  duration: .3,
                  easing: Kinetic.Easings.Linear
                });

                // play tween
                tween.play();
            }

            this.wedgeDiff.rotation( 180-a );
            this.wedgeDiff.setAngle( angle );
            this.solarNoon.rotation( -a );
        }

        // Initialize events
        ,initEvents: function(){

            var self = this
                ,drag = false
                ;

            self.earth.on('mousedown touchstart', function( e ){
                e.evt.preventDefault();
                // stop the anim
                self.stop();
                drag = true;
                self.grab = true;
            });
            self.stage.on('contentMousemove contentTouchmove', function( e ){

                if ( drag ){
                    e.evt.preventDefault();

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
                self.grab = false;
            });
        }

    }, ['events']);

    return Module;
});
