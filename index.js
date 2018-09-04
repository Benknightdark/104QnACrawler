const axios = require("axios")
const cheerio = require("cheerio");
const rp = require('request-promise');
var json2xls = require('json2xls');
const fs=require('fs');
// 爬104QnA資料，並寫入xlsx檔
const getQnAData = new Promise((resolve, reject) => {
    const QnAUrl = 'https://www.104.com.tw/jobbank/faq';
    rp(`${QnAUrl}/index.cfm`).then(htmlString => {
        var $ = cheerio.load(htmlString);
        let crawlUrl = [];
        for (let index = 2; index <= $("#faq_menu").find("dt").length + 1; index++) {
            const element = $(`#faq_menu > dt:nth-child(${index}) > a`)
            crawlUrl.push(`${QnAUrl}/${element.attr("href")}`)
        }
        let promiseArray = crawlUrl.map(url => axios.get(url)); // or whatever
        axios.all(promiseArray)
            .then(results => {
                // Get QnA Url Array
                let allQnAUrl = [];
                for (let i2 = 0; i2 < results.length; i2++) {
                    let $2 = cheerio.load(results[i2].data);
                    let QnATableRowCount = $2("#content > div.box_w555 > div > table > tbody").children().length;
                    for (var i = 1; i <= QnATableRowCount; i++) {
                        let rowData = $2(`#content > div.box_w555 > div > table > tbody > tr:nth-child(${i}) > th > span > a`);
                        let rowDataUrl = `${QnAUrl}/${rowData.attr("href")}`
                        allQnAUrl.push(rowDataUrl)
                    }
                }
                // Craw QnA Url Array               
                let allPromiseArray = allQnAUrl.map(url => axios.get(url)); // or whatever
                axios.all(allPromiseArray).then(all => {
                    let finalData=[]
                    for (let i3 = 1; i3 < all.length; i3++) {
                        let $3 = cheerio.load(all[i3].data);
                        let question = $3("#content > div.box_w555 > p.tit02").text();
                        let answer = $3("#content > div.box_w555 > div.box02 > p").text();       
                        finalData.push({question:question,answer:answer})
                    }
                    // CREATE QnA xls file
                    var xls = json2xls(finalData);
                    fs.writeFileSync('QnA.xlsx', xls, 'binary');
                    console.log("Finish");                   
                    if(finalData.length>0)
                        resolve(finalData) ;                       
                    else
                        reject(new Error('No Data'))  
                })
            })
    })
});