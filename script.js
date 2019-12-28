// 最后修改: bin 2019年12月22日
if (game) {
  const args = {
    setcharacter: null,
    setskin: null,
    commonViewList: null
  };
  // const view = game.EView;
  class WQDY {
    constructor() {
      this.readSetting();
      this._init();
    }
    get args() {
      // return {
      //   char_id: cfg.item_definition.skin.map_[GameMgr.Inst.account_data.avatar_id].character_id,
      //   avatar_id: GameMgr.Inst.account_data.avatar_id,
      //   commonViewList: uiscript.UI_Sushe.commonViewList
      // };
      return args;
    }
    readSetting() {
      args.setcharacter = Number(localStorage.getItem("char_id"));
      args.setskin = Number(localStorage.getItem("avatar_id"));
      args.commonViewList = JSON.parse(localStorage.getItem("commonViewList")) || [];
      console.log("wqdy配置读取成功")
    }
    writeSetting() {
      let char_id = cfg.item_definition.skin.map_[GameMgr.Inst.account_data.avatar_id].character_id;
      localStorage.setItem("char_id", char_id);
      localStorage.setItem("avatar_id", GameMgr.Inst.account_data.avatar_id);
      localStorage.setItem("commonViewList", JSON.stringify(uiscript.UI_Sushe.commonViewList));
      console.log("wqdy配置保存成功")
    }
    _init() {
      // 修改牌桌上角色(改皮肤)
      const _AuthSuccess = game.MJNetMgr.prototype._AuthSuccess;
      game.MJNetMgr.prototype._AuthSuccess = function (e, i, n) {
        e.forEach(v => {
          if (v.account_id === GameMgr.Inst.account_id) {
            v.character = uiscript.UI_Sushe.characters[uiscript.UI_Sushe.main_character_id - 200001];
            v.avatar_id = v.character.skin;
          }
        })
        return _AuthSuccess.call(this, e, i, n)
      }
      // 本地解锁背包(覆盖)
      uiscript.UI_Bag.fetch = function () {
        this._item_map = {};
        var items = cfg.item_definition.item.map_;
        for (var id in items) {
          this._item_map[id] = {
            item_id: id,
            count: 1,
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
      // 本地解锁宿舍(覆盖)
      uiscript.UI_Sushe.init = function (e) {

        let i = this;
        // console.group("wqdy读取表");
        console.log("wqdy读取表", args);
        // console.groupEnd();
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
        if (cfg.item_definition.skin.map_[args.setskin]) {
          GameMgr.Inst.account_data.avatar_id = args.setskin;
        }
        app.NetAgent.sendReq2Lobby("Lobby", "fetchCharacterInfo", {}, (n, a) => {
          if (n || a.error)
            uiscript.UIMgr.Inst.showNetReqError("fetchCharacterInfo", n, a);
          else {
            app.Log.log("fetchCharacterInfo: " + JSON.stringify(a));
            i.send_gift_count = a.send_gift_count;
            i.send_gift_limit = a.send_gift_limit;
            // console.group("原有角色");
            console.log("原有角色", a);
            // console.groupEnd();
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
            e.run();
          }
        })
        app.NetAgent.sendReq2Lobby("Lobby", "fetchAllCommonViews", {}, (e, n) => {
          i.using_commonview_index = n.use;
          console.log("原有装扮", n.views);
          i.commonViewList = args.commonViewList;
          GameMgr.Inst.load_mjp_view()
        })
      }
      // 人物数据更新
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
      // const onClickAtHead = uiscript.UI_Sushe_Select.prototype.onClickAtHead;
      // uiscript.UI_Sushe_Select.prototype.onClickAtHead = function (e) {
      //   return onClickAtHead.call(this, e)
      // }
      // 刷新当前皮肤,保存配置
      const refreshInfo = uiscript.UI_Lobby.prototype.refreshInfo;
      uiscript.UI_Lobby.prototype.refreshInfo = function () {
        window.wqdy.writeSetting();
        return refreshInfo.call(this)
      }
      // 皮肤全开
      uiscript.UI_Sushe.skin_owned = t => 1;
      // 友人房(更改皮肤)
      const updateData = uiscript.UI_WaitingRoom.prototype.updateData
      uiscript.UI_WaitingRoom.prototype.updateData = function (t) {
        let a = t.persons.find(v => (v["account_id"] === GameMgr.Inst.account_id));
        if (a) a["avatar_id"] = GameMgr.Inst.account_data.avatar_id;
        return updateData.call(this, t)
      };
      // 不管怎样,在本地显示发送的表情;如果表情通过网络验证时,表情会被显示两次(仅在网络连接极差时);
      (() => {
        const sendReq2MJ = app.NetAgent.sendReq2MJ
        app.NetAgent.sendReq2MJ = function (a, b, c, d) {
          if (a === "FastTest" && b === "broadcastInGame") {
            let i = JSON.parse(c.content);
            console.log("发送表情", i.emo);
            if (i.emo > 9) uiscript.UI_DesktopInfo.Inst.onShowEmo(0, i.emo);
          }
          return sendReq2MJ.call(this, a, b, c, d);
        }
      })();
      (() => {
        const show = uiscript.zhuangban.Container_Zhuangban.prototype.show;
        uiscript.zhuangban.Container_Zhuangban.prototype.show = function () {
          this.btn_save.clickHandler = new Laya.Handler(this, () => {
            let e = [];
            let t = uiscript.UI_Sushe;
            for (let i = 0; i < this.cell_titles.length; i++) {
              if (this.slot_map[i]) {
                var n = this.slot_map[i];
                if (!n || n == this.cell_default_item[i])
                  continue;
                e.push({
                  slot: i,
                  item_id: n
                })
              }
            }
            this.btn_save.mouseEnabled = !1;
            var a = this.tab_index;
            if (t.commonViewList.length < a) {
              for (var s = t.commonViewList.length; s <= a; s++)
                t.commonViewList.push([]);
            }
            t.commonViewList[a] = e;
            t.using_commonview_index == a && this.onChangeGameView();
            if (this.tab_index != a) return;
            this.btn_save.mouseEnabled = !0;
            this._changed = !1;
            this.refresh_btn()
          });
          show.call(this)
        }
      })();
    }
  }

  if (!window.wqdy) {
    window.wqdy = new WQDY();
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