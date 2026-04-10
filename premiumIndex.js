// fundingMonitor.js
// node fundingMonitor.js

const https = require("https");

// 👉 你关心的交易对 + 仓位（USDT）
const CONFIG = {
  BTCDOMUSDT: -75900,
  BTCUSDT: -61200,
  BZUSDT: 51500,
  CLUSDT: -35700,
  BNBUSDT: 35300,
  TRXUSDT: -25600,
  XRPUSDT: -13600,
};

// ANSI 颜色
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// 请求函数
function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// 主逻辑
async function main() {
  const url = "https://fapi.binance.com/fapi/v1/premiumIndex";

  try {
    const data = await getJSON(url);

    console.log("Funding Rate Monitor\n");

    for (const symbol of Object.keys(CONFIG)) {
      const item = data.find(x => x.symbol === symbol);
      if (!item) continue;

      const rate = parseFloat(item.lastFundingRate);
      const percent = (rate * 100).toFixed(4) + "%";
      const price = parseFloat(item.markPrice);
      const position = CONFIG[symbol];

      // 💰 预估资金费
      const fundingFee = position * rate;

      // 🎨 颜色
      const color = rate >= 0 ? RED : GREEN;

      // 时间
      const nextTimeParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(new Date(item.nextFundingTime));

      const nextTimeObj = {};
      nextTimeParts.forEach(part => {
        if (part.type !== 'literal') nextTimeObj[part.type] = part.value;
      });

      const nextTime = `${nextTimeObj.month}-${nextTimeObj.day} ${nextTimeObj.hour}:${nextTimeObj.minute}`;

      console.log(
        `${symbol}  费率:${color}${percent}${RESET}  价格:${price.toFixed(2)}`
      );
      console.log(
        `    仓位:${position}U  资金:${color}${fundingFee.toFixed(4)}${RESET}  结算:${nextTime}`
      );
      console.log("");
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

// 每10秒刷新
// setInterval(main, 10000);
main();
