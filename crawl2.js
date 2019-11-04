/**
 * 根据 title.txt 文件的列表爬取公众号文章，自动存储到数据库的news、news_list表
 * txt 里的时间单位是秒，注意转换为毫秒计算
 * crawTime，抓取时间区间，注意修改
 */

const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const cheerio = require("cheerio");
const request = require("request");
const DB_ADDRESS = require("../global_config").DB_ADDRESS;
const orm = require("orm");

// 本次抓取时间区间，闭区间。每次抓取的时候注意修改这个时间。
const crawTime = ["2019/02/03", "2019/07/02"];

// 读取本地文件，获取需要抓取的数据
function readLocalFile(callback) {
  const readStream = fs.createReadStream("title.txt");
  var objReadline = readline.createInterface({
    input: readStream
  });

  let arr = [];
  objReadline.on("line", function(line) {
    if (line) {
      line = JSON.parse(line);
    }
    arr.push(line);
  });

  objReadline.on("close", function() {
    callback(arr.reverse());
  });
}

// readLocalFile(getCrawlList);

let writeStream = null;
// 获取本次抓取区间的数据
function getCrawlList(data) {
  let crawList = [];
  let startTime = new Date(crawTime[0]).getTime();
  let endTime = new Date(crawTime[1]).getTime();
  data.forEach(function(item) {
    let time = item.create_time * 1000;
    if (time >= startTime && time <= endTime) {
      crawList.push(item);
    }
  });

  writeStream = fs.createWriteStream("content.txt");
  crawList.forEach(function(item) {
    getData(item);
  });
}

const options = {
  header: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537."
  }
};

async function getData(target) {
  const data = await axios.get(target.link, {
    headers: options.header
  });
  let $ = cheerio.load(data.data);
  removeNonContent($);

  // 正文内容在 #js_content 下
  getImageFromContent($, target);
  getImageFromList(target);
}

// 尽量移除不属于正文的内容
function removeNonContent($) {
  $("#js_content>section").each(function(index) {
    if (!$(this).html()) {
      $(this).remove();
    }
    if (index !== 0 && index !== 1) {
      $(this).remove();
    }
    if (
      $(this).attr("style") ==
      "white-space: normal;color: rgb(70, 64, 64);font-size: 14px;letter-spacing: 1px;"
    ) {
      $(this).remove();
    }
  });
  $("#js_content>p").remove();
  $('#js_content .__bg_gif').remove();
}

// 抓取内容的大图存放于本地
function getImageFromContent($, target) {
  let time = createTime(target.create_time);

  // 这种抓取方式会多抓啊一张二维码的，二维码这张图没有特殊区别，所以爬虫没法区分
  $("#js_content img").each(function(index, item) {
    let imgfile = time + index + ".jpeg";
    let imgSrc = $(this).attr("data-src");
    //采用request模块，向服务器发起请求 获取图片资源
    request.head(imgSrc, function(error, res, body) {
      if (error) {
        console.log(error);
        console.log("失败了");
      }
    });
    //通过管道的方式用fs模块将图片写到本地的images文件下
    request(imgSrc).pipe(fs.createWriteStream("../public/news_content/" + imgfile));
  });

  rewriteImgSrcByLocal($, target);
  storeContent($, target, time);
}

// 抓取列表的图片存放于本地
function getImageFromList(target) {
  let time = createTime(target.create_time);

  let imgfile = time + ".jpeg";
  let imgSrc = target.cover;
  //采用request模块，向服务器发起请求 获取图片资源
  request.head(imgSrc, function(error, res, body) {
    if (error) {
      console.log(error);
      console.log("失败了");
    }
  });
  //通过管道的方式用fs模块将图片写到本地的images文件下
  request(imgSrc).pipe(fs.createWriteStream("../public/news_list/" + imgfile));
}

function createTime(tDate) {
  let date = new Date(tDate * 1000);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  month = month > 9 ? month : "0" + month;
  day = day > 9 ? day : "0" + day;
  let time = `${year}${month}${day}`;

  return time;
}

// 改写原图片地址为本地图片地址，imgFile为当前新闻存于本地的图片地址
function rewriteImgSrcByLocal($, target) {
  let time = createTime(target.create_time);

  $("#js_content img").each(function(index, item) {
    let imgfile = time + index + ".jpeg";
    $(this).attr("src", "/public/news_content/" + imgfile);
  });
}

// 存储改变后的文本数据
async function storeContent($, target, time) {
  let contentData = {
    content: $("#js_content").html(),
    title: target.title,
    publish_time: `${time.substr(0, 4)}-${time.substr(4, 2)}-${time.substr(6,2)}`,
    original_link: target.link,
    author: "海致星图",
    abstract: target.abstract,
    news_id: undefined
  };

  let listData = {
    title: target.title,
    abstract: filterAbstract(target.digest),
    figure_name: time + ".jpeg",
    foot_figure_name: 'stargraph_f.png',
    publish_date: `${time.substr(0, 4)}-${time.substr(4, 2)}-${time.substr(6,2)}`
  }

  // writeStream.write(JSON.stringify(data) + "\n\n");
  writeInDB(listData, contentData)
  await sleep(Math.random() * 2 * 1000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function filterAbstract(value) {
  let regex1 = /[\u4E00-\u9FA5\uF900-\uFA2D]|[A-Z]|[a-z]|[0-9]|([，？、！。])/;
  let res = ''

  for (let i = 0; i < value.length; i++) {
    if (regex1.test(value[i])) {
      res += value[i]
    }
  }

  return res;
}

// 链接数据库
function writeInDB(listData, contentData) {
  orm.connect(DB_ADDRESS, function(err, db) {
    if (err) throw err;

    let newsList = db.define('news_list', {
      title: String,
      abstract: String,
      figure_name: String,
      foot_figure_name: String,
      publish_date: { type: 'date' }
    })

    let news = db.define("news", {
      title: String,
      author: String,
      abstract: String,
      content: String,
      original_link: String,
      ctime: { type: "date" },
      publish_time: String,
      news_id: Number
    });

    db.sync(function(err) {
      if (err) throw err;
      newsList.create(listData, function(err) {
        console.log(listData.publish_date, listData.abstract)
        if (err) throw err;

        newsList.find({ publish_date:  listData.publish_date}, function (err, list) {
          if (err) throw err;

          contentData.news_id = list[0].id;
          news.create(contentData, function(err) {
            if (err) throw err;
            console.log(`————————————————${contentData.publish_time}，本条写入完成————————————`);
          });
        })
      })
    });
  });
}

// writeInDB()
