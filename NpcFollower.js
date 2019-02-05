//=============================================================================
// NpcFollower.js
// ----------------------------------------------------------------------------
// (C) 2016 Triacontane
// Translator : ReIris
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.1.0 2019/01/27 通常のフォロワーを表示せず、NPCフォロワーのみを表示できる機能を追加
// 1.0.3 2018/08/06 コアスクリプトが1.6.0より古い場合にエラーになる記述を修正
// 1.0.2 2017/01/17 プラグインコマンドが小文字でも動作するよう修正（byこまちゃん先輩）
// 1.0.1 2016/07/17 セーブデータをロードした際のエラーになる現象の修正
// 1.0.0 2016/07/14 初版
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc NPC跟隨插件
 * @author トリアコンタン
 *
 * @param MaxNpcNumber
 * @desc 隊伍裡同時存在NPC的最大數。
 * @default 1
 *
 * @param HideNormalFollower
 * @desc 不管隊伍跟隨的顯示設置，只會顯示NPC跟隨，不顯示跟隨隊友。
 * @default false
 * @type boolean
 *
 * @help 在地圖上的隊伍除了隊友以外中追加顯示跟隨NPC。
 * NPC由資料庫上的角色定義，並使用插件命令中添加和刪除。
 * 由於它不是戰鬥人員，不會影響選單與戰鬥畫面。
 * 此外，如果沒有顯示在隊伍中，則不顯示任何內容。
 *
 * 可以添加複數具有相同角色ID的NPC。
 *
 * 插件命令
 *  從事件命令中「插件命令」執行。
 *  （參數指定使用半形空格區分）
 *
 * NF_ADD_NPC 5 3 # 添加角色ID[5]的NPC於隊伍[3]的地方
 * NF_REM_NPC 3   # 隊伍[3]後面追加的NPC全部移除
 *
 * 對於添加NPC的索引位置，
 * 請指定隊伍順序（1 ...戰鬥成員數）。
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */

