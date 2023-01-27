/***************************************** 
@Name           京东签到脚本
@Date           2023.01.08
@Author         wanghao
@OriginalAuthor NobyDa
@OpenAPI        https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI
@ScriptURL      https://github.com/wanghao6736/QuanX/raw/master/JS/Task/jdDaily.js
@Description    1.Safari浏览器打开登录 https://home.m.jd.com/myJd/newhome.action 点击"我的"页面或者使用
                旧版网址 https://bean.m.jd.com/bean/signIndex.action 点击签到并且出现签到日历如果通知
                获取Cookie成功，则可以使用此签到脚本。注: 请勿在京东APP内获取!!!
                2.获取京东金融签到Body说明：进入"京东金融"APP，在"首页"点击"签到"并签到一次，待通知提示成功即可。
                3.由于cookie的有效性(经测试网页Cookie有效周期最长31天)，如果脚本后续弹出cookie无效的通知，则需要
                重复上述步骤。
                4.签到脚本将在每天的凌晨0:05执行，您可以修改执行时间。因部分接口京豆限量领取，建议调整为凌晨签到。
@Acknowledgment @NobyDa, @Peng-YM

QuantumultX 远程脚本配置:

[task_local]
# 京东多合一签到
5 0 * * * https://github.com/wanghao6736/QuanX/raw/master/JS/Task/jdDaily.js, tag=京东多合一签到, img-url=https://raw.githubusercontent.com/NobyDa/mini/master/Color/jd.png,enabled=true

[rewrite_local]
# 获取京东Cookie
^https:\/\/(api\.m|me-api)\.jd\.com\/(client\.action\?functionId=signBean|user_new\/info\/GetJDUserInfoUnion\?) url script-request-header https://github.com/wanghao6736/QuanX/raw/master/JS/Task/jdDaily.js

# 获取钢镚签到body
^https:\/\/ms\.jr\.jd\.com\/gw\/generic\/hy\/h5\/m\/appSign\? url script-request-body https://github.com/wanghao6736/QuanX/raw/master/JS/Task/jdDaily.js

[mitm]
hostname = ms.jr.jd.com, me-api.jd.com, api.m.jd.com
*****************************************/

var merge = {};

var KEY = '';

const $ = API("#jd_daily");

(async function ReadCookie() {
  const cookieSet = $.read($.name);
  if ($.env.isRequest) {
    GetCookie();
  } else if ((cookieSet || "[]") != "[]") {
    let ck = JSON.parse(cookieSet)[0].cookie;
    let jr = JSON.parse(cookieSet)[0].jrBody;
    await all(ck, jr);
  } else {
    $.error("脚本终止, 未获取Cookie ‼️");
  }
})()
  .catch((e) => {
    $.notify("京东签到", "", e.message || $.stringify(e));
  })
  .finally(() => {
    if ($.env.isJSBox) $intents.finish($.st);
    $.done();
  });

async function all(cookie, jrBody) {
  KEY = cookie;
  merge = {};
  await Promise.all([
    JingDongBean(0), //京东京豆
    JingDongGetCash(0), //京东领现金
    JingRongDoll(0, 'JDDouble', '金融京豆-双签', 'F68B2C3E71', '', '', '', 'jingdou'), //京东金融 京豆双签
    // JingRongSteel(0, jrBody), //金融钢镚
  ]);
  await Promise.all([
    TotalSteel(), //总钢镚查询
    TotalCash(), //总红包查询
    TotalBean(), //总京豆查询
    TotalSubsidy(), //总金贴查询
    TotalMoney() //总现金查询
  ]);
  await notify();
}

