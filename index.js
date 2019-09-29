const puppeteer = require('puppeteer');
const fs = require('fs');
const ChartjsNode = require('chartjs-node');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.tracing.start({path: 'trace.json'});
  await page.goto('https://google.com');
  await page.tracing.stop();
  await page.screenshot({path: 'google.png'});

  await browser.close();
})();

fstr = fs.readFileSync('trace.json', 'utf8')
trace = JSON.parse(fstr);

res={};

trace.traceEvents.forEach(element => {
    if (element.name == "ResourceSendRequest") {
        var timingObj = {"start":element}
        res[element.args.data.requestId] = timingObj
    }
    if (element.name == "ResourceFinish") {
        timingObj = res[element.args.data.requestId]
        timingObj["end"] = element
    }
});


var config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Durations',
            backgroundColor: '#FFFFFF',
            borderColor: '#FF0000',
            data: [],
            fill: false,
        }]
    },
    options: {
        plugins: {},
        scales: {
            xAxes: [{
                ticks: {
                    autoSkip: false,
                    maxRotation: 90,
                    minRotation: 90
                }
            },
            ]
        }
    }
};

console.log(res)

for (var key in res) {
    config.data.labels.push(res[key]["start"].args.data.url)
    startts = res[key]["start"].ts
    endts = startts
    if (res[key]["end"]) {
        endts = res[key]["end"].ts
    }
    config.data.datasets[0].data.push( endts - startts  )
}


// 600x600 canvas size
var chartNode = new ChartjsNode(600, 600);
return chartNode.drawChart(config)
.then(() => {
    // chart is created
 
    // get image as png buffer
    return chartNode.getImageBuffer('image/png');
})
.then(buffer => {
    Array.isArray(buffer) // => true
    // as a stream
    return chartNode.getImageStream('image/png');
})
.then(streamResult => {
    // using the length property you can do things like
    // directly upload the image to s3 by using the
    // stream and length properties
    streamResult.stream // => Stream object
    streamResult.length // => Integer length of stream
    // write to a file
    return chartNode.writeImageToFile('image/png', './chart.png');
})
.then(() => {
    // chart is now written to the file path
    // ./testimage.png
    
    //chartNode.destroy();
});