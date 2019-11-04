/**
 * 玩一下爬虫
 * * 爬取图片
 * * 图片去水印
 * * 图片打包
 */

const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");
const request = require("request");

const { countObj, myEE } = require("./mylistener");
const writeInLogger = require("./mylogs");

const options = {
  header: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537."
  }
};

// 以爬百度图片一页为例
async function getData(url) {
  const result = await axios.get(url, {
    headers: options.header
  });

  let data = result.data.data;
  // 百度图片会多返回一条空数据，实际只有30条有效数据
  countObj.total = data.length - 1;
  if (!data.length) {
    console.log("*************没有找到查询图片***********");
    return;
  }

  data.forEach(function(item, index) {
    if (item.hoverURL) {
      getImageFromList(item, index);
    }
  });
}

// 把图片存入本地
async function getImageFromList(target, index) {
  let imgfile = `${fillinFn(index)}.${target.type}`;
  let imgSrc = target.hoverURL;

  //采用request模块，向服务器发起请求 获取图片资源
  request.head(imgSrc, function(error, res, body) {
    if (error) {
      myEE.emit("failedCrawl");
      writeInLogger(error, target);
    }
  });
  //通过管道的方式用fs模块将图片写到本地的images文件下
  request(imgSrc).pipe(fs.createWriteStream("./images/" + imgfile));
  myEE.emit("successedCrawl");

  await sleep(Math.random() * 2 * 1000);
}

function fillinFn(value) {
  return value < 10 ? "0" + value : value;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let keyword = encodeURIComponent("九寨沟");
let url = `https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&ct=201326592&is=&fp=result&queryWord=${keyword}&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=3&ic=&hd=1&latest=&copyright=&word=${keyword}&s=&se=&tab=&width=0&height=0&face=0&istype=2&qc=&nc=1&fr=&expermode=&force=&pn=30&rn=30&gsm=&1572848525705=`;
// 启动爬虫
getData(url);