async function notify() {
    try {
        var bean = 0;
        var steel = 0;
        var cash = 0;
        var money = 0;
        var subsidy = 0;
        var success = 0;
        var fail = 0;
        var err = 0;
        var notify = '';
        for (var i in merge) {
            bean += merge[i].bean ? Number(merge[i].bean) : 0
            steel += merge[i].steel ? Number(merge[i].steel) : 0
            cash += merge[i].Cash ? Number(merge[i].Cash) : 0
            money += merge[i].Money ? Number(merge[i].Money) : 0
            subsidy += merge[i].subsidy ? Number(merge[i].subsidy) : 0
            success += merge[i].success ? Number(merge[i].success) : 0
            fail += merge[i].fail ? Number(merge[i].fail) : 0
            err += merge[i].error ? Number(merge[i].error) : 0
            notify += merge[i].notify ? "\n" + merge[i].notify : ""
        }
        var Cash = merge.TotalCash && merge.TotalCash.TCash ? `${merge.TotalCash.TCash}红包` : ""
        var Steel = merge.TotalSteel && merge.TotalSteel.TSteel ? `${merge.TotalSteel.TSteel}钢镚` : ``
        var beans = merge.TotalBean && merge.TotalBean.Qbear ? `${merge.TotalBean.Qbear}京豆${Steel?`, `:``}` : ""
        var Money = merge.TotalMoney && merge.TotalMoney.TMoney ? `${merge.TotalMoney.TMoney}现金${Cash?`, `:``}` : ""
        var Subsidy = merge.TotalSubsidy && merge.TotalSubsidy.TSubsidy ? `${merge.TotalSubsidy.TSubsidy}金贴${Money||Cash?", ":""}` : ""
        var Tbean = bean ? `${bean.toFixed(0)}京豆${steel?", ":""}` : ""
        var TSteel = steel ? `${steel.toFixed(2)}钢镚` : ""
        var TCash = cash ? `${cash.toFixed(2)}红包${subsidy||money?", ":""}` : ""
        var TSubsidy = subsidy ? `${subsidy.toFixed(2)}金贴${money?", ":""}` : ""
        var TMoney = money ? `${money.toFixed(2)}现金` : ""
        var Ts = success ? `成功${success}个${fail||err?`, `:``}` : ``
        var Tf = fail ? `失败${fail}个${err?`, `:``}` : ``
        var Te = err ? `错误${err}个` : ``
        var one = `【签到概览】:  ${Ts+Tf+Te}${Ts||Tf||Te?`\n`:`获取失败\n`}`
        var two = Tbean || TSteel ? `【签到奖励】:  ${Tbean+TSteel}\n` : ``
        var three = TCash || TSubsidy || TMoney ? `【其他奖励】:  ${TCash+TSubsidy+TMoney}\n` : ``
        var four = `【账号总计】:  ${beans+Steel}${beans||Steel?`\n`:`获取失败\n`}`
        var five = `【其他总计】:  ${Subsidy+Money+Cash}${Subsidy||Money||Cash?`\n`:`获取失败\n`}`
        var DName = merge.TotalBean && merge.TotalBean.nickname ? merge.TotalBean.nickname : "获取失败"
        var cnNum = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
        const Name = `【签到号${cnNum[0]}】: ${DName}\n`
        $.notify("", "", Name + one + two + three + four + five + notify, {
            'media-url': merge.TotalBean.headUrl || 'https://cdn.jsdelivr.net/gh/NobyDa/mini@master/Color/jd.png'
        });
    } catch (e) {
        $.notify("通知模块 " + e.name + "‼️", $.stringify(e), e.message)
    }
}

