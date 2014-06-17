define([
    'jquery',
    'moddef',
    'modules/stellar-solar-sim',
    'modules/eccentric-orbit-sim'
], function(
    $,
    M,
    StellarSolarSim,
    EccentricOrbitSim
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
                //self.sims.stellarSolar.start();
            });

            this.sims.eccentricOrbit = EccentricOrbitSim('#eccentric-orbit-sim');
            this.sims.eccentricOrbit.after('ready', function(){
                self.sims.eccentricOrbit.start();
            });
        }

    }, ['events']);

    return new Mediator();
});
