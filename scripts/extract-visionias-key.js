const fs = require('fs');
const pdfParse = require('pdf-parse');

async function main() {
    const filePath = '/Users/mani/Desktop/upscpyq/VisionIAS - UPSC CSAT Question Paper 2025 with Answer Key.pdf';
    console.log("Reading PDF:", filePath);
    if (!fs.existsSync(filePath)) {
        console.error("File does not exist!");
        return;
    }
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdfParse(dataBuffer);
        const text = data.text;
        
        fs.writeFileSync('data/visionias-key-text.txt', text);
        console.log("Text extracted to data/visionias-key-text.txt (length: " + text.length + ")");
        
        // Print first 1000 and last 1000 characters to get a sense of the structure
        console.log("--- START ---");
        console.log(text.substring(0, 1000));
        console.log("--- END ---");
        console.log(text.substring(text.length - 1500));
    } catch (e) {
        console.error("Error parsing PDF:", e);
    }
}

main();
