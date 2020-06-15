if (game) {
    const args = {};
    const view = game.EPlayerView;
    class WQDY {
        constructor() {
            this.readSetting();
            this._init();
        }
        get args() {
            return {
                char_id: cfg.item_definition.skin.map_[GameMgr.Inst.account_data.avatar_id].character_id,
                avatar_id: GameMgr.Inst.account_data.avatar_id,
                title: GameMgr.Inst.account_data.title,
                views: uiscript.UI_Sushe.commonViewList,
                view_index: uiscript.UI_Sushe.using_commonview_index
            };
        }
        readSetting() {
            args.setcharacter = Number(localStorage.getItem("char_id"));
            args.setskin = Number(localStorage.getItem("avatar_id"));
            args.title = Number(localStorage.getItem("title"));
			if (localStorage.getItem("views") && localStorage.getItem("views") != "[]"){
				try{
					args.views = JSON.parse(localStorage.getItem("views"));
					if (args.views[0].slot != undefined){
						args.views[0] = args.views.concat();
						args.views = args.views.slice(0,1);
					}
				}
				catch (e){
					console.log("Failed to load Views,Error Message: " + e);
				}
			}
            args.view_index = Number(localStorage.getItem("view_index"));
        }
        writeSetting() {
            let char_id = cfg.item_definition.skin.map_[GameMgr.Inst.account_data.avatar_id].character_id;
            let char = uiscript.UI_Sushe.main_character_id;
            localStorage.setItem("char_id", char_id);
            localStorage.setItem("avatar_id", GameMgr.Inst.account_data.avatar_id);
            localStorage.setItem("title", GameMgr.Inst.account_data.title);
            localStorage.setItem("views", JSON.stringify(uiscript.UI_Sushe.commonViewList));
            localStorage.setItem("view_index", uiscript.UI_Sushe.using_commonview_index);
            console.log("wqdy角色配置保存成功")
        }
        _init() {
            //修改牌桌上角色(改皮肤)
            const _AuthSuccess = game.MJNetMgr.prototype._AuthSuccess;
            game.MJNetMgr.prototype._AuthSuccess = function (e, i, n) {
                e.forEach(v => {
                    if (v.account_id === GameMgr.Inst.account_id) {
                        v.title = GameMgr.Inst.account_data.title;
                        v.character.charid = uiscript.UI_Sushe.main_character_id;
                        v.character.skin = GameMgr.Inst.account_data.avatar_id;
                        v.character.level = 5;
                        v.character.is_upgraded = true;
						v.character.views = [];
						v.views = [];
						console.log(v);
						let CurrentViewList = uiscript.UI_Sushe.commonViewList[0] && uiscript.UI_Sushe.commonViewList[0].slot != undefined ? uiscript.UI_Sushe.commonViewList : uiscript.UI_Sushe.commonViewList[uiscript.UI_Sushe.using_commonview_index];
						console.log(CurrentViewList);
						if (CurrentViewList){
							v.views = CurrentViewList;
							CurrentViewList.forEach(w => {
								if (w.slot < 5) {
									v.character.views.push({
										slot: w.slot + 1,
										item_id: w.item_id
									});
								}
								else return;
							})
						}
                        v.avatar_id = GameMgr.Inst.account_data.avatar_id;
                    }
                })
                return _AuthSuccess.call(this, e, i, n)
            }
            //本地解锁背包(覆盖)
            uiscript.UI_Bag.fetch = function () {
                this._item_map = {};
                var items = cfg.item_definition.item.map_;
                for (var id in items) {
                    this._item_map[id] = {
                        item_id: id,
                        count: 99,
                        category: items[id].category
                    }
                }
                app.NetAgent.sendReq2Lobby("Lobby", "fetchBagInfo", {}, (i, n) => {
                    if (i || n.error)
                        uiscript.UIMgr.Inst.showNetReqError("fetchBagInfo", i, n);
                    else {
                        app.Log.log("背包信息：" + JSON.stringify(n));
                        n.bag.items.forEach(item => uiscript.UI_Bag._item_map[item.item_id].count = item.stack)
                    }
                })
            }
            //本地解锁称号(覆盖)
            uiscript.UI_TitleBook.Init = function () {
                var e = this;
                var n = cfg.item_definition.title.map_;
                for (var a = cfg.item_definition.title.minKey_; a <= cfg.item_definition.title.maxKey_; a++) {
                    e.owned_title.push(a)
                }
            }
            uiscript.UI_TitleBook.prototype.changeTitle = function (e) {
                var n = this,
                a = GameMgr.Inst.account_data.title,
                r = 0;
                r = e >= 0 && e < this._showindexs.length ? uiscript.UI_TitleBook.owned_title[this._showindexs[e]] : 600001,
                GameMgr.Inst.account_data.title = r;
                for (var s = -1, o = 0; o < this._showindexs.length; o++)
                    if (a == uiscript.UI_TitleBook.owned_title[this._showindexs[o]]) {
                        s = o;
                        break
                    }
                uiscript.UI_Lobby.Inst.enable && uiscript.UI_Lobby.Inst.top.refresh(),
                uiscript.UI_PlayerInfo.Inst.enable && uiscript.UI_PlayerInfo.Inst.refreshBaseInfo(),
                -1 != s && this._scrollview.wantToRefreshItem(s)
            }
            //本地解锁宿舍(覆盖)
            uiscript.UI_Sushe.init = function (e) {
                let i = this;
                console.group("wqdy读取表");
                console.log(args);
                console.groupEnd();
                // 用于强制解锁语音
                cfg.voice.sound.rows_.forEach(soundObject => soundObject.level_limit = 0)
                i.characters = cfg.item_definition.character.rows_.map(v => {
                    return {
                        charid: v.id,
                        level: 5,
                        exp: 0,
                        views: [],
                        skin: v.init_skin,
                        is_upgraded: true,
                        extra_emoji: cfg.character.emoji.groups_[v.id].map(v => v.sub_id)
                    }
                });
                i.main_character_id = cfg.item_definition.character.map_[args.setcharacter] ? args.setcharacter : 200001;
                i.main_chara_info.charaid = cfg.item_definition.character.map_[args.setcharacter] ? args.setcharacter : 200001;
                if (cfg.item_definition.skin.map_[args.setskin]) {
                    GameMgr.Inst.account_data.avatar_id = args.setskin;
                    i.main_chara_info.skin = args.setskin;
                }
                GameMgr.Inst.account_data.title = args.title;
                app.NetAgent.sendReq2Lobby("Lobby", "fetchCharacterInfo", {}, (n, a) => {
                    if (n || a.error)
                        uiscript.UIMgr.Inst.showNetReqError("fetchCharacterInfo", n, a);
                    else {
                        app.Log.log("fetchCharacterInfo: " + JSON.stringify(a));
                        i.send_gift_count = a.send_gift_count;
                        i.send_gift_limit = a.send_gift_limit;
                        console.group("原有角色");
                        console.log(a);
                        console.groupEnd();
                        a = a.characters;
                        uiscript.UI_Sushe.characters.forEach(c => {
                            if (a.length > 0) {
                                if (c["charid"] === a[0]["charid"]) {
                                    c["exp"] = a[0]["exp"];
                                    c["level"] = a[0]["level"];
                                    c["is_upgraded"] = a[0]["is_upgraded"];
                                    a.shift();
                                }
                            }
                        })
                    }
                })
                if (!args.views || args.view_index === undefined) {
                    app.NetAgent.sendReq2Lobby("Lobby", "fetchAllCommonViews", {}, function (e, n) {
                        if (e || n.error)
                            t.UIMgr.Inst.showNetReqError("fetchAllCommonViews", e, n);
                        else {
                            i.using_commonview_index = n.use,
                            i.commonViewList = [];
                            var a = n.views;
                            if (a)
                                for (var r = 0; r < a.length; r++) {
                                    var s = a[r].values;
                                    s && i.commonViewList.push(s)
                                }
                        }
                    })
                } else {
                    uiscript.UI_Sushe.commonViewList = args.views;
                    uiscript.UI_Sushe.using_commonview_index = args.view_index;
                }
                GameMgr.Inst.load_mjp_view();
                e.run();
            }

            const on_data_updata = uiscript.UI_Sushe.on_data_updata;
            uiscript.UI_Sushe.on_data_updata = function (e) {
                if (e.character) {
                    let a = e.character.characters,
                    b = [];
                    uiscript.UI_Sushe.characters.forEach(c => {
                        if (a.length > 0) {
                            if (c["charid"] === a[0]["charid"]) {
                                c["exp"] = a[0]["exp"];
                                c["level"] = a[0]["level"];
                                c["is_upgraded"] = a[0]["is_upgraded"];
                                a.shift();
                                b.push(c);
                            }
                            console.log("人物数据更新", c);
                        }
                    })
                    e.character.characters = b;
                }
                return on_data_updata.call(this, e);
            }

            //解决当前皮肤问题(宿舍更换皮肤)
            const onClickAtHead = uiscript.UI_Sushe_Select.prototype.onClickAtHead;
            uiscript.UI_Sushe_Select.prototype.onClickAtHead = function (e) {
                if (this.select_index == e) {
                    uiscript.UI_Sushe.main_character_id = uiscript.UI_Sushe.characters[e].charid,
                    GameMgr.Inst.account_data.avatar_id = uiscript.UI_Sushe.characters[e].skin;
                }
                return onClickAtHead.call(this, e)
            }
            //刷新当前皮肤(防止刷新皮肤)(新版本不需要锁定皮肤)
            const refreshInfo = uiscript.UI_Lobby.prototype.refreshInfo;
            uiscript.UI_Lobby.prototype.refreshInfo = function () {
                if (uiscript.UI_Sushe.main_chara_info)
                    GameMgr.Inst.account_data.avatar_id = uiscript.UI_Sushe.main_chara_info.skin;
                window.wqdy.writeSetting();
                return refreshInfo.call(this)
            }
            //皮肤全开
            uiscript.UI_Sushe.skin_owned = t => 1;
            //友人房(更改皮肤)
            const updateData = uiscript.UI_WaitingRoom.prototype.updateData
                uiscript.UI_WaitingRoom.prototype.updateData = function (t) {
                t.persons.forEach(v => {
                    if (v["account_id"] === GameMgr.Inst.account_id) {
                        v["avatar_id"] = GameMgr.Inst.account_data.avatar_id
                            v["title"] = GameMgr.Inst.account_data.title
                    }
                })
                return updateData.call(this, t)
            }
            //解决更换装扮问题（覆盖）
            const Container_Zhuangban = function () {};
            for (let i in uiscript.zhuangban.Container_Zhuangban.prototype) {
                if (typeof uiscript.zhuangban.Container_Zhuangban.prototype[i] == "function")
                    Container_Zhuangban.prototype[i] = uiscript.zhuangban.Container_Zhuangban.prototype[i];
            }
            uiscript.zhuangban.Container_Zhuangban = function (i, n, a) {
                var r = this;
                this.page_items = null,
                this.page_headframe = null,
                this.page_desktop = null,
                this.page_bgm = null,
                this.tabs = [],
                this.tab_index = -1,
                this.select_index = -1,
                this.cell_titles = [2193, 2194, 2195, 1901, 2214, 2624, 2856, 2412, 2413, 2826],
                this.cell_names = [411, 412, 413, 417, 414, 415, 416, 0, 0, 0],
                this.cell_default_img = ["myres/sushe/slot_liqibang.jpg", "myres/sushe/slot_hule.jpg", "myres/sushe/slot_liqi.jpg", "myres/sushe/slot_mpzs.jpg", "myres/sushe/slot_hand.jpg", "myres/sushe/slot_liqibgm.jpg", "myres/sushe/slot_head_frame.jpg", "", "", ""],
                this.cell_default_item = [0, 0, 0, 0, 0, 0, 305501, 305044, 305045, 307001],
                this.slot_ids = [0, 1, 2, 10, 3, 4, 5, 6, 7, 8],
                this.slot_map = {},
                this._changed = !1,
                this._locking = null,
                this._locking = a,
                this.container_zhuangban0 = i,
                this.container_zhuangban1 = n;
                for (var s = this.container_zhuangban0.getChildByName("tabs"), o = function (e) {
                    var i = s.getChildAt(e);
                    l.tabs.push(i),
                    i.clickHandler = new Laya.Handler(l, function () {
                        r.locking || r.tab_index != e && (r._changed ? t.UI_SecondConfirm.Inst.show(game.Tools.strOfLocalization(3022), Laya.Handler.create(r, function () {
                                    r.change_tab(e)
                                }), null) : r.change_tab(e))
                    })
                }, l = this, h = 0; h < s.numChildren; h++)
                    o(h);
                this.page_items = new uiscript.zhuangban.Page_Items(this.container_zhuangban1.getChildByName("page_items")),
                this.page_headframe = new uiscript.zhuangban.Page_Headframe(this.container_zhuangban1.getChildByName("page_headframe")),
                this.page_bgm = new uiscript.zhuangban.Page_Bgm(this.container_zhuangban1.getChildByName("page_bgm")),
                this.page_desktop = new uiscript.zhuangban.Page_Desktop(this.container_zhuangban1.getChildByName("page_zhuobu")),
                this.scrollview = this.container_zhuangban1.getChildByName("page_slots").scriptMap["capsui.CScrollView"],
                this.scrollview.init_scrollview(new Laya.Handler(this, this.render_view)),
                this.btn_using = this.container_zhuangban1.getChildByName("page_slots").getChildByName("btn_using"),
                this.btn_save = this.container_zhuangban1.getChildByName("page_slots").getChildByName("btn_save"),
                this.btn_save.clickHandler = new Laya.Handler(this, function () {
                    for (var e = [], i = 0; i < r.cell_titles.length; i++) {
                        var n = r.slot_ids[i];
                        if (r.slot_map[n]) {
                            var a = r.slot_map[n];
                            if (!a || a == r.cell_default_item[i])
                                continue;
                            e.push({
                                slot: n,
                                item_id: a
                            })
                        }
                    }
                    r.btn_save.mouseEnabled = !1;
                    var s = r.tab_index;
                    if (uiscript.UI_Sushe.commonViewList.length < s)
                        for (var a = uiscript.UI_Sushe.commonViewList.length; a <= s; a++)
                            uiscript.UI_Sushe.commonViewList.push([]);
                    if (uiscript.UI_Sushe.commonViewList[s] = e, uiscript.UI_Sushe.using_commonview_index == s && r.onChangeGameView(), r.tab_index != s)
                        return;
                    r.btn_save.mouseEnabled = !0,
                    r._changed = !1,
                    r.refresh_btn()
                }),
                this.btn_use = this.container_zhuangban1.getChildByName("page_slots").getChildByName("btn_use"),
                this.btn_use.clickHandler = new Laya.Handler(this, function () {
                    r.btn_use.mouseEnabled = !1;
                    var e = r.tab_index;
                    uiscript.UI_Sushe.using_commonview_index = e, 
					r.refresh_btn(), 
					r.refresh_tab(), 
					r.onChangeGameView()
                })
            }
            uiscript.zhuangban.Container_Zhuangban.prototype = Container_Zhuangban.prototype;

            //不管怎样,在本地显示发送的表情;如果表情通过网络验证时,表情会被显示两次(仅在网络连接极差时)
            const sendReq2MJ = app.NetAgent.sendReq2MJ
                app.NetAgent.sendReq2MJ = function (a, b, c, d) {
                if (a === "FastTest" && b === "broadcastInGame") {
                    let i = JSON.parse(c.content);
                    console.log("发送表情", i.emo);
                    if (i.emo > 9)
                        uiscript.UI_DesktopInfo.Inst.onShowEmo(0, i.emo);
                }
                return sendReq2MJ.call(this, a, b, c, d);
            }
        }
    }

    if (!window.wqdy) {
        window.wqdy = new WQDY();
        window.wqdy.readSetting();
        Majsoul_Plus["wqdy"] = {
            name: "我全都要",
            actions: {
                "手动保存配置": () => window.wqdy.writeSetting()
            }
        }
        console.log("我全都要 加载完毕");
    } else {
        console.warn("")
    }
}
