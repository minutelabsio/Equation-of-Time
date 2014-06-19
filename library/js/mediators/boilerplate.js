define([
    'jquery',
    'moddef',
    'modules/stellar-solar-sim',
    'modules/eccentric-orbit-sim',
    'modules/eot-graph',
    'modules/axial-tilt-sim'
], function(
    $,
    M,
    StellarSolarSim,
    EccentricOrbitSim,
    EOTGraph,
    AxialTiltSim
) {
    'use strict';

    // Page-level Mediator
    var Mediator = M({

        // Mediator Constructor
        constructor: function(){

            var self = this;
            self.sims = {};
            self.initEvents();

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
            this.sims.eccentricOrbitPlot.scaleY *= 10;
            this.sims.eccentricOrbit.on('change:eccentricity', function(){
                self.sims.eccentricOrbitPlot.plot( function(x){
                    return self.sims.eccentricOrbit.calcEOTAngle( x * self.sims.eccentricOrbit.daysPerYear );
                }, 0.01);
            });
            this.sims.eccentricOrbit.emit('change:eccentricity', this.sims.eccentricOrbit.e);

            this.sims.eccentricOrbit.on('change', function( e, data ){
                // console.log(data.day)
                self.sims.eccentricOrbitPlot.setMarker( data.day / self.sims.eccentricOrbit.daysPerYear );
            });

            this.sims.axialTilt = AxialTiltSim('#axial-tilt-sim');
            this.sims.axialTilt.after('ready', function(){
                self.sims.axialTilt.start();
            });
        }

    }, ['events']);

    return new Mediator();
});