function JingDongBean(s) {
  merge.JDBean = {};
  return $.http
    .post({
      url: "https://api.m.jd.com/client.action",
      headers: {
        Cookie: KEY,
      },
      body: "functionId=signBeanAct&appid=ld",
    })
    .then((response) => {
      data = response.body;
      const cc = JSON.parse(data);
      const Details = "response:\n" + data;
      if (cc.code == 3) {
        $.log("\n" + "京东商城-京豆Cookie失效 " + Details);
        merge.JDBean.notify = "京东商城-京豆: 失败, 原因: Cookie失效‼️";
        merge.JDBean.fail = 1;
      } else if (data.match(/跳转至拼图/)) {
        merge.JDBean.notify = "京东商城-京豆: 失败, 需要拼图验证 ⚠️";
        merge.JDBean.fail = 1;
      } else if (data.match(/\"status\":\"?1\"?/)) {
        $.log("\n" + "京东商城-京豆签到成功 " + Details);
        if (data.match(/dailyAward/)) {
          merge.JDBean.notify =
            "京东商城-京豆: 成功, 明细: " +
            cc.data.dailyAward.beanAward.beanCount +
            "京豆 🐶";
          merge.JDBean.bean = cc.data.dailyAward.beanAward.beanCount;
        } else if (data.match(/continuityAward/)) {
          merge.JDBean.notify =
            "京东商城-京豆: 成功, 明细: " +
            cc.data.continuityAward.beanAward.beanCount +
            "京豆 🐶";
          merge.JDBean.bean = cc.data.continuityAward.beanAward.beanCount;
        } else if (data.match(/新人签到/)) {
          const quantity = data.match(/beanCount\":\"(\d+)\".+今天/);
          merge.JDBean.bean = quantity ? quantity[1] : 0;
          merge.JDBean.notify =
            "京东商城-京豆: 成功, 明细: " +
            (quantity ? quantity[1] : "无") +
            "京豆 🐶";
        } else {
          merge.JDBean.notify = "京东商城-京豆: 成功, 明细: 无京豆 🐶";
        }
        merge.JDBean.success = 1;
      } else {
        merge.JDBean.fail = 1;
        $.log("\n" + "京东商城-京豆签到失败 " + Details);
        if (data.match(/(已签到|新人签到)/)) {
          merge.JDBean.notify = "京东商城-京豆: 失败, 原因: 已签过 ⚠️";
        } else if (data.match(/人数较多|S101/)) {
          merge.JDBean.notify = "京东商城-京豆: 失败, 签到人数较多 ⚠️";
        } else {
          merge.JDBean.notify = "京东商城-京豆: 失败, 原因: 未知 ⚠️";
        }
      }
    })
    .catch((e) => {
      $.error(e);
    })
}

function JingRongSteel(s, body) {
    merge.JRSteel = {};
    if (!body) {
    merge.JRSteel.fail = 1;
    merge.JRSteel.notify = "京东金融-钢镚: 失败, 未获取签到Body ⚠️";
    return;
    }
    const JRSUrl = {
        url: "https://ms.jr.jd.com/gw/generic/hy/h5/m/jrSign",
        headers: {
        Cookie: KEY,
        },
        body: body || "",
    };
    return $.http
        .post(JRSUrl)
        .then((response) => {
            data = response.body;
            const cc = JSON.parse(data);
            const Details = "response:\n" + data;
            if (cc.resultCode == 0 && cc.resultData && cc.resultData.resBusiCode == 0) {
                $.log("\n" + "京东金融-钢镚签到成功 " + Details);
                merge.JRSteel.notify = `京东金融-钢镚: 成功, 获得钢镚奖励 💰`;
                merge.JRSteel.success = 1;
            } else {
                $.log("\n" + "京东金融-钢镚签到失败 " + Details);
                merge.JRSteel.fail = 1;
                if (cc.resultCode == 0 && cc.resultData && cc.resultData.resBusiCode == 15) {
                    merge.JRSteel.notify = "京东金融-钢镚: 失败, 原因: 已签过 ⚠️";
                } else if (data.match(/未实名/)) {
                    merge.JRSteel.notify = "京东金融-钢镚: 失败, 账号未实名 ⚠️";
                } else if (cc.resultCode == 3) {
                    merge.JRSteel.notify = "京东金融-钢镚: 失败, 原因: Cookie失效‼️";
                } else {
                    const ng = (cc.resultData && cc.resultData.resBusiMsg) || cc.resultMsg;
                    merge.JRSteel.notify = `京东金融-钢镚: 失败, ${`原因: ${ng || `未知`}`} ⚠️`;
                }
            }
        })
        .catch((e) => {
            $.error(e);
        });
}

function JingDongGetCash(s) {
  merge.JDGetCash = {};
  return $.http
    .get({
      url: "https://api.m.jd.com/client.action?functionId=cash_sign&body=%7B%22remind%22%3A0%2C%22inviteCode%22%3A%22%22%2C%22type%22%3A0%2C%22breakReward%22%3A0%7D&client=apple&clientVersion=9.0.8&openudid=1fce88cd05c42fe2b054e846f11bdf33f016d676&sign=7e2f8bcec13978a691567257af4fdce9&st=1596954745073&sv=111",
      headers: {
        Cookie: KEY,
      },
    })
    .then((response) => {
      data = response.body;
      const cc = JSON.parse(data);
      const Details = "response:\n" + data;
      if (cc.data.success && cc.data.result) {
        $.log("\n" + "京东商城-现金签到成功 " + Details);
        merge.JDGetCash.success = 1;
        merge.JDGetCash.Money = cc.data.result.signCash || 0;
        merge.JDGetCash.notify = `京东商城-现金: 成功, 明细: ${
          cc.data.result.signCash || `无`
        }现金 💰`;
      } else {
        $.log("\n" + "京东商城-现金签到失败 " + Details);
        merge.JDGetCash.fail = 1;
        if (data.match(/\"bizCode\":201|已经签过/)) {
          merge.JDGetCash.notify = "京东商城-现金: 失败, 原因: 已签过 ⚠️";
        } else if (data.match(/\"code\":300|退出登录/)) {
          merge.JDGetCash.notify = "京东商城-现金: 失败, 原因: Cookie失效‼️";
        } else {
          merge.JDGetCash.notify = "京东商城-现金: 失败, 原因: 未知 ⚠️";
        }
      }
    })
    .catch((e) => {
      $.error(e);
    })
}

function JingRongDoll(s, key, title, code, type, num, award, belong) {
  merge[key] = {};
  const DollUrl = {
    url: "https://nu.jr.jd.com/gw/generic/jrm/h5/m/process",
    headers: {
      Cookie: KEY,
    },
    body: `reqData=${encodeURIComponent(
      `{"actCode":"${code}","type":${type ? type : `3`}${code == "F68B2C3E71" ? `,"frontParam":{"belong":"${belong}"}` : code == `1DF13833F7` ? `,"frontParam":{"channel":"JR","belong":4}` : ``}}`
    )}`,
  };
  return $.http
    .post(DollUrl)
    .then(async (response) => {
      data = response.body;
      var cc = JSON.parse(data);
      const Details = "response:\n" + data;
      if (cc.resultCode == 0) {
        if (cc.resultData.data.businessData != null) {
          $.log(`\n${title}查询成功 ${Details}`);
          if (cc.resultData.data.businessData.pickStatus == 2) {
            if (data.match(/\"rewardPrice\":\"\d.*?\"/)) {
              const JRDoll_bean = data.match(/\"rewardPrice\":\"(\d.*?)\"/)[1];
              const JRDoll_type = data.match(/\"rewardName\":\"金贴奖励\"/) ? true : false;
              await JingRongDoll(s, key, title, code, "4", JRDoll_bean, JRDoll_type);
            } else {
              merge[key].success = 1;
              merge[key].notify = `${title}: 成功, 明细: 无奖励 🐶`;
            }
          } else if (code == "F68B2C3E71" || code == "1DF13833F7") {
            if (!data.match(/"businessCode":"30\dss?q"/)) {
              merge[key].success = 1;
              const ct = data.match(/\"count\":\"?(\d.*?)\"?,/);
              if (code == "F68B2C3E71" && belong == "xianjin") {
                merge[key].Money = ct ? ct[1] > 9 ? `0.${ct[1]}` : `0.0${ct[1]}` : 0;
                merge[key].notify = `${title}: 成功, 明细: ${
                  merge[key].Money || `无`
                }现金 💰`;
              } else if (code == "F68B2C3E71" && belong == "jingdou") {
                merge[key].bean = ct ? ct[1] : 0;
                merge[key].notify = `${title}: 成功, 明细: ${merge[key].bean || `无`}京豆 🐶`;
              } else if (code == "1DF13833F7") {
                merge[key].subsidy = ct ? ct[1] : 0;
                merge[key].notify = `${title}: 成功, 明细: ${merge[key].subsidy || `无`}金贴 💰`;
              }
            } else {
              const es = cc.resultData.data.businessMsg;
              const ep = cc.resultData.data.businessData.businessMsg;
              const tp = data.match(/已领取|300ss?q/) ? `已签过` : `${ep || es || cc.resultMsg || `未知`}`;
              merge[key].notify = `${title}: 失败, 原因: ${tp} ⚠️`;
              merge[key].fail = 1;
            }
          } else {
            merge[key].notify = `${title}: 失败, 原因: 已签过 ⚠️`;
            merge[key].fail = 1;
          }
        } else if (cc.resultData.data.businessCode == 200) {
          $.log(`\n${title}签到成功 ${Details}`);
          if (!award) {
            merge[key].bean = num ? num.match(/\d+/)[0] : 0;
          } else {
            merge[key].subsidy = num || 0;
          }
          merge[key].success = 1;
          merge[key].notify = `${title}: 成功, 明细: ${(award ? num : merge[key].bean) || `无`}${award ? `金贴 💰` : `京豆 🐶`}`;
        } else {
          $.log(`\n${title}领取异常 ${Details}`);
          if (num)
            $.log(`\n${title} 请尝试手动领取, 预计可得${num}${award ? `金贴` : `京豆`}: \nhttps://uf1.jr.jd.com/up/redEnvelopes/index.html?actCode=${code}\n`);
          merge[key].fail = 1;
          merge[key].notify = `${title}: 失败, 原因: 领取异常 ⚠️`;
        }
      } else {
        $.log(`\n${title}签到失败 ${Details}`);
        const redata = typeof cc.resultData == "string" ? cc.resultData : "";
        merge[key].notify = `${title}: 失败, ${cc.resultCode == 3 ? `原因: Cookie失效‼️` : `${redata || "原因: 未知 ⚠️"}`}`;
        merge[key].fail = 1;
      }
    })
    .catch((e) => {
      $.error(e);
    });
}

function TotalSteel() {
  merge.TotalSteel = {};
  return $.http
    .get({
      url: "https://coin.jd.com/m/gb/getBaseInfo.html",
      headers: {
        Cookie: KEY,
      },
    })
    .then((response) => {
      data = response.body;
      const Details = "response:\n" + data;
      if (data.match(/(\"gbBalance\":\d+)/)) {
        $.log("\n" + "京东-总钢镚查询成功 " + Details);
        const cc = JSON.parse(data);
        merge.TotalSteel.TSteel = cc.gbBalance;
      } else {
        $.log("\n" + "京东-总钢镚查询失败 " + Details);
      }
    })
    .catch((e) => {
      $.error(e);
    });
}

function TotalBean() {
  merge.TotalBean = {};
  return $.http
    .get({
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Cookie: KEY,
      },
    })
    .then((response) => {
      data = response.body;
      const Details = "response:\n" + data;
      const cc = JSON.parse(data);
      if (cc.msg == "success" && cc.retcode == 0) {
        merge.TotalBean.nickname = cc.data.userInfo.baseInfo.nickname || "";
        merge.TotalBean.Qbear = cc.data.assetInfo.beanNum || 0;
        merge.TotalBean.headUrl = cc.data.userInfo.baseInfo.headImageUrl || "";
        $.log(`\n京东-总京豆查询成功 ${Details}`);
      } else {
        const name = decodeURIComponent(KEY.split(/pt_pin=(.+?);/)[1] || "");
        merge.TotalBean.nickname =
          cc.retcode == 1001 ? `${name} (CK失效‼️)` : "";
        $.log(`\n京东-总京豆查询失败 ${Details}`);
      }
    })
    .catch((e) => {
      $.error(e);
    });
}

function TotalCash() {
  merge.TotalCash = {};
  return $.http
    .post({
      url: "https://api.m.jd.com/client.action?functionId=myhongbao_balance",
      headers: {
        Cookie: KEY,
      },
      body: "body=%7B%22fp%22%3A%22-1%22%2C%22appToken%22%3A%22apphongbao_token%22%2C%22childActivityUrl%22%3A%22-1%22%2C%22country%22%3A%22cn%22%2C%22openId%22%3A%22-1%22%2C%22childActivityId%22%3A%22-1%22%2C%22applicantErp%22%3A%22-1%22%2C%22platformId%22%3A%22appHongBao%22%2C%22isRvc%22%3A%22-1%22%2C%22orgType%22%3A%222%22%2C%22activityType%22%3A%221%22%2C%22shshshfpb%22%3A%22-1%22%2C%22platformToken%22%3A%22apphongbao_token%22%2C%22organization%22%3A%22JD%22%2C%22pageClickKey%22%3A%22-1%22%2C%22platform%22%3A%221%22%2C%22eid%22%3A%22-1%22%2C%22appId%22%3A%22appHongBao%22%2C%22childActiveName%22%3A%22-1%22%2C%22shshshfp%22%3A%22-1%22%2C%22jda%22%3A%22-1%22%2C%22extend%22%3A%22-1%22%2C%22shshshfpa%22%3A%22-1%22%2C%22activityArea%22%3A%22-1%22%2C%22childActivityTime%22%3A%22-1%22%7D&client=apple&clientVersion=8.5.0&d_brand=apple&networklibtype=JDNetworkBaseAF&openudid=1fce88cd05c42fe2b054e846f11bdf33f016d676&sign=fdc04c3ab0ee9148f947d24fb087b55d&st=1581245397648&sv=120",
    })
    .then((response) => {
      data = response.body;
      const Details = "response:\n" + data;
      if (data.match(/(\"totalBalance\":\d+)/)) {
        $.log("\n" + "京东-总红包查询成功 " + Details);
        const cc = JSON.parse(data);
        merge.TotalCash.TCash = cc.totalBalance;
      } else {
        $.log("\n" + "京东-总红包查询失败 " + Details);
      }
    })
    .catch((e) => {
      $.error(e);
    });
}

function TotalSubsidy() {
    merge.TotalSubsidy = {};
    return $.http
    .get({
        url: 'https://ms.jr.jd.com/gw/generic/uc/h5/m/mySubsidyBalance',
        headers: {
          Cookie: KEY,
          Referer: 'https://active.jd.com/forever/cashback/index?channellv=wojingqb'
        }
      })
    .then((response) => {
      data = response.body;
      const Details = "response:\n" + data;
      const cc = JSON.parse(data)
      if (cc.resultCode == 0 && cc.resultData && cc.resultData.data) {
        $.log("\n京东-总金贴查询成功 " + Details)
        merge.TotalSubsidy.TSubsidy = cc.resultData.data.balance || 0
      } else {
        $.log("\n京东-总金贴查询失败 " + Details)
      }
    })
    .catch((e) => {
      $.error(e);
    });
}

function TotalMoney() {
  merge.TotalMoney = {};
  return $.http
    .get({
      url: "https://api.m.jd.com/client.action?functionId=cash_exchangePage&body=%7B%7D&build=167398&client=apple&clientVersion=9.1.9&openudid=1fce88cd05c42fe2b054e846f11bdf33f016d676&sign=762a8e894dea8cbfd91cce4dd5714bc5&st=1602179446935&sv=102",
      headers: {
        Cookie: KEY,
      },
    })
    .then((response) => {
      data = response.body;
      const Details = "response:\n" + data;
      const cc = JSON.parse(data);
      if (cc.code == 0 && cc.data && cc.data.bizCode == 0 && cc.data.result) {
        $.log("\n京东-总现金查询成功 " + Details);
        merge.TotalMoney.TMoney = cc.data.result.totalMoney || 0;
      } else {
        $.log("\n京东-总现金查询失败 " + Details);
      }
    })
    .catch((e) => {
      $.error(e);
    });
}

function checkFormat(value) { //check format and delete duplicates
    let n, k, c = {};
    return value.reduce((t, i) => {
      k = ((i.cookie || '').match(/(pt_key|pt_pin)=.+?;/g) || []).sort();
      if (k.length == 2) {
        if ((n = k[1]) && !c[n]) {
          i.userName = i.userName ? i.userName : decodeURIComponent(n.split(/pt_pin=(.+?);/)[1]);
          i.cookie = k.join('')
          if (i.jrBody && !i.jrBody.includes('reqData=')) {
            $.log(`异常钢镚Body已过滤: ${i.jrBody}`)
            delete i.jrBody;
          }
          c[n] = t.push(i);
        }
      } else {
        $.log(`异常京东Cookie已过滤: ${i.cookie}`)
      }
      return t;
    }, [])
}

function CookieUpdate(oldValue, newValue, path = 'cookie') {
    let item, type, name = (oldValue || newValue || '').split(/pt_pin=(.+?);/)[1];
    let total = $.read($.name);
    try {
      total = checkFormat(JSON.parse(total || '[]'));
    } catch (e) {
      $.notify("京东签到", "", "Cookie JSON格式不正确, 即将清空\n可前往日志查看该数据内容!");
      $.log(`京东签到Cookie JSON格式异常: ${e.message||e}\n旧数据内容: ${total}`);
      total = [];
    }
    for (let i = 0; i < total.length; i++) {
      if (total[i].cookie && new RegExp(`pt_pin=${name};`).test(total[i].cookie)) {
        item = i;
        break;
      }
    }
    if (newValue && item !== undefined) {
      type = total[item][path] === newValue ? -1 : 2;
      total[item][path] = newValue;
      item = item + 1;
    } else if (newValue && path === 'cookie') {
      total.push({
        cookie: newValue
      });
      type = 1;
      item = total.length;
    }
    return {
      total: checkFormat(total),
      type, //-1: same, 1: add, 2:update
      item,
      name: decodeURIComponent(name)
    };
}

function GetCookie() {
    const req = $request;
    if (req.method != 'OPTIONS' && req.headers) {
      const CV = (req.headers['Cookie'] || req.headers['cookie'] || '');
      const ckItems = CV.match(/(pt_key|pt_pin)=.+?;/g);
      if (/^https:\/\/(me-|)api(\.m|)\.jd\.com\/(client\.|user_new)/.test(req.url)) {
        if (ckItems && ckItems.length == 2) {
          const value = CookieUpdate(null, ckItems.join(''))
          if (value.type !== -1) {
            const write = $.write($.stringify(value.total), $.name)
            $.notify(`用户名: ${value.name}`, ``, `${value.type==2?`更新`:`写入`}京东 [账号${value.item}] Cookie${write?`成功 🎉`:`失败 ‼️`}`)
          } else {
            $.log(`\n用户名: ${value.name}\n与历史京东 [账号${value.item}] Cookie相同, 跳过写入 ⚠️`)
          }
        } else {
          $.error("写入Cookie失败, 关键值缺失\n可能原因: 非网页获取 ‼️");
        }
      } else if (/^https:\/\/ms\.jr\.jd\.com\/gw\/generic\/hy\/h5\/m\/jrSign\?/.test(req.url) && req.body) {
        const value = CookieUpdate(CV, req.body, 'jrBody');
        if (value.type) {
          const write = $.write($.stringify(value.total), $.name)
          $.notify(`用户名: ${value.name}`, ``, `获取京东 [账号${value.item}] 钢镚Body${write?`成功 🎉`:`失败 ‼️`}`)
        } else {
          $.error("写入钢镚Body失败\n未获取该账号Cookie或关键值缺失‼️");
        }
      } else if (req.url === 'http://www.apple.com/') {
        $.error("类型错误, 手动运行请选择上下文环境为Cron ⚠️");
      }
    } else if (!req.headers) {
        $.error("写入Cookie失败, 请检查匹配URL或配置内脚本类型 ⚠️");
    }
}

// https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI
function ENV(){const e="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:"undefined"!=typeof $task,isLoon:"undefined"!=typeof $loon,isSurge:"undefined"!=typeof $httpClient&&"undefined"!=typeof $utils,isBrowser:"undefined"!=typeof document,isNode:"function"==typeof require&&!e,isJSBox:e,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:o,isScriptable:n,isNode:i,isBrowser:r}=ENV(),u=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;const a={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(h=>a[h.toLowerCase()]=(a=>(function(a,h){h="string"==typeof h?{url:h}:h;const d=e.baseURL;d&&!u.test(h.url||"")&&(h.url=d?d+h.url:h.url),h.body&&h.headers&&!h.headers["Content-Type"]&&(h.headers["Content-Type"]="application/x-www-form-urlencoded");const l=(h={...e,...h}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...h.events};let f,p;if(c.onRequest(a,h),t)f=$task.fetch({method:a,...h});else if(s||o||i)f=new Promise((e,t)=>{(i?require("request"):$httpClient)[a.toLowerCase()](h,(s,o,n)=>{s?t(s):e({statusCode:o.status||o.statusCode,headers:o.headers,body:n})})});else if(n){const e=new Request(h.url);e.method=a,e.headers=h.headers,e.body=h.body,f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}else r&&(f=new Promise((e,t)=>{fetch(h.url,{method:a,headers:h.headers,body:h.body}).then(e=>e.json()).then(t=>e({statusCode:t.status,headers:t.headers,body:t.data})).catch(t)}));const y=l?new Promise((e,t)=>{p=setTimeout(()=>(c.onTimeout(),t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)),l)}):null;return(y?Promise.race([y,f]).then(e=>(clearTimeout(p),e)):f).then(e=>c.onResponse(e))})(h,a))),a}function API(e="untitled",t=!1){const{isQX:s,isLoon:o,isSurge:n,isNode:i,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e,this.debug=t,this.http=HTTP(),this.env=ENV(),this.node=(()=>{if(i){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return((e,t)=>new Promise(function(s){setTimeout(s.bind(null,t),e)}))(e,t)})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(o||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),i){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.root={},e=`${this.name}.json`,this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(o||n)&&$persistentStore.write(e,this.name),i&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){if(this.log(`SET ${t}`),-1!==t.indexOf("#")){if(t=t.substr(1),n||o)return $persistentStore.write(e,t);if(s)return $prefs.setValueForKey(e,t);i&&(this.root[t]=e)}else this.cache[t]=e;this.persistCache()}read(e){return this.log(`READ ${e}`),-1===e.indexOf("#")?this.cache[e]:(e=e.substr(1),n||o?$persistentStore.read(e):s?$prefs.valueForKey(e):i?this.root[e]:void 0)}delete(e){if(this.log(`DELETE ${e}`),-1!==e.indexOf("#")){if(e=e.substr(1),n||o)return $persistentStore.write(null,e);if(s)return $prefs.removeValueForKey(e);i&&delete this.root[e]}else delete this.cache[e];this.persistCache()}notify(e,t="",a="",h={}){const d=h["open-url"],l=h["media-url"];if(s&&$notify(e,t,a,h),n&&$notification.post(e,t,a+`${l?"\n多媒体:"+l:""}`,{url:d}),o){let s={};d&&(s.openUrl=d),l&&(s.mediaUrl=l),"{}"===JSON.stringify(s)?$notification.post(e,t,a):$notification.post(e,t,a,s)}if(i||u){const s=a+(d?`\n点击跳转: ${d}`:"")+(l?`\n多媒体: ${l}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){s||o||n?$done(e):i&&!r&&"undefined"!=typeof $context&&($context.headers=e.headers,$context.statusCode=e.statusCode,$context.body=e.body)}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}