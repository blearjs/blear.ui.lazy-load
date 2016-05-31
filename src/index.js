/**
 * ui/LazyLoad
 * @author ydr.me
 * @create 2016-04-25 19:40
 */




'use strict';

var UI = require('blear.ui');
var Scrollable = require('blear.classes.scrollable');
var object = require('blear.utils.object');
var array = require('blear.utils.array');
var fun = require('blear.utils.function');
var loader = require('blear.utils.loader');
var image = require('blear.utils.image');
var selector = require('blear.core.selector');
var attribute = require('blear.core.attribute');
var layout = require('blear.core.layout');


var win = window;
var KEY = '__classes/lazy-load/__';
var defaults = {
    /**
     * 容器
     */
    el: document,

    /**
     * 元素选择器
     * @type String|HTMLElement
     */
    itemSelector: 'img,div',

    /**
     * data 属性名
     * @type String
     */
    dataOriginal: 'original',

    /**
     * 判断范围增量
     * @type Number
     */
    offset: 100,

    /**
     * 判断延迟时间
     * @type Number
     */
    delay: 30,

    /**
     * 七牛 webp 转换
     */
    qiniuWebp: true
};
var LazyLoad = UI.extend({
    className: 'LazyLoad',
    constructor: function (options) {
        var the = this;

        the[_options] = options = object.assign(true, {}, defaults, options);
        the[_root] = selector.query(options.el)[0];
        LazyLoad.parent(the, options);

        // init node

        // init event
        var scrollable = new Scrollable();
        var offset = options.offset;
        var _onScroll = function () {
            var els = the[_cache];
            var docScrollLeft = layout.scrollLeft(win);
            var docScrollTop = layout.scrollTop(win);
            var docScrollRight = docScrollLeft + layout.width(win);
            var docScrollBottom = docScrollTop + layout.height(win);
            var removeIndexes = [];
            var inViewPortEls = array.filter(els, function (el, index) {
                return !el[KEY] && the[_inViewPort](el, docScrollTop, docScrollRight, docScrollBottom, docScrollLeft);
            });

            the[_cache] = array.remove(els, removeIndexes);
            array.each(inViewPortEls, function (index, el) {
                if (the.emit('view', el) === false) {
                    return;
                }

                the[_setOriginal](el);
            });
        };

        scrollable.on('scroll', fun.debounce(_onScroll, options.delay));
        the.update();
        _onScroll();
    },


    /**
     * 有新增图片，更新缓存队列
     * @returns {LazyLoad}
     */
    update: function () {
        var the = this;
        var list = selector.query(the[_options].itemSelector, the[_root]);

        the[_cache] = array.filter(list, function (imgEl) {
            return !imgEl[KEY];
        });

        return the;
    },

    /**
     * 销毁实例
     */
    destroy: function () {
        LazyLoad.parent.destroy(the);
    }
});
var _options = LazyLoad.sole();
var _root = LazyLoad.sole();
var _cache = LazyLoad.sole();
var _inViewPort = LazyLoad.sole();
var _setOriginal = LazyLoad.sole();
var pro = LazyLoad.prototype;


pro[_inViewPort] = function (el, docScrollTop, docScrollRight, docScrollBottom, docScrollLeft) {
    var offset = this[_options].offset;
    var imgOffsetLeft = layout.offsetLeft(el);
    var imgOffsetTop = layout.offsetTop(el);
    var imgOuterWidth = layout.outerWidth(el);
    var imgOuterHeight = layout.outerHeight(el);
    var imgOffsetRight = imgOffsetLeft + imgOuterWidth + offset;
    var imgOffsetBottom = imgOffsetTop + imgOuterHeight + offset;
    imgOffsetLeft -= offset;
    imgOffsetTop -= offset;

    return (!// 非
            (
                // 元素底边窗口顶部之上
                imgOffsetBottom < docScrollTop ||
                // 元素上边在窗口底部之下
                imgOffsetTop > docScrollBottom ||
                // 元素左边在窗口右边
                imgOffsetLeft > docScrollRight ||
                // 元素右边在窗口左边
                imgOffsetRight < docScrollLeft
            )
    );
};

/**
 * 设置 original
 * @param el
 */
pro[_setOriginal] = function (el) {
    var the = this;
    var options = the[_options];
    var original = attribute.data(el, options.dataOriginal);

    if (!original) {
        return;
    }

    var setOriginal = function () {
        the.emit('beforeLoad', original);
        loader.img(original, function () {
            the.emit('afterLoad', original);
        });

        switch (el.tagName) {
            case 'IMG':
                attribute.attr(el, 'src', original);
                break;

            default:
                attribute.style(el, 'background-image', 'url(' + original + ')');
        }
    };

    if (options.qiniuWebp) {
        image.supportWebp(function (bool) {
            original = bool ? image.qiniuWebp(original) : original;
            setOriginal();
        });
    } else {
        setOriginal();
    }
};

LazyLoad.defaults = defaults;
module.exports = LazyLoad;
