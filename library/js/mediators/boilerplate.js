define([
    'jquery',
    'moddef',
    'modules/eot-media',
    'modules/stellar-solar-sim',
    'modules/eccentric-orbit-sim',
    'modules/eot-graph',
    'modules/axial-tilt-sim',
    'modules/ecliptic-tilt-sim',
    'modules/eot-map'
], function(
    $,
    M,
    EOTMedia,
    StellarSolarSim,
    EccentricOrbitSim,
    EOTGraph,
    AxialTiltSim,
    EclipticTiltSim,
    EOTMap
) {
    'use strict';

    var Pi2 = 2*Math.PI;
    var deg = Math.PI / 180;

    function calcEOTFromTilt( ang, tilt ){
        var RA = Math.atan( Math.tan( ang ) * Math.cos( tilt * deg ) ), eot;
        // tan is discontinuous... so we make it continuous
        RA += Math.floor(ang / Math.PI + 0.5) * Math.PI;
        eot = ang - RA;
        eot = Math.abs(eot) < 1e-6 ? 0 : eot;
        return eot;
    }

    // Page-level Mediator
    var Mediator = M({

        // Mediator Constructor
        constructor: function(){

            var self = this;
            self.sims = {};
            self.initEvents();

            self.media = EOTMedia({
                controls: '#media-controls'
                ,tracks: [
                    '#media-sim1'
                ]
            });
            self.media.after('ready', function(){
                console.log('blah');
            });

            $(function(){
                self.onDomReady();
                self.resolve('domready');
            });
        }

        // Initialize events
        ,initEvents: function(){

            var self = this;
        }

        // DomReady Callback
        ,onDomReady: function(){

            var self = this;

            this.sims.stellarSolar = StellarSolarSim('#stellar-solar-sim');
            this.sims.stellarSolar.after('ready', function(){
                // self.sims.stellarSolar.start();
            });

            this.sims.eccentricOrbit = EccentricOrbitSim('#eccentric-orbit-sim');
            this.sims.eccentricOrbit.after('ready', function(){
                // self.sims.eccentricOrbit.start();
            });

            this.sims.eccentricOrbitPlot = EOTGraph('#eccentric-orbit-plot');
            this.sims.eccentricOrbitPlot.scaleY *= 1;
            this.sims.eccentricOrbit.on('change:eccentricity', function(){
                self.sims.eccentricOrbitPlot.plot( function(x){
                    return self.sims.eccentricOrbit.calcEOTAngle( x * self.sims.eccentricOrbit.daysPerYear );
                }, 0.01);
            });
            this.sims.eccentricOrbit.emit('change:eccentricity', this.sims.eccentricOrbit.e);

            this.sims.eccentricOrbit.on('change', function( e, data ){
                self.sims.eccentricOrbitPlot.setMarker( data.day / self.sims.eccentricOrbit.daysPerYear );
            });

            this.sims.axialTilt = AxialTiltSim('#axial-tilt-sim');
            this.sims.axialTilt.after('ready', function(){
                self.sims.axialTilt.start();
            });

            this.sims.eclipticTilt = EclipticTiltSim('#ecliptic-tilt-sim');
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                self.sims.eclipticTilt.setTilt( tilt );
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.eclipticTilt.setDay( day );
                self.sims.eclipticTilt.layer.draw();
            });

            this.sims.axialTiltPlot = EOTGraph('#axial-tilt-plot');
            this.sims.axialTiltPlot.scaleY *= 10;
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                self.sims.axialTiltPlot.plot( function( x ){
                    return calcEOTFromTilt( x * Pi2, tilt );
                }, 0.01);
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.axialTiltPlot.setMarker( day / self.sims.axialTilt.daysPerYear );
            });

            this.sims.axialTiltMap = EOTMap('#axial-tilt-map');
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                self.sims.axialTiltMap.setTilt( tilt );
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.axialTiltMap.setDay( day );
            });

            this.sims.axialTilt.emit('change:tilt', this.sims.axialTilt.tilt);

            // eot plot
            this.sims.eotPlot = EOTGraph('#eot-plot');
            this.sims.eotPlot.scaleY *= 10;
            function setEotFn( tilt ){
                self.sims.eotPlot.plot( function( x ){
                    return calcEOTFromTilt( (x - 76/365) * Pi2, tilt ) + self.sims.eccentricOrbit.calcEOTAngle( x * self.sims.eccentricOrbit.daysPerYear );;
                }, 0.01);
            }
            this.sims.axialTilt.on('change:tilt', function( e, tilt ){
                setEotFn( tilt );
            });
            this.sims.eccentricOrbit.on('change:eccentricity', function(){
                setEotFn( self.sims.axialTilt.tilt );
            });
            this.sims.axialTilt.on('change:day', function( e, day ){
                self.sims.eotPlot.setMarker( day / self.sims.axialTilt.daysPerYear );
            });
            setEotFn( self.sims.axialTilt.tilt );
        }

    }, ['events']);

    return new Mediator();
});
