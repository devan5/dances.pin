/**
 * @fileoverview
 * @author devan5 <devan5.pan@gmail.com>
 * @version 1.0_dev
 * @Date 2013.07.10
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

		debounce,
        throttle
	;

	if("string" !== typeof $().jquery){
		throw "jquery.dances.pin expect jQuery Library";
	}

	/**
	 *
	 * @name debounce
	 * @param {Function} fn
	 * @param {Number} time
	 * @param {Boolean} bImmediate
	 * @returns {Function}
	 */
	debounce = function(fn, time, bImmediate){
		var promise, flag;
		time = "number" === typeof time ? time : 50;

		return function(){
            clearTimeout(promise);
            if(bImmediate){
                if(!flag){
                    fn();
                    flag = true;
                }
                promise = setTimeout(function(){
                    flag = false;
                }, time);
            }else{
                promise = setTimeout(fn, time);
            }
		}
	};

    throttle = function(fn, nWaits){
        var
            promise,
            time
        ;
        return function(){
            clearTimeout(promise);

            if(new Date - time > nWaits){
                time = new Date;
                fn();
            }else{
                promise = setTimeout(function(){
                    time = new Date;
                    fn();
                }, nWaits);
            }

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

		$(window).bind("scroll.dances_pin", throttle(function(){
			scrollAio();
		}, 10));

		$(window).bind("resize.dances_pin", debounce(function(){
			scrollAio();
			resizeAio();
		}, 40));

		fInit = null;
	};

	$.prototype.pin = function(conf){

		conf = $.extend(/** @lends jQuery.prototype */{
            // 指定 监视的元素
            // 设定的 移入位置
            // 会监视 watch 宽度
            // 监视高度, 防止超出
            watcher      : "",

            // 进入监视
            eInit        : placeFn,
            // 进入监视
            eIn          : placeFn,
            // 移出(最小)监视
            eOut         : placeFn,
            // 移出(最大)监视范围, 可选
            eOutRange    : placeFn,
            // 每一次触发计算回调接口
            eCal         : placeFn,

            /**
             * @type {Number | Boolean}
             * 可选, 水平范围
             * 若指定为 true, 则追踪 watcher 或 parent 高度
             */
            levelRange   : NaN,

            /**
             * 可选, 垂直范围
             * @type {Number}
             */
            verticalRange: NaN

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

        conf.watcher && (this._$watch = $(conf.watcher));

        if(!this._$watch && true === conf.levelRange){
            this._$watch = this._$parent;
        }

        if("number" === typeof conf.levelRange && conf.levelRange === conf.levelRange){
            this.levelRange = conf.levelRange;
        }

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
                left    : (this._$watch || this._$parent).offset().left,
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
			offset
		;

		offset = (this._$watch || this._$parent).offset();
		this.nTop = offset.top;
		this.nLeft = offset.left;


        this.fOnCal && this.fOnCal(this);

        // 计算监视范围, 一定要在 fOnCal 事件之后.
        this.nMaxRange = this.levelRange ?
            this.levelRange :
            this._$watch ?
                offset.top +
                parseInt(this._$watch.outerHeight(), 10) -
                parseInt(this.$piner.outerHeight(), 10) :
                null
        ;

	}

	function onScroll(top, left){
		var
			localTop = this.nTop,
			localLeft = this.nLeft,

			_status = this._status,
            nMaxRange = this.nMaxRange
		;

        if(nMaxRange){
            if(top > nMaxRange){
                // 超出 监视范围
                if("hold" !== _status){
                    this.$piner.css({
                        position: "absolute",
                        top     : this.$piner.offset().top
                    });
                    this._status = "hold";
                    "function" === typeof this.fRangThere && this.fRangThere();
                }

                // 不用嗅探 进入监视
                return;

                // 回到 监视范围
            }else if("hold" === _status && top <= nMaxRange){
                this.$piner.css({ position: "fixed", top: 0 });
                this._status = "";
            }
        }

        // 进入监视
		if(top > localTop && "in" !== _status){
			this._status = "in";
			"function" === typeof this.fInThere && this.fInThere();
            calOffset.call(this);

        // 移出监视
		}else if(top < localTop && ("in" === _status)){
			this._status = "out";
			"function" === typeof this.fOutThere && this.fOutThere();
		}

	}

	function onResize(){
		this.$piner.width((this._$watch || this._$parent).width());
	}


})(window.jQuery);