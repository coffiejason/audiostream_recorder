const { exec } = require('child_process');

// Define the stream links
const streamLinks = [
  'https://peacefm-atunwadigital.streamguys1.com/peacefm?listening-from-radio-garden=1683350919',
  'https://citi973fm.radioca.st/;?listening-from-radio-garden=1683341725'
];

// Function to record streams
function recordStreams() {
  for (let i = 0; i < streamLinks.length; i++) {
    const streamLink = streamLinks[i];
    const fileName = `stream_${i + 1}.mp3`;

    // Execute ffmpeg command
    const command = `ffmpeg -i "${streamLink}" -c:a libmp3lame -q:a 2 -t 60 "${fileName}"`;
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error recording stream ${i + 1}: ${error}`);
      } else {
        console.log(`Stream ${i + 1} recorded successfully.`);
      }
    });

    // Log ffmpeg output
    child.stdout.on('data', (data) => {
      console.log(`ffmpeg output (Stream ${i + 1}): ${data}`);
    });

    // Log ffmpeg error output
    child.stderr.on('data', (data) => {
      console.error(`ffmpeg error (Stream ${i + 1}): ${data}`);
    });
  }
}

// Record streams every 1 minute
setInterval(recordStreams, 60 * 1000);