(function() {
    'use strict';
    var pluginName    = 'NpcFollower';
    var metaTagPrefix = 'NF';

    var getCommandName = function(command) {
        return (command || '').toUpperCase();
    };

    var getParamOther = function(paramNames) {
        if (!Array.isArray(paramNames)) paramNames = [paramNames];
        for (var i = 0; i < paramNames.length; i++) {
            var name = PluginManager.parameters(pluginName)[paramNames[i]];
            if (name) return name;
        }
        return null;
    };

    var getParamBoolean = function(paramNames) {
        var value = getParamOther(paramNames);
        return (value || '').toUpperCase() === 'TRUE';
    };

    var getParamNumber = function(paramNames, min, max) {
        var value = getParamOther(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(value, 10) || 0).clamp(min, max);
    };

    var getArgNumberWithEval = function(arg, min, max) {
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(eval(convertEscapeCharacters(arg)), 10) || 0).clamp(min, max);
    };

    var convertEscapeCharacters = function(text) {
        if (text == null) text = '';
        var windowLayer = SceneManager._scene._windowLayer;
        return windowLayer ? windowLayer.children[0].convertEscapeCharacters(text) : text;
    };

    //=============================================================================
    // パラメータの取得と整形
    //=============================================================================
    var paramMaxNpcNumber       = getParamNumber(['MaxNpcNumber', '最大同時NPC数']);
    var paramHideNormalFollower = getParamBoolean(['HideNormalFollower', '通常フォロワーを表示しない']);

    //=============================================================================
    // Game_Interpreter
    //  プラグインコマンドを追加定義します。
    //=============================================================================
    var _Game_Interpreter_pluginCommand      = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        if (!command.match(new RegExp('^' + metaTagPrefix, 'i'))) return;
        this.pluginCommandNpcFollower(command.replace(new RegExp(metaTagPrefix, 'i'), ''), args);
    };

    Game_Interpreter.prototype.pluginCommandNpcFollower = function(command, args) {
        switch (getCommandName(command)) {
            case '_NPC追加' :
            case '_ADD_NPC' :
                var actorId = getArgNumberWithEval(args[0]);
                $gameParty.addNpc(actorId, getArgNumberWithEval(args[1], 1));
                break;
            case '_NPC削除' :
            case '_REM_NPC' :
                $gameParty.removeNpc(getArgNumberWithEval(args[0], 1));
                break;
        }
    };

    //=============================================================================
    // Game_Party
    //  NPCの追加と削除を追加定義します。
    //=============================================================================
    var _Game_Party_initialize      = Game_Party.prototype.initialize;
    Game_Party.prototype.initialize = function() {
        _Game_Party_initialize.apply(this, arguments);
        this.initNpc();
    };

    Game_Party.prototype.initNpc = function() {
        this._npcs       = [];
        this._npcIndexes = [];
    };

    Game_Party.prototype.isNpcInvalid = function() {
        return !this._npcs;
    };

    Game_Party.prototype.initNpcIfNeed = function() {
        if (this.isNpcInvalid()) {
            this.initNpc();
            $gamePlayer.followers().initNpc();
        }
    };

    Game_Party.prototype.addNpc = function(actorId, index) {
        if (this._npcs.length < paramMaxNpcNumber) {
            this._npcs.push(actorId);
            this._npcIndexes.push(index);
            $gamePlayer.refresh();
            $gameMap.requestRefresh();
        } else {
            throw new Error('登録可能な最大数を超えています。');
        }
    };

    Game_Party.prototype.removeNpc = function(index) {
        for (var i = 0, n = this._npcs.length; i < n; i++) {
            if (this._npcIndexes[i] === index) {
                this._npcs.splice(i, 1);
                this._npcIndexes.splice(i, 1);
                i--;
            }
        }
        $gamePlayer.refresh();
        $gameMap.requestRefresh();
    };

    Game_Party.prototype.npcMembers = function() {
        return this._npcs.map(function(id) {
            return $gameActors.actor(id);
        });
    };

    Game_Party.prototype.visibleMembers = function() {
        return this._visibleMembers;
    };

    Game_Party.prototype.makeVisibleMembers = function() {
        var battleMembers  = this.battleMembers();
        var npcMembers     = this.npcMembers();
        var visibleMembers = [];
        for (var i = 0, n = this.maxBattleMembers() + 1; i < n; i++) {
            for (var j = 0, m = npcMembers.length; j < m; j++) {
                if (this._npcIndexes[j] === i) visibleMembers.push(npcMembers[j]);
            }
            if (battleMembers.length > i) visibleMembers.push(battleMembers[i]);
        }
        this._visibleMembers = visibleMembers;
    };

    //=============================================================================
    // Game_Followers
    //  NPCの最大数ぶんだけ余分にGame_Followerを作成します。
    //=============================================================================
    var _Game_Followers_initialize      = Game_Followers.prototype.initialize;
    Game_Followers.prototype.initialize = function() {
        _Game_Followers_initialize.apply(this, arguments);
        if (paramHideNormalFollower) {
            this._data = [];
        }
        this.initNpc();
    };

    Game_Followers.prototype.initNpc = function() {
        var memberLength = $gameParty.maxBattleMembers();
        for (var i = 0; i < paramMaxNpcNumber; i++) {
            this._data.push(new Game_Follower(memberLength + i));
        }
    };

    //=============================================================================
    // Game_Follower
    //  NPC判定を追加定義します。
    //=============================================================================
    var _Game_Follower_actor      = Game_Follower.prototype.actor;
    Game_Follower.prototype.actor = function() {
        _Game_Follower_actor.apply(this, arguments);
        return $gameParty.visibleMembers()[this._memberIndex];
    };

    //=============================================================================
    // Game_Player
    //  リフレッシュまえに表示メンバーを更新します。
    //=============================================================================
    var _Game_Player_refresh      = Game_Player.prototype.refresh;
    Game_Player.prototype.refresh = function() {
        $gameParty.makeVisibleMembers();
        _Game_Player_refresh.apply(this, arguments);
    };

    //=============================================================================
    // DataManager
    //  プラグイン未適用のデータをロードした場合に必要なデータを初期化します。
    //=============================================================================
    var _DataManager_loadGame = DataManager.loadGame;
    DataManager.loadGame      = function(saveFileId) {
        var result = _DataManager_loadGame.apply(this, arguments);
        $gameParty.initNpcIfNeed();
        return result;
    };
})();

