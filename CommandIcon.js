//=============================================================================
// CommandIcon.js
// ----------------------------------------------------------------------------
// Copyright (c) 2015 Triacontane
// Translator : ReIris
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.1 2016/03/07 オプション画面のレイアウトが崩れる問題を修正
// 1.0.0 2016/03/06 初版
// ----------------------------------------------------------------------------
// [Blog]   : http://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc 項目追加圖標插件
 * @author トリアコンタン
 *
 * @help 圖標將可以添加到選單和標題窗口中。
 * 控制字元可用於命令，因此可以像顯示訊息一樣設置圖標和更改文本顏色。
 * 但是，當文字超出寬度時自動縮小文字的功能無效。
 *
 * 這個插件沒有插件命令。
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */

(function () {
    'use strict';
    Window_Command.prototype.drawText = function(text, x, y, width, align) {
        if (this instanceof Window_Options) {
            Window_Base.prototype.drawText.apply(this, arguments);
        } else {
            this.drawTextEx(text, x, y);
        }
    };
})();
