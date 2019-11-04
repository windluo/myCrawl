/**
 * 简易logger
 */

const fs = require("fs");

// TODO：日志文件应该按照时间节点创建，比如每天抓一次，应该每天创建一个日志文件
// 加入当天没有日志，其实可以不创建日志文件
const writeStream = fs.createWriteStream("./logs/errors.log");

// target 计划传入抓取失败的数据的详细信息，以便日志记录更详细
function writeInLogger(error, target) {
  let time = new Date().toLocaleString();
  writeStream.write(`【${time}】${error} \n\n`);
}

module.exports = writeInLogger;
