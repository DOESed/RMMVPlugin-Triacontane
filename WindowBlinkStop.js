//=============================================================================
// WindowBlinkStop.js
// ----------------------------------------------------------------------------
// Copyright (c) 2015-2017 Triacontane
// Translator : ReIris
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.0 2017/12/09 初版
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================
/*:ja
 * @plugindesc 停止窗口選擇閃爍插件
 * @author トリアコンタン
 *
 * @help WindowBlinkStop.js
 *
 * 選擇中窗口游標的閃爍停止。
 *
 * 這個插件沒有插件命令。
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */

(function() {
    'use strict';

    var _Window__updateCursor = Window.prototype._updateCursor;
    Window.prototype._updateCursor = function() {
        this._animationCount = 0;
        _Window__updateCursor.apply(this, arguments);
    };
})();

