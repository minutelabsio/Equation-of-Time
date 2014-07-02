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
    var getZero = function( x1, y1, x2, y2 ){
        var a = (y2-y1)/(x2-x1)
            ,b = y1 - a * x1
            ,x = -b/a
            ;

        return x;
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
            self.offsetY = 0;//dim( 300 );
            self.posColor = colors.yellow;
            self.negColor = colors.red;

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

            stage.destroyChildren();
            stage.width( self.$el.width() );
            stage.height( self.$el.height() );

            function dim( r, useY ){
                return r/600*( useY ? self.$el.height() : self.$el.width() );
            }

            self.scaleX = dim( 580, 1 );
            self.scaleY = dim( 280 );

            // init simulation
            var layer = new Kinetic.Layer({
                scaleY: -1
                ,rotation: 90
                ,offset: {
                    x: -10
                    ,y: -dim(300)
                }
            });

            self.marker = new Kinetic.Circle({
                x: 0
                ,y: 0
                ,radius: 7
                ,fill: colors.blue
                ,stroke: '#fff'
                ,strokeWidth: 1
            });

            layer.add(self.marker);
            stage.add(layer);

            self.layer = layer;
        }

        ,newLine: function(){
            var line = new Kinetic.Line({
                points: []
                ,name: 'line'
                ,closed: true
                ,strokeWidth: 1
                ,stroke: self.posColor
            });

            this.layer.add( line );
            line.moveToBottom();
            return line;
        }

        ,plot: function( fn, resolution ){

            var line
                ,points = [ 0, 0 ]
                ,sx = this.scaleX
                ,sy = this.scaleY
                ,x = 0
                ,y
                ,py = 0
                ;

            fn = fn || this.fn;
            this.fn = fn;
            this.allPoints = [];

            // remove old lines
            this.layer.find('.line').each(function( n ){
                n.remove();
            });

            while ( x < 1 ){

                line = this.newLine();

                for ( x; x < 1; x += resolution ){

                    y = fn( x );
                    // make sure that nearly zero is zero
                    y = Math.abs(y) < 1e-6 ? 0 : y;

                    // both negative or positive
                    if ( py*y > 0 || py === 0 ){

                        points.push( sx*x, sy*y );
                        py = y;

                    } else {
                        if ( y !== 0 ){

                            points.push( sx*getZero(x - resolution, py, x, y), 0 ); // last point before zero crossing
                        } else {
                            points.push( sx*x, 0 );
                        }

                        line.points( points );
                        line.fill( py >= 0 ? this.posColor : this.negColor );
                        line.stroke( line.fill() );
                        py = 0;
                        this.allPoints = this.allPoints.concat( points );
                        points = [ points[ points.length - 2 ], points[ points.length - 1] ];
                        break;
                    }
                }
            }

            points.push( sx, sy*fn(1) );
            points.push( sx, 0 );
            line.fill( py >= 0 ? this.posColor : this.negColor );
            line.stroke( line.fill() );
            line.points( points );
            this.allPoints = this.allPoints.concat( points );
            this.layer.draw();
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

        ,setMarker: function( x ){

            var fn = this.fn
                ,sx = this.scaleX
                ,sy = this.scaleY
                ;

            if ( !fn ){
                return;
            }

            this.marker.x( sx * x );
            this.marker.y( sy * fn( x ) );

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
