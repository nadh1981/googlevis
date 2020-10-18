const express = require('express');
const fs = require("fs");
const util = require("util");
const mime = require("mime");
const multer = require("multer");
const app = express();

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
// Simple upload form
var form = '<!DOCTYPE HTML><html><body>' +
  "<form method='post' action='/upload' enctype='multipart/form-data'>" +
  "<input type='file' name='image'/>" +
  "<input type='submit' /></form>" +
  '</body></html>';

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
 
var upload = multer({ storage: storage })

app.get('/', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.end(form);
});

// Get the uploaded image
// Image is uploaded to req.file.path
app.post('/upload', upload.single('image'), async function(req, res, next) {
	console.log(req.file.path)
	try{
	const [result] = await client.textDetection(req.file.path);
	const detections = result.textAnnotations;
	res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.write('<!DOCTYPE HTML><html><body>');

      // Base64 the image so we can display it on the page
      res.write('<img width=200 src="' + base64Image(req.file.path) + '"><br>');

      // Write out the JSON output of the Vision API
      res.write("<p>");
      try {
      	console.log(detections[0].description)
      res.write(detections[0].description.toString('utf8'));
  		} catch (e) {console.log(e)}
      res.write("</p>");
      res.write(JSON.stringify(detections, null, 4));

      // Delete file (optional)
      fs.unlinkSync(req.file.path);

      res.end('</body></html>');
  	}	catch (e) {
  		console.log(e)
  	}
});

app.listen(3001);
console.log('Server Started');

// Turn image into Base64 so we can display it easily

function base64Image(src) {
  var data = fs.readFileSync(src).toString('base64');
  return util.format('data:%s;base64,%s', mime.lookup(src), data);
}
