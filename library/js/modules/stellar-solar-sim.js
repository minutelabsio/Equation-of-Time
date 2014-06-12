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
            self.initEvents();

            self.daysPerYear = 6;

            self.$el = $( el );
            var stage = new Kinetic.Stage({
                container: self.$el[0]
                ,width: self.$el.width()
                ,height: self.$el.height()
            });

            function dim( r ){
                return r/600*self.$el.width();
            }

            var layer = new Kinetic.Layer();
            var r = 60;
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
                self.initAnim();
            };
            imageObj.src = earthAbove;

            // stellar wedge
            var wedgeStellar = new Kinetic.Wedge({
                x: 0
                ,y: 0
                ,radius: dim( r ) * 1.25
                ,angle: 0
                ,fill: colors.blue
                ,stroke: colors.blue
                ,strokeWidth: 0
                ,rotation: 180
                ,scaleY: -1
            });

            var wedgeDiff = new Kinetic.Wedge({
                x: 0
                ,y: 0
                ,radius: dim( r ) * 1.5
                ,angle: 0
                ,fill: colors.yellow
                ,stroke: colors.yellow
                ,strokeWidth: 0
                ,rotation: 180
                ,scaleY: -1
            });

            var solarLine = new Kinetic.Line({
                points: [0, 0, -dim( r )*2, 0]
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
            this.wedgeDiff = wedgeDiff;

            earth.add(this.solarNoon);
            earth.add(wedgeDiff);
            earth.add(this.stellarNoon);
            earth.add(wedgeStellar);

            var sun = new Kinetic.Circle({
                x: dim(300)
                ,y: dim(300)
                ,radius: dim(30)
                ,fill: colors.yellowLight
            });

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
            self.stage = stage;
        }

        ,initAnim: function(){
            var self = this;
            var earth = this.earth;
            var w = 0.3;
            var r = 200;
            var ang = 0;
            var rot = 0;

            var anim = new Kinetic.Animation(function(frame) {
                var t = (frame.timeDiff / 1000);
                ang += w * t;
                rot += w * self.daysPerYear * t;
                ang %= Pi2;
                rot %= Pi2;
                earth.offsetX( -r * Math.cos(-ang) );
                earth.offsetY( -r * Math.sin(-ang) );
                self.sunAngle( ang*deg );
                self.stellarAngle( rot*deg );
            }, this.layer);

            anim.start();
        }

        ,sunAngle: function( angle ){

            this.sunAng = angle;
            this.updateDiff();
        }

        ,stellarAngle: function( angle ){

            this.wedgeStellar.setAngle( angle );
            this.earthImg.rotation( 90-angle );
            this.updateDiff();
        }

        ,updateDiff: function(){
            var a = this.sunAng;
            this.wedgeDiff.rotation( 180-a );
            this.wedgeDiff.setAngle( this.wedgeStellar.getAngle() - a );
            this.solarNoon.rotation( -a );

        }

        // Initialize events
        ,initEvents: function(){

            var self = this;
        }

    }, ['events']);

    return function( el ){
        return new Module( el );
    };
});
