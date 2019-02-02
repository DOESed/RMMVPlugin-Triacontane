//=============================================================================
// BattleRecord.js
// ----------------------------------------------------------------------------
// Copyright (c) 2015 Triacontane
// Translator : ReIris
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.2.2 2018/04/30 ゴールドの増減について所持ゴールドを以上の額を減算したときの消費量が誤っていた問題を修正
// 1.2.1 2017/05/20 プラグイン未適用のデータをロードしたときに一部のスクリプトが実行エラーになる問題を修正
// 1.2.0 2016/12/25 アイテムの売買履歴を保持して取得できる機能を追加
// 1.1.3 2016/12/05 装備変更時に装備品の入手数がカウントアップされていた不具合を修正
// 1.1.2 2016/09/04 1.1.1の修正に一部不足があったものを追加修正
// 1.1.1 2016/09/02 プラグイン未適用のデータをロード後に攻撃かアイテム入手すると強制終了する問題を修正
// 1.1.0 2016/08/27 取得可能な項目を大幅に増やしました。
//                  アクター全員の合計値を容易に取得できるようにしました。
// 1.0.0 2016/08/25 初版
// ----------------------------------------------------------------------------
// [Blog]   : http://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc 戰鬥統計插件
 * @author トリアコンタン
 *
 * @help 在戰鬥中各式各樣的情報紀錄並可以取得。
 * 除了能夠作為記錄外，可以將其情報合併到特殊技能的損傷計算公式中。
 *
 * 角色有以下戰鬥要素的紀錄。
 *
 * ・技能使用次數(僅在戰鬥期間。其他項目皆相同)
 * ・全部技能使用次數統計
 * ・物品使用次數
 * ・全部物品使用次數統計
 * ・敵方擊破次數
 * ・全部敵方擊破次數統計
 * ・給予傷害的統計
 * ・給予傷害的最大值
 * ・承受傷害的統計
 * ・承受傷害的最大值
 * ・總恢復傷害統計
 * ・消耗MP統計
 * ・消耗TP統計
 * ・戰鬥不能次數
 *
 * 透過從事件命令「控制變量」中使用「腳本」來調用相應的腳本來檢索需要的數值。
 *
 * ・由資料庫中的「角色ID」取得的情況
 * $gameActors.actor(1).getSkillUseCounter(2);   # 角色[1]的技能[2]使用次數
 * $gameActors.actor(1).getAllSkillUseCounter(); # 角色[1]的全技能使用次數
 * $gameActors.actor(1).getItemUseCounter(3);    # 角色[1]的物品[3]使用次数
 * $gameActors.actor(1).getAllItemUseCounter();  # 角色[1]的全物品使用次數
 * $gameActors.actor(1).getKillEnemyCounter(4);  # 角色[1]的敵方[4]擊破次數
 * $gameActors.actor(1).getAllKillEnemyCounter();# 角色[1]的全敵方擊破次數
 * $gameActors.actor(1).attackDamageMax;         # 角色[1]的最大傷害值
 * $gameActors.actor(1).attackDamageSum;         # 角色[1]的給予傷害統計
 * $gameActors.actor(1).acceptDamageMax;         # 角色[1]的最大承傷值
 * $gameActors.actor(1).acceptDamageSum;         # 角色[1]的承受傷害統計
 * $gameActors.actor(1).recoverDamageSum;        # 角色[1]的回復傷害統計
 * $gameActors.actor(1).payCostMpSum;            # 角色[1]的消耗MP統計
 * $gameActors.actor(1).payCostTpSum;            # 角色[1]的消耗TP統計
 * $gameActors.actor(1).deadCounter;             # 角色[1]的戰鬥不能次數
 *
 * ・由隊伍的順序(起首為0)取得的情況
 * $gameActors.actor()[n] 或 $gameParty.members()[n] 替換[n]執行。
 * (範例)
 * $gameParty.members()[0].attackDamageMax;      # 隊伍第一位的最大傷害值
 *
 * ・在技能的傷害計算公式使用的情況
 * 將 $ gameActors.actor(n) 替換為 a(執行者) 或 b(對象) 並執行。
 * (範例)
 * a.getSkillUseCounter(5);  # 執行者的技能[5]使用次數
 * b.getKillEnemyCounter(6); # 對象對敵方[6]擊破次數
 *
 * ・全部角色的統計值取得的情況
 * $gameActors.actor(n)を$gameActors 在[n]的位置替換執行。
 * (例)
 * $gameActors.getKillEnemyCounter(4); # 全角色對敵方[4]擊破次數統計
 * $gameActors.getAllItemUseCounter(); # 全角色的全物品使用次數
 *
 * ・隊伍的戰鬥統計取得的情況
 * $gameParty.gainGoldSum;         # 獲得金錢統計
 * $gameParty.loseGoldSum;         # 消耗金錢統計
 * $gameParty.getGainItemSum(1);   # 物品[1]的獲得統計
 * $gameParty.getGainWeaponSum(1); # 武器[1]的獲得統計(初期裝備除外)
 * $gameParty.getGainArmorSum(1);  # 防具[1]的獲得統計(初期裝備除外)
 *
 * ・買賣紀錄情報取得的情況
 * 物品的買賣紀錄取得。
 * 開始ID與結束ID指定後，這個範圍內的買賣紀錄情報可以取得。
 * 沒有指定開始ID與結束的情況，將取得全部買賣紀錄情報的統計。
 *
 * 1.購買
 * # 從 ID[1] 到 ID[3] 為止的物品累計購買金額統計
 * $gameParty.getItemBuyingRecord().getUseGoldSum(1, 3);
 *
 * # 從 ID[2] 到 ID[4] 為止的物品累計購入數量統計
 * $gameParty.getItemBuyingRecord().getAmountSum(2, 4);
 *
 * # 物品的累計購買次數(大量購入只計算為一次購買)
 * $gameParty.getItemBuyingRecord().getTradeCount();
 *
 * # ID[1] 的物品累計購買金額
 * $gameParty.getWeaponBuyingRecord().getUseGoldSum(1);
 *
 * # ID[2] 的物品累計購買數量
 * $gameParty.getWeaponBuyingRecord().getAmountSum(2);
 *
 * # 武器的累計購買次數(大量購入只計算為一次購買)
 * $gameParty.getWeaponBuyingRecord().getTradeCount();
 *
 * # 全部防具的累計購買金額統計
 * $gameParty.getArmorBuyingRecord().getUseGoldSum();
 *
 * # 全部防具的累計購買數量統計
 * $gameParty.getArmorBuyingRecord().getAmountSum();
 *
 * # 防具の累計購入回数(大量購入只計算為一次購買)
 * $gameParty.getArmorBuyingRecord().getTradeCount();
 *
 * 2.販賣
 * # 從 ID[1] 到 ID[3]為止的物品累計販賣金額統計
 * $gameParty.getItemSellingRecord().getUseGoldSum(1, 3);
 *
 * # 從 ID[2] 到ID[4] 為止的物品累計販賣數量統計
 * $gameParty.getItemSellingRecord().getAmountSum(2, 4);
 *
 * # 物品的累計販賣次數(大量販賣只計算為一次販賣)
 * $gameParty.getItemSellingRecord().getTradeCount();
 *
 * # ID[1]的物品累計販賣金額
 * $gameParty.getWeaponSellingRecord().getUseGoldSum(1);
 *
 * # ID[2]的物品累計販賣數量
 * $gameParty.getWeaponSellingRecord().getAmountSum(2);
 *
 * # 武器的累計販賣回數(大量販賣只計算為一次販賣)
 * $gameParty.getWeaponSellingRecord().getTradeCount();
 *
 * # 全防具的累計販賣金額統計
 * $gameParty.getArmorSellingRecord().getUseGoldSum();
 *
 * # 全防具的累計販賣數量統計
 * $gameParty.getArmorSellingRecord().getAmountSum();
 *
 * # 防具的累計販賣次數統計(大量販賣只計算為一次販賣)
 * $gameParty.getArmorSellingRecord().getTradeCount();
 *
 * 應用的方法可以組合「動的データベース構築プラグイン」
 * 戰鬥統計與動態資料庫組合可以做成各式各樣的裝備。
 * 「動的データベース構築プラグイン」一起發布於原作者網站。
 *  url : http://triacontane.blogspot.jp/
 *
 * ・戰鬥統計初期化的情況
 *
 * 角色關聯統計
 * $gameActors.actor(角色ID).clearBattleRecord();
 *
 * 隊伍關聯統計
 * $gameParty.clearRecord();
 *
 * 這個插件沒有插件命令。
 * 
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */

