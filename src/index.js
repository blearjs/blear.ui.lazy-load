/**
 * ui/LazyLoad
 * @author ydr.me
 * @create 2016-04-25 19:40
 * @update 2017年03月18日15:36:14
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
    delay: 30
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
        var scrollable = the[_scrollable] = new Scrollable({
            el: the[_root]
        });
        var onScroll = function () {
            var els = the[_cache];
            var removeIndexes = [];
            var inViewPortEls = array.filter(els, function (el, index) {
                return !el[KEY] && the[_inViewPort](el, layout.width(win), layout.height(win));
            });

            the[_cache] = array.remove(els, removeIndexes);
            array.each(inViewPortEls, function (index, el) {
                if (the.emit('view', el) === false) {
                    return;
                }

                the[_setOriginal](el);
            });
        };

        scrollable.on('scroll', fun.debounce(onScroll, options.delay));
        the.update();
        onScroll();
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
        var the = this;
        LazyLoad.invoke('destroy', the);
        the[_scrollable].destroy();
    }
});
var sole = LazyLoad.sole;
var _options = sole();
var _root = sole();
var _cache = sole();
var _inViewPort = sole();
var _setOriginal = sole();
var _scrollable = sole();
var KEY = sole();
var pro = LazyLoad.prototype;

pro[_inViewPort] = function (el, winWidth, winHeight) {
    var offset = this[_options].offset;
    var imgClientLeft = layout.clientLeft(el);
    var imgClientTop = layout.clientTop(el);
    var imgWidth = el.width;
    var imgHeight = el.height;

    return (!// 非
            (
                // 上边之上
                imgClientTop + imgHeight + offset < 0 ||
                // 右边之右
                imgClientLeft - offset > winWidth ||
                // 下边之下
                imgClientTop - offset > winHeight ||
                // 左边之左
                imgClientLeft + imgWidth + offset < 0
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
        el[KEY] = true;

        the.emit('beforeLoad', el, original);
        loader.img(original, function (err, el) {
            the.emit('afterLoad', err, el);
        });

        switch (el.tagName) {
            case 'IMG':
                attribute.attr(el, 'src', original);
                break;

            default:
                attribute.style(el, 'background-image', 'url(' + original + ')');
        }
    };

    setOriginal();
};

LazyLoad.defaults = defaults;
module.exports = LazyLoad;
