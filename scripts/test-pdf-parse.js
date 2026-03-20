const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const file = path.join(process.cwd(), '../upscpyq/CSP-17-GS_PAPER-1-C.pdf');

let dataBuffer = fs.readFileSync(file);

pdf(dataBuffer).then(function(data) {
    console.log("Number of pages:", data.numpages);
    console.log("Text Snippet:\n", data.text.substring(0, 1000));
}).catch(err => {
    console.error(err);
});
