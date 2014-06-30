define([
    'util/helpers',
    'config/colors',
    'jquery',
    'require',
    'kinetic',
    'moddef'
], function(
    helpers,
    colors,
    $,
    req,
    Kinetic,
    M
) {
    'use strict';

    var Pi2 = Math.PI * 2;
    var deg = 180/Math.PI;

    var primeMeridianRatio = 580/1280;
    function calcDecFromTilt( ang, tilt ){
        var d = Math.asin( Math.sin( ang ) * Math.sin( tilt / deg ) );

        return d;
    }

    function calcRAFromTilt( ang, tilt ){
        var RA = Math.atan( Math.tan( ang ) * Math.cos( tilt / deg ) );
        // tan is discontinuous... so we make it continuous
        RA += Math.floor(ang / Math.PI + 0.5) * Math.PI;
        return RA;
    }

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

            function dim( r, useY ){
                return r/600*( useY ? self.$el.height() : self.$el.width() );
            }

            // vars
            self.scaleX = dim( 600 );
            self.scaleY = dim( 150, 1 );
            self.offsetY = dim( 300, 1 );
            self.daysPerYear = 365;
            self.posColor = helpers.adjustAlpha(colors.yellow, 0.8);
            self.negColor = helpers.adjustAlpha(colors.red, 0.8);

            // init simulation
            var layer = new Kinetic.Layer({
                offset: {
                    x: 0
                    ,y: -self.offsetY
                }
            });

            self.meanSunLine = new Kinetic.Line({
                points: [0, 0, dim(600), 0]
                ,x: 0
                ,y: 0
                ,stroke: colors.red
                ,strokeWidth: 2
                ,dash: [5,5]
            });

            layer.add( self.meanSunLine );

            self.sunLine = new Kinetic.Line({
                points: []
                ,x: 0
                ,y: 0
                ,stroke: colors.yellow
                ,strokeWidth: 2
            });

            layer.add( self.sunLine );

            self.eot = new Kinetic.Line({
                points: []
                ,x: 0
                ,y: 0
                ,fill: self.posColor
                ,stroke: self.posColor
                ,strokeWidth: 1
                ,closed: true
            });

            self.sun = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: 7
                ,fill: colors.yellow
                ,stroke: colors.deepGreyDark
                ,strokeWidth: 0.5
            });

            self.meanSun = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: 7
                ,fill: helpers.adjustAlpha(colors.red, 0.4)
                ,stroke: colors.red
                ,strokeWidth: 1
            });

            layer.add(self.eot);
            layer.add(self.sun);
            layer.add(self.meanSun);
            stage.add(layer);

            self.layer = layer;

            self.initEvents();
            // self.initAnim();
            self.after('ready', function(){
                self.setDay( 0 );
                self.layer.draw();
            });
        }

        ,plot: function( fn, resolution ){

            var line
                ,sx = this.scaleX
                ,sy = this.scaleY
                ,x = 0
                ,y
                ,py = 0
                ,points = []
                ;

            fn = fn || this.fn;
            this.fn = fn;

            for ( x; x < 1; x += resolution ){

                y = fn( x );
                points.push( sx * x, sy * y );
            }

            points.push( sx, sy * fn(1) );
            this.sunLine.points( points );
            this.layer.draw();
        }

        ,setTilt: function( tilt ){
            this.tilt = tilt;
            this.plot( function( x ){
                return -calcDecFromTilt( (x - primeMeridianRatio) * Pi2, tilt );
            }, 0.01);
        }

        ,setDay: function( d ){

            var fn = this.fn
                ,x = d / this.daysPerYear
                ,sx = this.scaleX
                ,sy = this.scaleY
                ,ra
                ,my = this.$el.height()/2
                ,w
                ;

            this.day = d;

            if ( !fn ){
                return;
            }

            ra = calcRAFromTilt( x * Pi2, this.tilt ) / Pi2;
            ra = (ra + primeMeridianRatio) % 1;
            x = (x + primeMeridianRatio) % 1;

            this.meanSun.x( sx * x );
            this.sun.x( sx * ra );
            this.sun.y( sy * fn( ra ) );

            w = ra - x;
            if ( Math.abs(w) > 0.5 ){
                w -= 1;
            }
            x *= sx;
            w *= sx;

            this.eot.fill( w <= 0 ? this.posColor : this.negColor );
            this.eot.stroke( this.eot.fill() );
            this.eot.points([ x, -my, x, my, x + w, my, x + w, -my ]);

            this.layer.draw();
        }


        // Initialize events
        ,initEvents: function(){

            var self = this
                ;


        }

    }, ['events']);

    return Module;
});
