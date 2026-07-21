var PdfPrinter = require('pdfmake');
var fs = require("fs");
const fonts = require('./fonts/index.js');
const axios = require('axios');

class PdfMaker {
    constructor({ filepath, customMailSilah }) {
        this.fonts = fonts;
        this.font = customMailSilah ? 'Tajawal' : 'Roboto';
        this.filepath = filepath;
        this.docDefinition = {};
        this.docDefinition.pageOrientation = 'landscape';
        this.docDefinition.header = {};
        this.docDefinition.header.columns = [];
        this.docDefinition.content = [];
    }

    createPdfDoc() {
        this.printer = new PdfPrinter(this.fonts);
        return this;
    }
    setFont(language = 'en') {
        if (language == 'ar') this.font = 'Tajawal';
        return this;
    }

    setTableHeaders(headerObj) {
        this.tableHeaders = [];
        this.tableHeadersOrder = [];
        for (let i = 0; i < headerObj.length; i++) {
            this.tableHeaders.push(headerObj[i].title);
            this.tableHeadersOrder.push(headerObj[i].id);
        }
        return this;
    }

    setTableBody(bodyObj) {
        const columnCount = this.tableHeaders.length;
        let tableFontSize = 10;
        if (columnCount < 7) tableFontSize = 10;
        else if (columnCount < 13) tableFontSize = 6.5;
        else if (columnCount < 18) tableFontSize = 5;
        else tableFontSize = 3.8; // even smaller for many columns

        // Use percentage widths to fit all columns in page width
        let tableWidths;
        if (columnCount > 10) {
            // Distribute 100% width among all columns
            const percent = (100 / columnCount).toFixed(2) + '%';
            tableWidths = this.tableHeaders.map(() => percent);
        } else {
            tableWidths = this.tableHeaders.map(() => '*');
        }

        this.docDefinition.content.push({
            font: this.font,
            fontSize: tableFontSize,
            style: 'tableStyle',
            table: {
                headerRows: 1,
                widths: tableWidths,
                body: this.getTableBody(bodyObj)
            },
            layout: {
                hLineWidth: () => 0.3,
                vLineWidth: () => 0.3,
                paddingLeft: () => 1,
                paddingRight: () => 1,
                paddingTop: () => 1,
                paddingBottom: () => 1
            }
        });

        this.docDefinition.styles = {
            tableStyle: {
                margin: [0, 0, 0, 0]
            },
            cellStyle: {
                fontSize: tableFontSize,
                alignment: 'left',
                noWrap: false,
                valign: 'middle'
            }
        };

        return this;
    }

    async setBarChart(imgPath) {
        const logoBase64Image = await this.getBase64Image(imgPath)
        this.docDefinition.content.push({
            alignment: 'center',
            image: logoBase64Image,
            fit: [400, 400],
        })
        return this
    }

    setAppDomainList(pdfAppDomainList) {
       
        let max = Math.max(...(pdfAppDomainList.map(el => Math.max(...(el.map(val => val.length))))));
       
        let fontsize = 0;
        if (max < 25) {
            fontsize = 7.5
        } else{
            fontsize = 6.3
        }
        this.docDefinition.content.push({
            fontSize: fontsize,
            style: 'tableStyle',
            bold: true,
            layout:'noBorders',
            table: {
                widths: Array(5).fill('*'),
                body: pdfAppDomainList
            }
        });
    }

    async end() {
        var pdfDoc = this.printer.createPdfKitDocument(this.docDefinition);
        // Writing it to disk
        let writeStream = fs.createWriteStream(this.filepath);

        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        // to prevent write race condition
        await new Promise(resolve => {
            writeStream.on('close', function () {
                resolve();
            });
        });

        return this.filepath;
    }
    getTableBody(bodyObj) {
        let resultArr = [];
        for (let i = 0; i < bodyObj.length; i++) {
            const tableRow = bodyObj[i];
            const arrValueInTableHeaderOrder = [];
            for (let j = 0; j < this.tableHeadersOrder.length; j++) {
                arrValueInTableHeaderOrder.push(tableRow[this.tableHeadersOrder[j]] || '')
            }
            resultArr.push(arrValueInTableHeaderOrder);
        }

        //adding table header at the top
        resultArr.unshift(this.tableHeaders);
        return resultArr;
    }

    async setLogo(imgUrl) {
        const logoBase64 = await this.getBase64ImageFromURL(imgUrl)
        this.docDefinition.pageMargins = [40, 60, 40, 40];
        this.docDefinition.header.columns[1] = {
            image: logoBase64,
            fit: [150, 150],
            alignment: 'right',
            margin: [0, 20, 20, 0]
        }
    }

    async getBase64ImageFromURL(url) {
        let image = await axios.get(url, { responseType: 'arraybuffer' });
        let raw = Buffer.from(image.data).toString('base64');
        return "data:" + image.headers["content-type"] + ";base64," + raw;
    }

    async getBase64Image(img) {
        let pngRaw = fs.readFileSync(img).toString('base64');
        return "data:image/png;base64," + pngRaw;
    }

    setDocDetails(details) {
        this.docDefinition.header.columns[0] = {
            font: this.font,
            margin: [30, 20],
            type: 'none',
            ol: details
        }
        return this;
    }

}

module.exports.PdfMaker = PdfMaker;