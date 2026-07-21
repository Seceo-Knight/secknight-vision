const path = require('path')
const fs = require('fs');
const moment = require('moment')
class AutoEmailChart {

  secondsConvert (durationInSeconds){
    const durationInDays = Math.floor(durationInSeconds / (24 * 60 * 60));
    const durationInHours = moment.duration(durationInSeconds, 'seconds').subtract(moment.duration(durationInDays, 'days')).asHours();
    const durationFormatted = `${durationInDays}d ${moment().startOf('day').seconds(durationInHours * 3600).format('HH:mm:ss')} hr`;
    return durationFormatted;
    };
    
async createBarChart(charts, htmlFileName, list, startDate, endDate, Name = 'Application', orgData) {

    let data = charts.chart1.name.map((name, index) => {
      return { counter: index, name: name, duration: charts.chart1.duration[index], durationText: this.secondsConvert(charts.chart1.duration[index])};
    });

    let data2 = charts.chart2.name.map((name, index) => {
      return { counter: index, name: name, duration: charts.chart2.duration[index], durationText: this.secondsConvert(charts.chart2.duration[index])};
    });

    const dir = 'graphs';
    const publicPath = path.join(__dirname.split('src')[0], 'public', dir);

    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath);
    }

    const publicFolderPath = path.join(publicPath +`/${htmlFileName}`);

    let htmlContext = `<!DOCTYPE html>
        <html>
        <head>
        </head>
        <body>
          <!-- Styles -->
          <style>

            canvas {
              border: 4px solid #FFA500;
              background-color: #FDE7E8;
            }

              #chartdiv {
                background-color: #F5F5F5;
                padding: 20px;
                border: 2px solid #999999;
                border-radius: 10px;
                width: 800px;
                height: 400px;
                margin: 0 auto;         
                
              }
              #chartdiv2 {
                background-color: #F5F5F5;
                padding: 20px;
                border: 2px solid #999999;
                border-radius: 10px;
                width: 800px;
                height: 400px;
                margin: 0 auto;         
                
              }
              td {
                text-align: left;
                padding: 10px;
              }
            
              .whole-wrapper {
                max-width: 850px;
                width: 100%;
                margin: auto;
              }

              .whole-wrapper .heading-div {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 11px;
              }

              .whole-wrapper .heading-div>h2 {
                margin: 0;
              }

              .whole-wrapper .heading-div img {
                max-width: 166px;
              }

              .whole-wrapper .heading-div+h5 {
                margin: 11px auto 17px;
              }
          </style>
          </head>   
          <body> 
            <div class="whole-wrapper">
              <div class="heading-div">
                <h2 align="center"> ${Name} Used </h2>
                <img src="${orgData?.resellerData?.logo || 'https://app.empmonitor.com/assets/images/logos/323176aaf7bb6da5259e901f3b81bdcc.png'}" />
              </div>
              <h4 align="left">${startDate} To ${endDate} </h4>
              <h5 align="left"> Top ${Name} Usage Data </h5>
              <div id="chartdiv">
              <canvas id="chartdiv"></canvas>
            </div>
          <div id="top-web-usage-names">
          <table align="center" style="border-collapse: collapse;">
                <tr>
                ${list[0]?.slice(0, 5)?.map(domain => `
                  <td>${domain}</td>
                `)?.join('')}
              </tr>
              <tr>
                ${list[0]?.slice(5)?.map(domain => `
                  <td>${domain}</td>
                `)?.join('')}
              </tr>
            </table>
          </div>
          <br><br>
          <h5> Least ${Name} Usage Data </h5>
          <div id="chartdiv2">
          <canvas id="chartdiv2"></canvas>
        </div> 
        <div id="least-web-usage-names">
          <table align="center" style="border-collapse: collapse;">
                <tr>
                ${list[1]?.slice(0, 5)?.map(domain => `
                  <td>${domain}</td>
                `)?.join('')}
              </tr>
              <tr>
                ${list[1]?.slice(5)?.map(domain => `
                  <td>${domain}</td>
                `)?.join('')}
              </tr>
            </table>
          </div>
        </div>

        <script src="https://cdn.amcharts.com/lib/4/core.js"></script>
        <script src="https://cdn.amcharts.com/lib/4/themes/animated.js"></script>
        <script src="https://cdn.amcharts.com/lib/4/charts.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment-with-locales.min.js"
            integrity="sha512-42PE0rd+wZ2hNXftlM78BSehIGzezNeQuzihiBCvUEB3CVxHvsShF86wBWwQORNxNINlBPuq7rG4WWhNiTVHFg=="
            crossorigin="anonymous" referrerpolicy="no-referrer"></script>

        <script>
          am4core.ready(function () {

            // Themes begin
            am4core.useTheme(am4themes_animated);
            // Themes end

            var chart = am4core.create("chartdiv", am4charts.XYChart);
            
            chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
            chart.logo.disabled = true;
      
            chart.data = ${JSON.stringify(data)};

            var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
            categoryAxis.renderer.grid.template.location = 0;
            categoryAxis.dataFields.category = "counter";

            categoryAxis.renderer.minGridDistance = 40;
            categoryAxis.fontSize = 11;


            let valueAxis = chart.yAxes.push(new am4charts.DurationAxis());
            valueAxis.baseUnit = "second";
            valueAxis.title.text = "Time Duration"

            var series = chart.series.push(new am4charts.ColumnSeries());
            series.name = "Duration",
            series.dataFields.valueY = "duration";
            series.dataFields.title = "durationText";
            series.dataFields.categoryX = "counter";
            series.sequencedInterpolation = true;
            series.stroke = am4core.color("#26c36c");
            series.fill = am4core.color("#26c36c");

            series.tooltip.getFillFromObject = false;
            series.tooltip.label.fill = am4core.color("#000");

            series.columns.template.tooltipText ="{categoryX}: [b]{valueY}[/]";
            series.columns.template.tooltipY = 0;
            series.columns.template.strokeOpacity = 0;

            let toolTipText = "[bold]{name}[/]\\n";
            chart.series.each(function (item) {
              if (item.name !== "") {
                toolTipText += "[" + item.stroke.hex + "]●[/] " + item.name + ": {" + item.dataFields.title + "}";
              }
            });

            series.columns.template.tooltipText = toolTipText

          });
        </script>
        <script>
        am4core.ready(function () {

          // Themes begin
          am4core.useTheme(am4themes_animated);
          // Themes end

          var chart = am4core.create("chartdiv2", am4charts.XYChart);
          
          chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
          chart.logo.disabled = true;
    
          chart.data = ${JSON.stringify(data2)};

          var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
          categoryAxis.renderer.grid.template.location = 0;
          categoryAxis.dataFields.category = "counter";

          categoryAxis.renderer.minGridDistance = 40;
          categoryAxis.fontSize = 11;


          let valueAxis = chart.yAxes.push(new am4charts.DurationAxis());
          valueAxis.baseUnit = "second";
          valueAxis.title.text = "Time Duration"

          var series = chart.series.push(new am4charts.ColumnSeries());
          series.name = "Duration",
          series.dataFields.valueY = "duration";
          series.dataFields.title = "durationText";
          series.dataFields.categoryX = "counter";
          series.sequencedInterpolation = true;
          series.stroke = am4core.color("#26c36c");
          series.fill = am4core.color("#26c36c");

          series.tooltip.getFillFromObject = false;
          series.tooltip.label.fill = am4core.color("#000");

          series.columns.template.tooltipText ="{categoryX}: [b]{valueY}[/]";
          series.columns.template.tooltipY = 0;
          series.columns.template.strokeOpacity = 0;

          let toolTipText = "[bold]{name}[/]\\n";
          chart.series.each(function (item) {
            if (item.name !== "") {
              toolTipText += "[" + item.stroke.hex + "]●[/] " + item.name + ": {" + item.dataFields.title + "}";
            }
          });

          series.columns.template.tooltipText = toolTipText

        });
      </script>
  <!-- HTML -->
  </body>
</html>`

    htmlContext = htmlContext.replace(/undefined/g, '');
    fs.writeFileSync(`${publicFolderPath}`, htmlContext, function (err) {
      if (err)
        throw err;
      console.log('File is created successfully.');
    });
    return publicFolderPath;
  }

}
module.exports = new AutoEmailChart;