function Game_TradeRecord() {
    this.initialize.apply(this, arguments);
}

(function() {
    'use strict';

    //=============================================================================
    // Game_BattlerBase
    //  戦績を記録します。
    //=============================================================================
    var _Game_BattlerBase_initMembers      = Game_BattlerBase.prototype.initMembers;
    Game_BattlerBase.prototype.initMembers = function() {
        _Game_BattlerBase_initMembers.apply(this, arguments);
        this.clearBattleRecord();
    };

    Game_BattlerBase.prototype.clearBattleRecord = function() {
        this._useSkillCounter  = [];
        this._useItemCounter   = [];
        this._killEnemyCounter = [];
        this.attackDamageMax   = 0;
        this.attackDamageSum   = 0;
        this.acceptDamageMax   = 0;
        this.acceptDamageSum   = 0;
        this.recoverDamageSum  = 0;
        this.deadCounter       = 0;
        this.payCostMpSum      = 0;
        this.payCostTpSum      = 0;
        this.getAllSkillUseCounter();
        this.getAllItemUseCounter();
        this.getAllKillEnemyCounter();
    };

    Game_BattlerBase.prototype.getBattlerId = function() {
        return this.isActor() ? this.actorId() : this.isEnemy() ? this.enemyId() : 0;
    };

    Game_BattlerBase.prototype.recordAttackDamage = function(value) {
        if (value >= 0) {
            this.attackDamageMax = Math.max((this.attackDamageMax || 0), value);
            this.attackDamageSum = (this.attackDamageSum || 0) + value;
        } else {
            this.recordRecoverDamage(-value);
        }
    };

    Game_BattlerBase.prototype.recordAcceptDamage = function(value) {
        if (value >= 0) {
            this.acceptDamageMax = Math.max((this.acceptDamageMax || 0), value);
            this.acceptDamageSum = (this.acceptDamageSum || 0) + value;
        }
    };

    Game_BattlerBase.prototype.recordRecoverDamage = function(value) {
        this.recoverDamageSum = (this.recoverDamageSum || 0) + value;
    };

    Game_BattlerBase.prototype.recordPayCostMpSum = function(value) {
        if (value >= 0) {
            this.payCostMpSum = (this.payCostMpSum || 0) + value;
        }
    };

    Game_BattlerBase.prototype.recordPayCostTpSum = function(value) {
        if (value >= 0) {
            this.payCostTpSum = (this.payCostTpSum || 0) + value;
        }
    };

    Game_BattlerBase.prototype.recordDead = function() {
        this.deadCounter = (this.deadCounter || 0) + 1;
    };

    Game_BattlerBase.prototype.recordSkillUseCounter = function(skillId) {
        var prevCount                  = this.getSkillUseCounter(skillId);
        this._useSkillCounter[skillId] = prevCount + 1;
    };

    Game_BattlerBase.prototype.recordItemUseCounter = function(itemId) {
        var prevCount                = this.getItemUseCounter(itemId);
        this._useItemCounter[itemId] = prevCount + 1;
    };

    Game_BattlerBase.prototype.recordKillEnemyCounter = function(enemyId) {
        var prevCount                   = this.getKillEnemyCounter(enemyId);
        this._killEnemyCounter[enemyId] = prevCount + 1;
    };

    Game_BattlerBase.prototype.getSkillUseCounter = function(skillId) {
        if (!this._useSkillCounter) this._useSkillCounter = [];
        return this._useSkillCounter[skillId] || 0;
    };

    Game_BattlerBase.prototype.getItemUseCounter = function(itemId) {
        if (!this._useItemCounter) this._useItemCounter = [];
        return this._useItemCounter[itemId] || 0;
    };

    Game_BattlerBase.prototype.getKillEnemyCounter = function(enemyId) {
        if (!this._killEnemyCounter) this._killEnemyCounter = [];
        return this._killEnemyCounter[enemyId] || 0;
    };

    Game_BattlerBase.prototype.getAllSkillUseCounter = function() {
        return this.getSumRecord(this._useSkillCounter);
    };

    Game_BattlerBase.prototype.getAllItemUseCounter = function() {
        return this.getSumRecord(this._useItemCounter);
    };

    Game_BattlerBase.prototype.getAllKillEnemyCounter = function() {
        return this.getSumRecord(this._killEnemyCounter);
    };

    Game_BattlerBase.prototype.getSumRecord = function(counterArray) {
        if (!counterArray) return 0;
        return counterArray.reduce(function(sumValue, value) {
            return sumValue + value;
        }, 0);
    };

    var _Game_BattlerBase_paySkillCost      = Game_BattlerBase.prototype.paySkillCost;
    Game_BattlerBase.prototype.paySkillCost = function(skill) {
        _Game_BattlerBase_paySkillCost.apply(this, arguments);
        this.recordPayCostMpSum(this.skillMpCost(skill));
        this.recordPayCostTpSum(this.skillTpCost(skill));
    };

    //=============================================================================
    // Game_Battler
    //  アイテムとスキルの使用回数を記録します。
    //=============================================================================
    var _Game_Battler_useItem      = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.apply(this, arguments);
        if (!$gameParty.inBattle()) return;
        if (DataManager.isSkill(item)) {
            this.recordSkillUseCounter(item.id);
        } else if (DataManager.isItem(item)) {
            this.recordItemUseCounter(item.id);
        }
    };

    //=============================================================================
    // Game_Actor
    //  装備変更時はカウンタを無効にします。
    //=============================================================================
    var _Game_Actor_tradeItemWithParty      = Game_Actor.prototype.tradeItemWithParty;
    Game_Actor.prototype.tradeItemWithParty = function(newItem, oldItem) {
        $gameParty.setTradingItemWithActor(true);
        var result = _Game_Actor_tradeItemWithParty.apply(this, arguments);
        $gameParty.setTradingItemWithActor(false);
        return result;
    };

    //=============================================================================
    // Game_Action
    //  戦績を記録します。
    //=============================================================================
    var _Game_Action_executeDamage      = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        _Game_Action_executeDamage.apply(this, arguments);
        this.subject().recordAttackDamage(value);
        target.recordAcceptDamage(value);
    };

    var _Game_Action_executeHpDamage      = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        _Game_Action_executeHpDamage.apply(this, arguments);
        if (target.hp === 0) {
            this.subject().recordKillEnemyCounter(target.getBattlerId());
            target.recordDead();
        }
    };

    //=============================================================================
    // Game_Actors
    //  全アクターの累計戦績を取得します。
    //=============================================================================
    Game_Actors.prototype.getSumRecord = function(propertyName, args) {
        return this._data.reduce(function(sumValue, actor) {
            return sumValue + this.getActorProperty(actor, propertyName, args);
        }.bind(this), 0);
    };

    Game_Actors.prototype.getActorProperty = function(actor, propertyName, args) {
        if (!actor) {
            return 0;
        } else if (args) {
            return actor[propertyName].apply(actor, args);
        } else {
            return actor[propertyName];
        }
    };

    Game_Actors.prototype.getSkillUseCounter = function(skillId) {
        return this.getSumRecord('getSkillUseCounter', [skillId]);
    };

    Game_Actors.prototype.getItemUseCounter = function(itemId) {
        return this.getSumRecord('getItemUseCounter', [itemId]);
    };

    Game_Actors.prototype.getKillEnemyCounter = function(enemyId) {
        return this.getSumRecord('getKillEnemyCounter', [enemyId]);
    };

    Game_Actors.prototype.getAllSkillUseCounter = function() {
        return this.getSumRecord('getAllSkillUseCounter', []);
    };

    Game_Actors.prototype.getAllItemUseCounter = function() {
        return this.getSumRecord('getAllItemUseCounter', []);
    };

    Game_Actors.prototype.getAllKillEnemyCounter = function() {
        return this.getSumRecord('getAllKillEnemyCounter', []);
    };

    Object.defineProperty(Game_Actors.prototype, 'attackDamageMax', {
        get: function() {
            return this.getSumRecord('attackDamageMax');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'attackDamageSum', {
        get: function() {
            return this.getSumRecord('attackDamageSum');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'acceptDamageMax', {
        get: function() {
            return this.getSumRecord('acceptDamageMax');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'acceptDamageSum', {
        get: function() {
            return this.getSumRecord('acceptDamageSum');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'recoverDamageSum', {
        get: function() {
            return this.getSumRecord('recoverDamageSum');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'payCostMpSum', {
        get: function() {
            return this.getSumRecord('payCostMpSum');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'payCostTpSum', {
        get: function() {
            return this.getSumRecord('payCostTpSum');
        }
    });

    Object.defineProperty(Game_Actors.prototype, 'deadCounter', {
        get: function() {
            return this.getSumRecord('deadCounter');
        }
    });

    //=============================================================================
    // Game_Party
    //  アイテムとお金の増減情報を記録します。
    //=============================================================================
    var _Game_Party_initialize      = Game_Party.prototype.initialize;
    Game_Party.prototype.initialize = function() {
        _Game_Party_initialize.apply(this, arguments);
        this.clearRecord();
        this._tradingItemWithActor = false;
    };

    Game_Party.prototype.setTradingItemWithActor = function(value) {
        this._tradingItemWithActor = value;
    };

    Game_Party.prototype.clearRecord = function() {
        this.gainGoldSum    = 0;
        this.loseGoldSum    = 0;
        this._gainItemSum   = [];
        this._gainWeaponSum = [];
        this._gainArmorSum  = [];
    };

    Game_Party.prototype.getItemTypeName = function(item) {
        var itemTypeName;
        if (DataManager.isItem(item)) {
            itemTypeName = 'item';
        } else if (DataManager.isWeapon(item)) {
            itemTypeName = 'weapon';
        } else if (DataManager.isArmor(item)) {
            itemTypeName = 'armor';
        }
        return itemTypeName;
    };

    Game_Party.prototype.getTradeRecord = function(itemTypeName, tradeTypeName) {
        return this.getTradeRecordInstance(itemTypeName + tradeTypeName + 'Record');
    };

    Game_Party.prototype.getTradeRecordInstance = function(fieldName) {
        this[fieldName] = this[fieldName] || new Game_TradeRecord();
        return this[fieldName];
    };

    Game_Party.prototype.recordGainGold = function(amount) {
        this.gainGoldSum = (this.gainGoldSum || 0) + amount;
    };

    Game_Party.prototype.recordLoseGold = function(amount) {
        this.loseGoldSum = (this.loseGoldSum || 0) + amount;
    };

    Game_Party.prototype.recordGainItemSum = function(itemId, amount) {
        var prevAmount            = this.getGainItemSum(itemId);
        this._gainItemSum[itemId] = prevAmount + amount;
    };

    Game_Party.prototype.getGainItemSum = function(itemId) {
        if (!this._gainItemSum) this._gainItemSum = [];
        return this._gainItemSum[itemId] || 0;
    };

    Game_Party.prototype.recordGainWeaponSum = function(weaponId, amount) {
        var prevAmount                = this.getGainWeaponSum(weaponId);
        this._gainWeaponSum[weaponId] = prevAmount + amount;
    };

    Game_Party.prototype.getGainWeaponSum = function(weaponId) {
        if (!this._gainWeaponSum) this._gainWeaponSum = [];
        return this._gainWeaponSum[weaponId] || 0;
    };

    Game_Party.prototype.recordGainArmorSum = function(armorId, amount) {
        var prevAmount              = this.getGainArmorSum(armorId);
        this._gainArmorSum[armorId] = prevAmount + amount;
    };

    Game_Party.prototype.getGainArmorSum = function(armorId) {
        if (!this._gainArmorSum) this._gainArmorSum = [];
        return this._gainArmorSum[armorId] || 0;
    };

    var _Game_Party_gainGold      = Game_Party.prototype.gainGold;
    Game_Party.prototype.gainGold = function(amount) {
        var prevGold = this._gold;
        _Game_Party_gainGold.apply(this, arguments);
        var deltaGold = this._gold - prevGold;
        if (deltaGold >= 0) {
            this.recordGainGold(deltaGold);
        } else {
            this.recordLoseGold(-deltaGold);
        }
    };

    var _Game_Party_gainItem      = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        _Game_Party_gainItem.apply(this, arguments);
        if (amount < 0 || this._tradingItemWithActor) return;
        if (DataManager.isItem(item)) {
            this.recordGainItemSum(item.id, amount);
        } else if (DataManager.isWeapon(item)) {
            this.recordGainWeaponSum(item.id, amount);
        } else if (DataManager.isArmor(item)) {
            this.recordGainArmorSum(item.id, amount);
        }
    };

    Game_Party.prototype.addTradeRecord = function(item, amount, gold, tradeType) {
        var record = this.getTradeRecord(this.getItemTypeName(item), tradeType);
        record.trade(item.id, amount, gold);
    };

    Game_Party.prototype.getItemBuyingRecord = function() {
        return this.getTradeRecord('item', 'Buy');
    };

    Game_Party.prototype.getItemSellingRecord = function() {
        return this.getTradeRecord('item', 'Sell');
    };

    Game_Party.prototype.getWeaponBuyingRecord = function() {
        return this.getTradeRecord('weapon', 'Buy');
    };

    Game_Party.prototype.getWeaponSellingRecord = function() {
        return this.getTradeRecord('weapon', 'Sell');
    };

    Game_Party.prototype.getArmorBuyingRecord = function() {
        return this.getTradeRecord('armor', 'Buy');
    };

    Game_Party.prototype.getArmorSellingRecord = function() {
        return this.getTradeRecord('armor', 'Sell');
    };

    //=============================================================================
    // Game_TradeRecord
    //  ショップでの売買履歴を保持するクラスです。
    //=============================================================================
    Game_TradeRecord.prototype.constructor = Game_TradeRecord;

    Game_TradeRecord.prototype.initialize = function() {
        this._itemUseGold = [];
        this._itemAmount  = [];
        this._tradeCount  = 0;
    };

    Game_TradeRecord.prototype.trade = function(itemId, amount, useGold) {
        this._itemUseGold[itemId] = (this._itemUseGold[itemId] || 0) + useGold;
        this._itemAmount[itemId]  = (this._itemAmount[itemId] || 0) + amount;
        this._tradeCount++;
    };

    Game_TradeRecord.prototype.getUseGoldSum = function(startId, endId) {
        return this.getSumRecord(this._itemUseGold, startId, endId);
    };

    Game_TradeRecord.prototype.getAmountSum = function(startId, endId) {
        return this.getSumRecord(this._itemAmount, startId, endId);
    };

    Game_TradeRecord.prototype.getTradeCount = function() {
        return this._tradeCount;
    };

    Game_TradeRecord.prototype.getSumRecord = function(counterArray, startIndex, endIndex) {
        if (startIndex && !endIndex) {
            endIndex = startIndex;
        }
        if (!startIndex && !endIndex) {
            startIndex = 1;
            endIndex = counterArray.length - 1;
        }
        return counterArray.slice(startIndex, endIndex + 1).reduce(function(sumValue, value) {
            return sumValue + value;
        }, 0);
    };

    //=============================================================================
    // Scene_Shop
    //  ショップでの売買履歴を保持します。
    //=============================================================================
    var _Scene_Shop_doBuy = Scene_Shop.prototype.doBuy;
    Scene_Shop.prototype.doBuy = function(number) {
        _Scene_Shop_doBuy.apply(this, arguments);
        $gameParty.addTradeRecord(this._item, number, number * this.buyingPrice(), 'Buy');
    };

    var _Scene_Shop_doSell = Scene_Shop.prototype.doSell;
    Scene_Shop.prototype.doSell = function(number) {
        _Scene_Shop_doSell.apply(this, arguments);
        $gameParty.addTradeRecord(this._item, number, number * this.sellingPrice(), 'Sell');
    };
})();

