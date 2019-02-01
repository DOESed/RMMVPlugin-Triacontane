//=============================================================================
// SideEffectSkill.js
// ----------------------------------------------------------------------------
// (C) 2016 Triacontane
// Translator : ReIris
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.3.0 2018/11/29 行動が会心だった場合のみ副作用を適用できる機能を追加
// 1.2.3 2017/10/10 0ターン目に戦闘行動の強制を実行するとエラーになる問題の修正
// 1.2.2 2017/10/07 ターン終了時の副作用を持つスキルでトドメをさした場合、次の戦闘のターン終了時に副作用が発生する問題を修正
// 1.2.1 2017/06/10 自動戦闘が有効なアクターがいる場合に一部機能が正常に動作しない問題を修正
// 1.2.0 2017/06/01 弱点時のみ副作用が適用できる機能を追加
// 1.1.1 2017/01/24 副作用設定時にターン終了時にダメージのポップアップ等が出なくなる問題を修正
// 1.1.0 2016/12/13 フロントビュー時にエフェクト効果のメッセージが重複して表示される問題を修正
// 1.0.2 2016/10/10 行動パターンが何も設定されていない敵キャラが行動しようとするとエラーになる問題を修正
// 1.0.1 2016/10/10 タイミングが「スキル使用時」「ターン開始時」以外のものについて、対象者にも効果が適用されていた問題を修正
// 1.0.0 2016/09/25 初版
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc 技能附加作用插件
 * @author triacontane
 *
 * @help 可以在使用技能時添加對使用者的附加作用。
 * 附加作用的時機可以從以下幾個選擇。
 *
 * ・技能輸入時(敵方專用)
 * 在我方的行動輸入前的附加作用。敵方專用效果。
 *
 * ・技能使用前
 * 在使用技能前會有附加作用，在使用技能時使用者帶有該附加作用。
 *
 * ・技能使用時
 * 在技能使用時附加作用，使用者跟技能對象都會有附加作用。
 *
 * ・技能使用後
 * 在技能使用後附加作用，使用者跟技能對象都會有附加作用。
 * 除了微妙的時間差異，它幾乎與「技能使用時」相同。
 *
 * ・回合開始時
 * 在我方的動作輸入完畢時回合開始的瞬間附加作用。
 *
 * ・回合結束時
 * 在我方全員的行動結束的回合結束瞬間附加作用。
 *
 * 還有技能「行動成功時」「行動失敗時」「行動在弱點時」
 * 的情況下可以附加作用。
 *
 * 在技能的注釋中輸入如下。
 * 在使用效果中，指定的附加效果的目標將更改為使用者。
 * 而不是技能指定的對象。（它不適用於技能對象）
 *
 * <SES_OnSkillInput:4,3>  # 技能輸入時，効果[4][3]附加於使用者身上（敵方專用）
 * <SES_OnSkillBefore:3>   # 技能使用前，効果[3]附加在使用者身上。
 * <SES_OnSkillUsing:3>    # 技能使用時，効果[3]附加在使用者身上。
 * <SES_OnSkillAfter:1,5>  # 技能使用後，効果[1][5]附加在使用者身上。（逗號[,]區分）
 * <SES_OnTurnStart:2,4>   # 回合開始時，効果[2][4]附加在使用者身上。
 * <SES_OnTurnEnd:8>       # 回合結束時，効果[8]附加在使用者身上。
 * <SES_HitOnly>           # 僅在行動成功時附加作用
 * <SES_MissOnly>          # 僅在行動失敗時附加作用
 * <SES_EffectiveOnly>     # 僅在行動在弱點時附加作用
 * <SES_CriticalOnly>      # 僅在行動在會心一擊時附加作用
 *
 * 複數效果指定的情況，使用逗號[,]區分。效果的順序從[1]開始。
 * 輸入附加作用功能僅適用於敵方角色。
 *
 * 效果「一般劇情」的使用時機為
 * 「回合開始時」「技能使用時」「技能使用後」「回合結束時」
 * 只有在適當的時間才會執行。
 *
 * ・腳本（進階）
 * 執行具有附加作用的公共事件時，您可以使用以下腳本獲取附加作用的戰鬥目標。
 * $gameTemp.getCommonEventSubjectBattler();
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
    var metaTagPrefix = 'SES_';

    var getArgArrayString = function(args, upperFlg) {
        var values = getArgString(args, upperFlg).split(',');
        if (values[0] === '') values = [];
        for (var i = 0; i < values.length; i++) values[i] = values[i].trim();
        return values;
    };

    var getArgArrayEval = function(args, min, max) {
        var values = getArgArrayString(args, false);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        for (var i = 0; i < values.length; i++) values[i] = eval(values[i]).clamp(min, max);
        return values;
    };

    var getArgString = function(arg, upperFlg) {
        arg = convertEscapeCharacters(arg);
        return upperFlg ? arg.toUpperCase() : arg;
    };

    var convertEscapeCharacters = function(text) {
        if (text == null || text === true) text = '';
        var windowLayer = SceneManager._scene._windowLayer;
        return windowLayer ? windowLayer.children[0].convertEscapeCharacters(text) : text;
    };

    var getMetaValue = function(object, name) {
        var metaTagName = metaTagPrefix + (name ? name : '');
        return object.meta.hasOwnProperty(metaTagName) ? object.meta[metaTagName] : undefined;
    };

    var getMetaValues = function(object, names) {
        if (!Array.isArray(names)) return getMetaValue(object, names);
        for (var i = 0, n = names.length; i < n; i++) {
            var value = getMetaValue(object, names[i]);
            if (value !== undefined) return value;
        }
        return undefined;
    };

    //=============================================================================
    // DataManager
    //  データベースのロード時にスキルとアイテムの使用効果から副作用対象を抜き取ります。
    //  以下のプロパティを新規で追加します。
    //   sideEffectOnInput  : スキル入力時副作用
    //   sideEffectOnBefore : スキル使用前副作用
    //   sideEffectOnAfter  : スキル使用後副作用
    //   sideEffectOnStart  : ターン開始時副作用
    //   sideEffectOnEnd    : ターン終了時副作用
    //=============================================================================
    var _DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase      = function() {
        this._itemEffectsCategorize = false;
        _DataManager_loadDatabase.apply(this, arguments);
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded      = function() {
        var result = _DataManager_isDatabaseLoaded.apply(this, arguments);
        if (result && !this._itemEffectsCategorize) {
            this._itemEffectsCategorize = true;
            $dataItems.forEach(function(item) {
                this.categorizeItemEffects(item);
            }.bind(this));
            $dataSkills.forEach(function(skill) {
                this.categorizeItemEffects(skill);
            }.bind(this));
        }
        return result;
    };

    DataManager.categorizeItemEffects = function(data) {
        if (!data) return;
        var sideEffectOnEnd = [], sideEffectOnUsing = [], sideEffectOnBefore = [], sideEffectOnStart = [], sideEffectOnInput = [], sideEffectOnAfter = [];
        var numbersOnInput  = this.getSideEffectNumbers(data, ['OnSkillInput', 'スキル入力時']);
        var numbersOnBefore = this.getSideEffectNumbers(data, ['OnSkillBefore', 'スキル使用前']);
        var numbersOnUsing  = this.getSideEffectNumbers(data, ['OnSkillUsing', 'スキル使用時']);
        var numbersOnAfter  = this.getSideEffectNumbers(data, ['OnSkillAfter', 'スキル使用後']);
        var numbersOnStart  = this.getSideEffectNumbers(data, ['OnTurnStart', 'ターン開始時']);
        var numbersOnEnd    = this.getSideEffectNumbers(data, ['OnTurnEnd', 'ターン終了時']);
        var effects         = data.effects;
        for (var i = 0; i < effects.length; i++) {
            if (numbersOnInput.contains(i + 1)) {
                sideEffectOnInput.push(effects[i]);
                effects[i].sideEffect = true;
            }
            if (numbersOnBefore.contains(i + 1)) {
                sideEffectOnBefore.push(effects[i]);
                effects[i].sideEffect = true;
            }
            if (numbersOnUsing.contains(i + 1)) {
                sideEffectOnUsing.push(effects[i]);
                effects[i].sideEffect = true;
            }
            if (numbersOnAfter.contains(i + 1)) {
                sideEffectOnAfter.push(effects[i]);
                effects[i].sideEffect = true;
            }
            if (numbersOnStart.contains(i + 1)) {
                sideEffectOnStart.push(effects[i]);
                effects[i].sideEffect = true;
            }
            if (numbersOnEnd.contains(i + 1)) {
                sideEffectOnEnd.push(effects[i]);
                effects[i].sideEffect = true;
            }
        }
        data.effects = effects.filter(function(effect) {
            return !effect.sideEffect;
        });

        data.sideEffectOnInput  = sideEffectOnInput;
        data.sideEffectOnBefore = sideEffectOnBefore;
        data.sideEffectOnUsing  = sideEffectOnUsing;
        data.sideEffectOnAfter  = sideEffectOnAfter;
        data.sideEffectOnStart  = sideEffectOnStart;
        data.sideEffectOnEnd    = sideEffectOnEnd;
    };

    DataManager.getSideEffectNumbers = function(data, names) {
        var metaValue = getMetaValues(data, names);
        if (metaValue) {
            return getArgArrayEval(metaValue, 1);
        }
        return [];
    };

    //=============================================================================
    // BattleManager
    //  ターン開始時に開始時副作用を適用します。
    //=============================================================================
    var _BattleManager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn      = function() {
        this.makeActionOrders();
        this._sideEffectBattlers = this._actionBattlers.clone();
        _BattleManager_startTurn.apply(this, arguments);
        this.applyItemSideEffectStart();
    };

    var _BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn      = function() {
        _BattleManager_endTurn.apply(this, arguments);
        if (this._sideEffectBattlers) {
            this.applyItemSideEffectEnd();
        }
    };

    var _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction      = function() {
        _BattleManager_startAction.apply(this, arguments);
        this._action.applyItemSideEffect('sideEffectOnBefore');
    };

    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction      = function() {
        _BattleManager_endAction.apply(this, arguments);
        if (this._action) {
            this._action.applyItemSideEffect('sideEffectOnAfter');
        }
    };

    BattleManager.applyItemSideEffectStart = function() {
        this._sideEffectBattlers.forEach(function(battler) {
            var number = battler.numActions();
            for (var i = 0; i < number; i++) {
                battler.action(i).applyItemSideEffect('sideEffectOnStart');
            }
        }, this);
    };

    BattleManager.applyItemSideEffectEnd = function() {
        this._sideEffectBattlers.forEach(function(battler) {
            var actions = battler.getEndActions();
            actions.forEach(function(action) {
                action.applyItemSideEffect('sideEffectOnEnd');
            }, this);
            battler.resetEndActions();
        }, this);
    };

    BattleManager.displaySideEffectResult = function(subject) {
        this._logWindow.displaySideEffectResult(subject);
        switch (this._phase) {
            case 'input':
            case 'turn':
                this._logWindow.waitForLong();
        }
    };

    //=============================================================================
    // Game_Battler
    //  終了した行動を別変数に保持します。
    //=============================================================================
    var _Game_Battler_removeCurrentAction      = Game_Battler.prototype.removeCurrentAction;
    Game_Battler.prototype.removeCurrentAction = function() {
        var action = this.currentAction();
        if (action) {
            this._endActions = this.getEndActions();
            this._endActions.push(action);
        }
        _Game_Battler_removeCurrentAction.apply(this, arguments);
    };

    Game_Battler.prototype.getEndActions = function() {
        return this._endActions || [];
    };

    Game_Battler.prototype.resetEndActions = function() {
        this._endActions = null;
    };

    var _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _Game_Battler_onBattleEnd.apply(this, arguments);
        this.resetEndActions();
    };

    //=============================================================================
    // Game_Enemy
    //  行動入力時に副作用を適用します。
    //=============================================================================
    var _Game_Enemy_makeActions      = Game_Enemy.prototype.makeActions;
    Game_Enemy.prototype.makeActions = function() {
        _Game_Enemy_makeActions.apply(this, arguments);
        var number = this.numActions();
        for (var i = 0; i < number; i++) {
            this.action(i).applyItemSideEffect('sideEffectOnInput');
        }
        BattleManager.checkBattleEnd();
    };

    //=============================================================================
    // Game_Action
    //  副作用を適用します。
    //=============================================================================
    var _Game_Action_apply      = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        this._applyForSideEffect = true;
        _Game_Action_apply.apply(this, arguments);
        this.applyItemSideEffect('sideEffectOnUsing');
    };

    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        this._criticalForSideEffect = critical;
        return _Game_Action_makeDamageValue.apply(this, arguments);
    };

    var _Game_Action_applyItemUserEffect      = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        _Game_Action_applyItemUserEffect.apply(this, arguments);
        this._successForSideEffect = true;
    };

    var _Game_Action_calcElementRate = Game_Action.prototype.calcElementRate;
    Game_Action.prototype.calcElementRate = function(target) {
        var rate = _Game_Action_calcElementRate.apply(this, arguments);
        if (!BattleManager.isInputting() && rate >= 1.1) {
            this._effectiveForSideEffect = true;
        }
        return rate;
    };

    Game_Action.prototype.applyItemSideEffect = function(property) {
        if (!this.isValidSideEffect()) return;
        if (this.isNeedDisplaySideEffect(property)) {
            this.subject().result().clear();
        }
        this.item()[property].forEach(function(effect) {
            this.applyItemEffect(this.subject(), effect);
        }, this);
        this.applyItemSideEffectGlobal(property);
    };

    Game_Action.prototype.isValidSideEffect = function() {
        if (!this.item()) {
            return false;
        } else if (!this._applyForSideEffect) {
            return true;
        } else {
            return this.isValidSideEffectForSuccess() &&
                this.isValidSideEffectForFailure() &&
                this.isValidSideEffectForEffective() &&
                this.isValidSideEffectForCritical();
        }
    };

    Game_Action.prototype.isValidSideEffectForSuccess = function() {
        return this._successForSideEffect || !getMetaValues(this.item(), ['HitOnly', '成功時のみ']);
    };

    Game_Action.prototype.isValidSideEffectForFailure = function() {
        return !this._successForSideEffect || !getMetaValues(this.item(), ['MissOnly', '失敗時のみ']);
    };

    Game_Action.prototype.isValidSideEffectForEffective = function() {
        return this._effectiveForSideEffect || !getMetaValues(this.item(), ['EffectiveOnly', '弱点時のみ']);
    };

    Game_Action.prototype.isValidSideEffectForCritical = function() {
        return this._criticalForSideEffect || !getMetaValues(this.item(), ['CriticalOnly', '会心時のみ']);
    };

    Game_Action.prototype.applyItemSideEffectGlobal = function(property) {
        this.item()[property].forEach(function(effect) {
            if (effect.code === Game_Action.EFFECT_COMMON_EVENT) {
                $gameTemp.reserveCommonEvent(effect.dataId);
                $gameTemp.setCommonEventSubject(this.subject());
            }
        }, this);
        if (this.isNeedDisplaySideEffect(property)) BattleManager.displaySideEffectResult(this.subject());
    };

    Game_Action.prototype.isNeedDisplaySideEffect = function(property) {
        return property !== 'sideEffectOnUsing' && property !== 'sideEffectOnEnd';
    };

    //=============================================================================
    // Game_Temp
    //  コモンイベントの予約をスタックします。
    //=============================================================================
    var _Game_Temp_initialize      = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function() {
        _Game_Temp_initialize.apply(this, arguments);
        this._commonEventReserveStack   = [];
        this._commonEventSubjects       = [];
        this._commonEventSubjectBattler = null;
        this.getCommonEventSubjectBattler();
    };

    var _Game_Temp_reserveCommonEvent      = Game_Temp.prototype.reserveCommonEvent;
    Game_Temp.prototype.reserveCommonEvent = function(commonEventId) {
        if (this.isCommonEventReserved()) {
            this._commonEventReserveStack.push(commonEventId);
        } else {
            _Game_Temp_reserveCommonEvent.apply(this, arguments);
        }
    };

    Game_Temp.prototype.setCommonEventSubject = function(battler) {
        this._commonEventSubjects.push(battler);
    };

    var _Game_Temp_clearCommonEvent      = Game_Temp.prototype.clearCommonEvent;
    Game_Temp.prototype.clearCommonEvent = function() {
        _Game_Temp_clearCommonEvent.apply(this, arguments);
        if (this._commonEventReserveStack.length > 0) {
            this.reserveCommonEvent(this._commonEventReserveStack.shift());
        }
        if (this._commonEventSubjects.length > 0) {
            this._commonEventSubjectBattler = this._commonEventSubjects.shift();
        } else {
            this._commonEventSubjectBattler = null;
        }
    };

    Game_Temp.prototype.getCommonEventSubjectBattler = function() {
        return this._commonEventSubjectBattler;
    };

    //=============================================================================
    // Window_BattleLog
    //  副作用効果を出力します。
    //=============================================================================
    Window_BattleLog.prototype.displaySideEffectResult = function(subject) {
        this.displayChangedStates(subject);
        this.displayChangedBuffs(subject);
        subject.startDamagePopup();
        if (!$gameSystem.isSideView()) {
            this.displayDamage(subject);
        }
    };

    Window_BattleLog.prototype.waitForLong = function() {
        if (this.countTextStack() > 0) {
            this.push('waitForSideEffectMessage');
            this.push('clear');
        }
    };

    Window_BattleLog.prototype.waitForSideEffectMessage = function() {
        this._waitCount = 30;
    };

    Window_BattleLog.prototype.countTextStack = function() {
        return this._methods.reduce(function(prevValue, method) {
            return prevValue + (method.name === 'addText' ? 1 : 0);
        }, 0);
    };
})();

