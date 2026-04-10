// fundingMonitor.js
// node fundingMonitor.js

const https = require("https");

// 👉 你关心的交易对 + 仓位（USDT）
const CONFIG = {
  BTCDOMUSDT: -75900,
  BTCUSDT: -61200,
  BZUSDT: -51500,
  CLUSDT: 35700,
  BNBUSDT: 35300,
  TRXUSDT: -25600,
  XRPUSDT: -13600,
  ETHUSDT: -9600,
};

const ob_config = [
  "PAXGUSDT", "XAUUSDT", "XAGUSDT",
  "EWYUSDT", "EWJUSDT", 
  "MSTRUSDT", "CRCLUSDT", "COINUSDT", "HOODUSDT",
  "QQQUSDT", "SPYUSDT", 
  "AAPLUSDT", "PLTRUSDT", "INTCUSDT",
  "AMZNUSDT", "GOOGLUSDT", "METAUSDT", 
  "NVDAUSDT", "TSLAUSDT"
];

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

      // 💰 预估资金费（正数表示收钱，负数表示付钱）
      const fundingFee = -position * rate;

      // 🎨 颜色：收钱绿，付钱红，0 保持默认颜色
      const color = fundingFee > 0 ? GREEN : fundingFee < 0 ? RED : RESET;

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

      const symbolText = symbol.padEnd(10);
      const rateText = percent.padStart(8);
      const priceText = price.toFixed(2).padStart(10);
      const positionText = position.toString().padStart(7);
      const fundingText = fundingFee.toFixed(4).padStart(9);

      console.log(
        `${symbolText} 费率:${color}${rateText}${RESET} 价格:${priceText}`
      );
      console.log(
        `  仓位:${positionText}U 资金:${color}${fundingText}${RESET} 结算:${nextTime}`
      );
      console.log("");
    }

    setTimeout(() => {
      console.log("备用交易对资金费率：\n");
      for (const symbol of ob_config) {
        const item = data.find(x => x.symbol === symbol);
        if (!item) continue;

        const rate = parseFloat(item.lastFundingRate);
        const percent = (rate * 100).toFixed(4) + "%";
        const price = parseFloat(item.markPrice);
        const priceText = price.toFixed(2).padStart(10);
        const color = rate > 0 ? RED : rate < 0 ? GREEN : RESET;

        const symbolText = symbol.padEnd(10);
        const rateText = percent.padStart(8);

        console.log(`${symbolText} 费率:${color}${rateText}${RESET}  价格:${priceText}`);
      }
      console.log("");
    }, 2000);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

// 每10秒刷新
// setInterval(main, 10000);
main();
