(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['popcorn'], factory);
    } else {
        // Browser globals
        factory(root.Popcorn);
    }
}(this, function (Popcorn) {

    var perf = window.performance;

    var now = (function(){
        // http://updates.html5rocks.com/2012/05/requestAnimationFrame-API-now-with-sub-millisecond-precision
        return (perf && perf.now) ?
            function(){ return (perf.now() + perf.timing.navigationStart) } :
            Date.now ?
                function(){ return Date.now(); } :
                function(){ return (new Date()).getTime(); }
                ;
    })();

    var animThrottle = function( fn, scope ){
        var to
            ,call = false
            ,args
            ,cb = function(){
                window.cancelAnimationFrame( to );
                if ( call ){
                    call = false;
                    to = window.requestAnimationFrame( cb );
                    fn.apply(scope, args);
                } else {
                    to = false;
                }
            }
            ;

        scope = scope || null;

        return function(){
            call = true;
            args = arguments;
            if ( !to ){
                cb();
            }
        };
    };

    /*******
     * Heavily modified from original source:
     * Tween.js - Licensed under the MIT license
     * https://github.com/sole/tween.js
     */

    Popcorn.Easing = {

    	Linear: {

    		None: function ( k ) {

    			return k;

    		}

    	},

    	Quadratic: {

    		In: function ( k ) {

    			return k * k;

    		},

    		Out: function ( k ) {

    			return k * ( 2 - k );

    		},

    		InOut: function ( k ) {

    			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
    			return - 0.5 * ( --k * ( k - 2 ) - 1 );

    		}

    	},

    	Cubic: {

    		In: function ( k ) {

    			return k * k * k;

    		},

    		Out: function ( k ) {

    			return --k * k * k + 1;

    		},

    		InOut: function ( k ) {

    			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
    			return 0.5 * ( ( k -= 2 ) * k * k + 2 );

    		}

    	},

    	Quartic: {

    		In: function ( k ) {

    			return k * k * k * k;

    		},

    		Out: function ( k ) {

    			return 1 - ( --k * k * k * k );

    		},

    		InOut: function ( k ) {

    			if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
    			return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

    		}

    	},

    	Quintic: {

    		In: function ( k ) {

    			return k * k * k * k * k;

    		},

    		Out: function ( k ) {

    			return --k * k * k * k * k + 1;

    		},

    		InOut: function ( k ) {

    			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
    			return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

    		}

    	},

    	Sinusoidal: {

    		In: function ( k ) {

    			return 1 - Math.cos( k * Math.PI / 2 );

    		},

    		Out: function ( k ) {

    			return Math.sin( k * Math.PI / 2 );

    		},

    		InOut: function ( k ) {

    			return 0.5 * ( 1 - Math.cos( Math.PI * k ) );

    		}

    	},

    	Exponential: {

    		In: function ( k ) {

    			return k === 0 ? 0 : Math.pow( 1024, k - 1 );

    		},

    		Out: function ( k ) {

    			return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );

    		},

    		InOut: function ( k ) {

    			if ( k === 0 ) return 0;
    			if ( k === 1 ) return 1;
    			if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
    			return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );

    		}

    	},

    	Circular: {

    		In: function ( k ) {

    			return 1 - Math.sqrt( 1 - k * k );

    		},

    		Out: function ( k ) {

    			return Math.sqrt( 1 - ( --k * k ) );

    		},

    		InOut: function ( k ) {

    			if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
    			return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

    		}

    	},

    	Elastic: {

    		In: function ( k ) {

    			var s, a = 0.1, p = 0.4;
    			if ( k === 0 ) return 0;
    			if ( k === 1 ) return 1;
    			if ( !a || a < 1 ) { a = 1; s = p / 4; }
    			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    			return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );

    		},

    		Out: function ( k ) {

    			var s, a = 0.1, p = 0.4;
    			if ( k === 0 ) return 0;
    			if ( k === 1 ) return 1;
    			if ( !a || a < 1 ) { a = 1; s = p / 4; }
    			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );

    		},

    		InOut: function ( k ) {

    			var s, a = 0.1, p = 0.4;
    			if ( k === 0 ) return 0;
    			if ( k === 1 ) return 1;
    			if ( !a || a < 1 ) { a = 1; s = p / 4; }
    			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    			if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
    			return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;

    		}

    	},

    	Back: {

    		In: function ( k ) {

    			var s = 1.70158;
    			return k * k * ( ( s + 1 ) * k - s );

    		},

    		Out: function ( k ) {

    			var s = 1.70158;
    			return --k * k * ( ( s + 1 ) * k + s ) + 1;

    		},

    		InOut: function ( k ) {

    			var s = 1.70158 * 1.525;
    			if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
    			return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

    		}

    	},

    	Bounce: {

    		In: function ( k ) {

    			return 1 - TWEEN.Easing.Bounce.Out( 1 - k );

    		},

    		Out: function ( k ) {

    			if ( k < ( 1 / 2.75 ) ) {

    				return 7.5625 * k * k;

    			} else if ( k < ( 2 / 2.75 ) ) {

    				return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

    			} else if ( k < ( 2.5 / 2.75 ) ) {

    				return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

    			} else {

    				return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

    			}

    		},

    		InOut: function ( k ) {

    			if ( k < 0.5 ) return TWEEN.Easing.Bounce.In( k * 2 ) * 0.5;
    			return TWEEN.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;

    		}

    	}

    };

    Popcorn.plugin('tween', function( opts ){

        var track = this
            ,active = false
            ,onUpdate = opts.onUpdate
            ,onStart = opts.onStart
            ,onEnd = opts.onEnd
            ,start = (opts.start || 0) * 1000
            ,end = (opts.end || track.duration()) * 1000
            ,from = opts.from || {}
            ,to = opts.to || {}
            ,current = {}
            ,invDuration = 1 / (end - start)
            ,easing = opts.easing || Popcorn.Easing.Linear.None
            ,currentTime = -1000
            ,lastTime = now()
            ,eventData = {
                from: from
                ,to: to
                ,start: start
                ,end: end
                ,current: current
            }
            ;


        var update = function( time ){
            var property;
            var initial;
			var final;
            var elapsed = ( time - start ) * invDuration;
    		elapsed = Math.min(Math.max(elapsed, 0), 1);

    		var value = easing( elapsed );

            for ( property in from ){
                initial = from[ property ] || 0;
                final = to[ property ];

                // Parses relative end values with start as base (e.g.: +10, -3)
				if ( typeof(final) === "string" ) {
					final = initial + parseFloat(final, 10);
				}

				// protect against non numeric properties.
				if ( typeof(final) === "number" ) {
					current[ property ] = initial + ( final - initial ) * value;
				}
            }

            if ( onUpdate ){
                onUpdate( current, value );
            }
        };

        var updateTime = function(){
            var time = track.currentTime() * 1000;
            currentTime =  time - (now() - lastTime);
        };

        var timeCallback = function(){
            var t = now();
            window.requestAnimationFrame(timeCallback);

            if ( active && !track.paused() ){
                currentTime += ( t - lastTime );
                update( currentTime );
            }

            if ( active && track.paused() ){
                currentTime = track.currentTime() * 1000;
                update( currentTime );
            }

            lastTime = t;
        };

        // star the loop
        timeCallback();

        return {
            start: function(){
                if ( onStart ){
                    onStart( eventData );
                }
                updateTime();
                track.on('seek', updateTime);
                active = true;
            }
            ,end: function(){
                active = false;
                track.off('seek', updateTime);
                updateTime();
                if ( onEnd ){
                    onEnd( eventData );
                }
            }
        };
    });
}));
