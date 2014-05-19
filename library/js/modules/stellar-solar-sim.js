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

    var earthAbove = req.toUrl('../../images/earth-north.png');

    // Page-level Module
    var Module = M({

        // Module Constructor
        constructor: function( el ){

            var self = this;
            self.sims = {};
            self.initEvents();

            self.$el = $( el );
            var stage = new Kinetic.Stage({
                container: self.$el[0],
                width: self.$el.width(),
                height: self.$el.height()
            });

            function dim( r ){
                return r/600*self.$el.width();
            }

            var layer = new Kinetic.Layer();
            var r = 80;

            // earth
            var imageObj = new Image();
            imageObj.onload = function() {
                var earth = new Kinetic.Image({
                    x: dim( 300 ),
                    y: dim( 300 ),
                    image: imageObj,
                    width: dim( 2*r ),
                    height: dim( 2*r ),
                    rotation: -90,
                    offset: {
                        x: dim( r ),
                        y: dim( r )
                    }
                });
                layer.add(earth);
                earth.moveDown();

                stage.draw();
            };
            imageObj.src = earthAbove;

            // angle wedge
            var wedge = new Kinetic.Wedge({
                x: stage.width() / 2,
                y: stage.height() / 2,
                radius: dim( r ) * 0.75,
                angle: 60,
                fill: colors.red,
                stroke: colors.redDark,
                strokeWidth: 1
            });

            layer.add(wedge);
            stage.add(layer);
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
