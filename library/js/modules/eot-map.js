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
    var twoOverPi = 2 / Math.PI;
    var invPi2 = 1 / Pi2;



    var π = Math.PI;
    var halfπ = π/2;

    /** From https://github.com/d3/d3-geo-projection/blob/master/src/robinson.js
    **/
    var robinsonConstants = [
      [0.9986, -0.062],
      [1.0000, 0.0000],
      [0.9986, 0.0620],
      [0.9954, 0.1240],
      [0.9900, 0.1860],
      [0.9822, 0.2480],
      [0.9730, 0.3100],
      [0.9600, 0.3720],
      [0.9427, 0.4340],
      [0.9216, 0.4958],
      [0.8962, 0.5571],
      [0.8679, 0.6176],
      [0.8350, 0.6769],
      [0.7986, 0.7346],
      [0.7597, 0.7903],
      [0.7186, 0.8435],
      [0.6732, 0.8936],
      [0.6213, 0.9394],
      [0.5722, 0.9761],
      [0.5322, 1.0000]
    ];

    robinsonConstants.forEach(function(d) {
      d[1] *= 1.0144;
    });

    function robinson(λ, φ) {
      var i = Math.min(18, Math.abs(φ) * 36 / π),
          i0 = Math.floor(i),
          di = i - i0,
          ax = (k = robinsonConstants[i0])[0],
          ay = k[1],
          bx = (k = robinsonConstants[++i0])[0],
          by = k[1],
          cx = (k = robinsonConstants[Math.min(19, ++i0)])[0],
          cy = k[1],
          k;
      return [
        λ * (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2),
        (φ > 0 ? halfπ : -halfπ) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2)
      ];
    }

    /** end **/

    var primeMeridianRatio = 0.5;//580/1280;
    function calcDecFromTilt( ang, tilt ){
        // ang = ( ang - Math.PI ) % Pi2 + Math.PI;
        var d = Math.asin( Math.sin( ang ) * Math.sin( tilt / deg ) );

        return (d + Math.PI) % Pi2 - Math.PI;
    }

    function calcRAFromTilt( ang, tilt ){
        ang = ( ang + Pi2 ) % Pi2;
        var RA = Math.atan( Math.tan( ang ) * Math.cos( tilt / deg ) );
        // tan is discontinuous... so we make it continuous
        if ( ang > 0.5 * Math.PI ){
            RA += Math.PI;
        }
        if ( ang > 1.5 * Math.PI ){
            RA += Math.PI;
        }
        return (RA + Pi2) % Pi2;
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

            // vars
            self.daysPerYear = 365;
            self.posColor = helpers.adjustAlpha(colors.yellow, 0.8);
            self.negColor = helpers.adjustAlpha(colors.red, 0.8);

            self.setup();
            self.initEvents();
            // self.initAnim();
            self.after('ready', function(){
                self.setDay( 0 );
                self.layer.draw();
            });
            self.resolve('ready');
        }

        ,setup: function(){

            var self = this
                ,stage = self.stage
                ;

            function dim( r, useY ){
                return r/600*( useY ? self.$el.height() : self.$el.width() );
            }

            stage.destroyChildren();
            stage.width( self.$el.width() );
            stage.height( self.$el.height() );

            self.scaleX = dim( 600 );
            self.scaleY = dim( 300, 1 );
            self.offsetY = dim( 300, 1 );

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
        }

        ,plot: function( resolution ){

            var tilt = this.tilt
                ,line
                ,sx = this.scaleX
                ,sy = this.scaleY
                ,coords
                ,py = 0
                ,points = []
                ,lambda = 0
                ,phi
                ,offset = calcRAFromTilt(-primeMeridianRatio * Pi2, this.tilt) * invPi2
                ;

            tilt += tilt > 0 ? -1e-10 : 1e-10;

            function calcCoords( lambda ){
                var x = calcRAFromTilt( (lambda - primeMeridianRatio) * Pi2, tilt );
                var y = calcDecFromTilt( (lambda - primeMeridianRatio) * Pi2, tilt );
                var coords = [x,y];//robinson( x, y );
                coords[0] *= invPi2;
                coords[1] *= twoOverPi;
                return coords;
            }

            for ( lambda; lambda < 1; lambda += resolution ){

                coords = calcCoords( lambda );
                points.push( sx * ((coords[0] + offset) % 1), -sy * coords[1] );
            }

            coords = calcCoords( 1 );
            points.push( sx * (coords[0] + offset), -sy * coords[1] );
            this.sunLine.points( points );
            this.layer.draw();
        }

        ,setTilt: function( tilt ){
            this.tilt = tilt;
            this.plot(0.01);
        }

        ,setDay: function( d ){

            var x = d / this.daysPerYear
                ,sx = this.scaleX
                ,sy = this.scaleY
                ,tilt = this.tilt
                ,ra
                ,dec
                ,my = this.$el.height()/2
                ,w
                ,coords
                ;

            this.day = d;

            tilt += tilt > 0 ? -1e-10 : 1e-10;
            ra = calcRAFromTilt( x * Pi2, tilt );
            dec = calcDecFromTilt( x * Pi2, tilt );
            // ra = coords[0];
            // coords = robinson( ra, dec );
            ra = ra * invPi2;
            dec = dec * twoOverPi;
            ra = (ra + primeMeridianRatio) % 1;
            x = (x + primeMeridianRatio) % 1;

            this.meanSun.x( sx * x );
            this.sun.x( sx * ra );
            this.sun.y( -sy * dec );
            
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
