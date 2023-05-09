const fs = require('fs');
const path = require('path');

// Create a write stream to the log file
const logStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// Create a custom logger function
function logger(...args) {
  // Log to the console
  console.log(...args);

  // Log to the file
  logStream.write(`${new Date().toISOString()}: ${args.join(' ')}\n`);
}

module.exports = logger

