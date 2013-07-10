/*~~~~~~~~
with dances.plugins

	called: pin

	version: 1.0

	firstDate: 2013.04.18

	lastDate: 2013.04.18

	require: [
		"jQuery"
	],

	effect: [
		+. {effects},
		+. {effects}
	],

	log: {
		"v1.0": [
			+. {logs},
			+. {logs}
		]
	}

~~~~~~~~*/

/*_______
syntax:
	dances.pin("electors,[ fnIn,][ fnOut,][ opts]);

	opts = {
		// 进入范围
		onIn: function(){},

		// 移出范围 inCallback 反方向
		onOut: function(){},

		// 移出设定另一端范围(可选)
		onOutRange: function(){},

		// 当计算的时候
		onCal: function(){},

		// 水平最大距离(可选)
		levelRange: "",

		// 垂直最大距离(可选)
		verticalRange: ""

	};
_______*/

// 命名扩展
if ("function" !== typeof window.dances &&  "object" !== typeof window.dances){
	window.dances = {};

	dances.$eval = function(){
		return eval.apply(null, arguments);
	};

	// $log
	window.$log = (function(){
		var
			$log,
			logRepo = {}
		;

		$log = Boolean;

		if(window.console && window.console.log){
			$log = console.log;

			try{
				$log("_____" + (new Date).toString() + "_____");

			}catch(e){
				$log = null;
			}

			$log || ($log = function(){ console.log.apply(console, arguments); }) && $log("_____" + (new Date).toString() + "_____");

			window.$$log || (window.$$log = function(msg, method){
				method = method || "log";

				logRepo[method] || (logRepo[method] = console[method] ? console[method] : console.log);

				"function" === typeof console[method] ?
					logRepo[method].call(console, msg) :
					logRepo[method](msg)
				;

			});

		}

		return $log;
	})();
}


(function(exports, name, undefined){
	"use strict";

	var
		pin,
		Pin,
		scrollAio,

		fConf,

		pinRepo = [],
		$,

		fValidArgs,


		create = Object.create || (function(){

			var Foo = function(){ };

			return function(){

				if(arguments.length > 1){
					throw new Error('Object.create implementation only accepts the first parameter.');
				}

				var proto = arguments[0],
					type = typeof proto
					;

				if(!proto || ("object" !== type && "function" !== type)){
					throw new TypeError('TypeError: ' + proto + ' is not an object or null');
				}

				Foo.prototype = proto;

				return new Foo();
			}
		})(),

		// unCurrying
		uc = function(fn){
			return function(){
				return Function.prototype.call.apply(fn, arguments);
			}
		},

		// native softy Extend
		slice = uc(Array.prototype.slice),

		forEach = "function" === typeof Array.forEach ?
			Array.forEach :
			function(arr, fn){
				var len,
					i,
					fHas
				;

				fHas = Object.prototype.hasOwnProperty;

				for(i = 0, len = arr.length; i < len; i++){
					fHas.call(arr, i) && fn(arr[i], i, arr);
				}

			},

		pinPromise,

		emptyFn = function(){}

	;

	fConf = function(conf){
		conf = conf || {};

		if("function" === typeof conf.jquery && conf.jquery && conf.jquery()){

			$ && $(document).unbind("scroll.dances_pin");

			$ = conf.jquery;

			$(document).bind("scroll.dances_pin", scrollAio);
		}

	};

	scrollAio = function(){
		clearTimeout(pinPromise);
		pinPromise = setTimeout(function(){
			forEach(pinRepo, function(pin){
				pin.onScroll(
					Math.max(document.body.scrollTop ,document.documentElement.scrollTop),
					Math.max(document.body.scrollLeft ,document.documentElement.scrollLeft)
				);
			});
		}, 5);
	};

	$ = window.jQuery ? window.jQuery : $;
	$ && $(window).bind("scroll.dances_pin", scrollAio);

	fValidArgs = function(conf, requireType, defaultConf){
		var fType = dances.type
		;

		for(var prop in requireType){
			// 可配置参数
			if(requireType.hasOwnProperty(prop)){

				// 不符合的必须配置参数
				if(!conf.hasOwnProperty(prop) || requireType[prop].indexOf(fType(conf[prop])) === -1){
					// 必须配置参数 有推荐值
					if( defaultConf.hasOwnProperty(prop)){
						conf[prop] = defaultConf[prop];

					// 必须配置参数 没有推荐值
					}else{
						conf[prop] = null;
					}
				}
			}
		}

		return conf;
	};

	Pin = {

		init: function(){
			var
				args = slice(arguments),

				conf = args.pop()
			;

			this.status = "pristine";
			this.selectors = args.shift();

			if("[object Object]" !== Object.prototype.toString.call(conf)){
				args.push(conf);
				conf = {};
			}

			// inCallback
			// outCallback

			this.fInThere = "function" === typeof conf.onIn && conf.onIn || emptyFn;
			this.fOutThere = "function" === typeof conf.onOut && conf.onOut || emptyFn;
			this.fRangThere = "function" === typeof conf.onOutRange && conf.onOutRange || emptyFn;
			this.fOnCal = "function" === typeof conf.onCal && conf.onCal || emptyFn;


			this.fInThere = "function" === typeof args[0] ?
				args.shift() :
				this.fInThere
			;

			this.fOutThere = "function" === typeof args[0] ?
				args.shift() :
				this.fOutThere
			;

			this.fRangThere = "function" === typeof args[0] ?
				args.shift() :
				this.fRangThere
			;

			this.init = function(){ return this; };

			return this.on();
		},

		off: function(){
			var
				base
			;

			if(this.bOn){
				base = pinRepo;

				for(var i = 0, len = pinRepo.length; i < len; i++){
					if(base[i] === this){
						base.splice(1, i);
						this.bOn = false;
						break
					}

				}

			}

			return this;
		},

		on: function(){

			if(!this.bOn){

				this.calOffset();

				pinRepo.push(this);

				this.bOn = true;
			}

			return this;
		},

		remove: function(){
			return this;
		},

		// 监听函数
		onScroll: function(top, left){
			var
				localTop = this.nTop,
				localLeft = this.nLeft,

				_status = this.status
			;

			// 进入区域
			if(top > localTop && "in" !== _status){
				this.status = "in";
				"function" === typeof this.fInThere && this.fInThere();

			}else if(top < localTop && ("in" === _status)){
				this.status = "out";
				"function" === typeof this.fOutThere && this.fOutThere();

			}else{
				// TODO
			}

		},

		//
		calOffset: function(){
			var
				$el,
				offset,

				left,
				top
			;

			$el = this.$el;

			$el || ($el = this.$el = $(this.selectors));

			offset = $el.offset();

			top = offset.top;
			left = offset.left;

			this.nTop = top;
			this.nLeft = left;

			this.fOnCal(top, left);

			return this;
		}

	};

	pin = function(){

		var
			inst = create(Pin)
		;

		"string" === typeof arguments[0] && inst.init.apply(inst, arguments);

		return inst;
	};

	pin.conf = fConf;

	exports[name || "pin"] = pin;

	if(window.define && "function" === typeof define && define.amd && define.amd.dsPin){
		define(function(){
			return pin;
		});
	}

})(window.dances);