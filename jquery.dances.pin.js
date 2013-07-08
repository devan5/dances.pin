/**
 *
 */

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

	$("selectors").pin(conf);

	conf = {
		// 进入范围
		onIn: function(){},

		// 移出范围 inCallback 反方向
		onOut: function(){},

		// 移出设定另一端范围(可选)
		eOutRange: function(){},

		// 当计算的时候
		onCal: function(){},

		// 水平最大距离(可选)
		levelRange: "",

		// 垂直最大距离(可选)
		levelRange: ""

	};
_______*/

(function($){
	"use strict";

	var
		pinRepo,
		scrollAio,
		resizeAio,

		fInit,

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

		placeFn = function(){},

		throttle
	;

	if("string" !== typeof $().jquery){
		throw "jquery.dances.pin expect jQuery Library";
	}

	throttle = function(fn, time){
		var promise;
		time = "number" === typeof time ? time : 50;
		return function(){
			clearTimeout(promise);
			promise = setTimeout(fn, time);
		}
	};

	fInit = function (){
		pinRepo = [];

		scrollAio = function(){
			forEach(pinRepo, function(pin){
				onScroll.call(
					pin,
					Math.max(document.body.scrollTop, document.documentElement.scrollTop),
					Math.max(document.body.scrollLeft, document.documentElement.scrollLeft)
				);
			});
		};

		resizeAio = function(){
			forEach(pinRepo, function(pin){
				onResize.call(pin);
			});
		};

		$(document).bind("scroll.dances_pin", throttle(function(){
			scrollAio();
		}, 5));

		$(window).bind("resize.dances_pin", throttle(function(){
			scrollAio();
			resizeAio();
		}, 40));

		fInit = null;
	};

	/**
	 *
	 * @param conf {Object}
	 */
	$.prototype.pin = function(conf){

		conf = $.extend({
			watcher  : "",

			// 进入监视
			eInit    : placeFn,
			// 进入监视
			eIn      : placeFn,
			// 移出(最小)监视
			eOut     : placeFn,
			// 溢出(最大)监视范围, 可选
			eOutRange: placeFn,
			// 每一次触发计算回调接口
			eCal     : placeFn

		}, conf);

		initPin.call(this, conf);

		calOffset.call(this);

		fInit && fInit();

		pinRepo.push(this);

		return this;
	};

	function initPin(conf){
		var $piner,
			nPt,
			nPtOrigin
		;

		this._$parent = this.parent();
		this._$watch = conf.watcher ? $(conf.watcher) : this._$parent;

		this.fRangThere = "function" === typeof conf.eOutRange && conf.eOutRange;
		this.fOnCal = "function" === typeof conf.eCal && conf.eCal;

		nPtOrigin = parseInt(this._$parent.css("paddingTop"), 10);
		nPt = this.outerHeight(true) + nPtOrigin;

		this.fInThere = function(){
			this.prependTo(this.$piner);
			this._$parent.css("paddingTop", nPt);
			this.$piner.show();
			conf.eIn && conf.eIn();
		};

		this.fOutThere = function(){
			this.prependTo(this._$parent);
			this._$parent.css("paddingTop", nPtOrigin);
			this.$piner.hide();
			conf.eOut && conf.eOut();
		};

		$piner =
		$("<div class=\"dancesPin\"></div>")
			.css({
				position: "fixed",
				left    : this._$watch.offset().left,
				// 可配置吗?
				top     : 0
			})
			.hide().appendTo("body")
		;

		this.$piner = $piner;

		onResize.call(this);

		// runs Init completion
		"function" === typeof conf.eInit && conf.eInit($piner);

	}

	function calOffset(){
		var
			offset,
			left,
			top
		;

		offset = this._$watch.offset();
		top = offset.top;
		left = offset.left;

		this.nTop = top;
		this.nLeft = left;

		this.fOnCal && this.fOnCal(top, left);

	}

	function onScroll(top, left){
		var
			localTop = this.nTop,
			localLeft = this.nLeft,

			_status = this._status
		;

		// 进入区域
		if(top > localTop && "in" !== _status){
			this._status = "in";
			"function" === typeof this.fInThere && this.fInThere();

		}else if(top < localTop && ("in" === _status)){
			this._status = "out";
			"function" === typeof this.fOutThere && this.fOutThere();

		}else{
			// TODO outOfRange
		}

	}

	function onResize(){
		this.$piner.width(this._$watch.width())
	}


})(window.jQuery);