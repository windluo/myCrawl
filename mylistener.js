/**
 * 简易监听器，监听抓取进度
 */

const EventEmitter = require("events");
const myEE = new EventEmitter();

let countObj = {
  total: 0,
  successedNum: 0,
  failedNum: 0
};

myEE.on("successedCrawl", function() {
  countObj.successedNum++;
  checkIfOver();
});

myEE.on("failedCrawl", function() {
  countObj.failedNum++;
  checkIfOver();
});

myEE.on("endCrawl", function() {
  console.log(`————————本次共抓取数据：${countObj.total}条————————`);
  console.log(`成功：${countObj.successedNum}条`);
  console.log(`失败：${countObj.failedNum}条`);

  if (countObj.failedNum === 0) {
    console.log("完美！全部数据抓取成功！");
  } else {
    // TODO：错误原因写入日志文件，待定
    console.log("本次有数据抓取失败，错误原因请到 ./logs 目录下查看");
  }
});

function checkIfOver() {
  if (countObj.successedNum + countObj.failedNum === countObj.total) {
    myEE.emit('endCrawl')
  }
}

const mylistener = {
  countObj: countObj,
  myEE: myEE
}

module.exports = mylistener