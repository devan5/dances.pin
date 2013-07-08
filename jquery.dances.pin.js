/**
 * @fileoverview
 * @author devan5 <devan5.pan@gmail.com>
 * @version 1.0_dev
 * @Date 2013.07.08
 *
 * @example <caption>simple</caption>
 * $(".box-hdr").pin();
 *
 * @example <caption>full</caption>
 * $(".box-hdr").pin({
 *     watcher: "selectors",
 *     eInit: function($piner){
 *         初始化的回调, 此时 wrapper 已经创建好, 第一个实参 , 可根据需求使用
 *     },
 *
 *     eIn: function(){
 *         进入监视事件
 *     },
 *
 *     eOut: function(){
 *         移出监视的事件
 *     },
 *
 *     eOutRange: function(){
 *         @TODO 移出监视范围事件
 *     },
 *
 *     eCal: function(nLeft, nTop){
 *         不常用, 计算 元素 坐标值事件, 可干涉其结果
 *         @return {Object} offset
 *         @type {Number} offset.left
 *         @type {Number} offset.top
 *     },
 *
 * });
 */

/**
 * @throws jQuery is not ready
 */
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

	/**
	 *
	 * @name Throttle
	 * @param {Function} fn
	 * @param {Number} time
	 * @returns {Function}
	 */
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

	$.prototype.pin = function(conf){

		conf = $.extend(/** @lends jQuery.prototype */{
			watcher  : "",

			// 进入监视
			eInit    : placeFn,
			// 进入监视
			eIn      : placeFn,
			// 移出(最小)监视
			eOut     : placeFn,
			// 移出(最大)监视范围, 可选
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

		if(this.fOnCal){
			offset = this.fOnCal(top, left) || {};
			top = "number" === typeof offset.top ? offset.top : top;
			left = "number" === typeof offset.left ? offset.left : left;
		}

		this.nTop = top;
		this.nLeft = left;
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
			// @TODO outOfRange
		}

	}

	function onResize(){
		this.$piner.width(this._$watch.width())
	}


})(window.jQuery);