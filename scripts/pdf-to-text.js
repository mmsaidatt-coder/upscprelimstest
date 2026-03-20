const fs = require('fs');
const PDFParser = require("pdf2json");
const path = require('path');

const pdfsDir = "/Users/mani/Desktop/upscpyq/misssingyears'spapers";
const outputDir = path.join(process.cwd(), 'data', 'raw_text');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));

async function processAll() {
    for (const file of files) {
        console.log(`Extracting text from: ${file}`);
        const pdfParser = new PDFParser(this, 1);
        
        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const textPath = path.join(outputDir, file.replace('.pdf', '.txt'));
             fs.writeFileSync(textPath, pdfParser.getRawTextContent().replace(/\r\n/g, '\n'));
             console.log(`✅ Saved text to ${textPath}`);
        });

        pdfParser.loadPDF(path.join(pdfsDir, file));
    }
}

processAll();
