/**
 * 简易logger
 */

const fs = require("fs");

const writeStream = fs.createWriteStream("./logs/errors.log");

// target 计划传入抓取失败的数据的详细信息，以便日志记录更详细
function writeInLogger(error, target) {
  let time = new Date().toLocaleString();
  writeStream.write(`【${time}】${error} \n\n`);
}

module.exports = writeInLogger;
