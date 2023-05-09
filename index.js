const { exec } = require('child_process');
const { google } = require('googleapis');
const fs = require('fs');
const writeToDB = require('./db')

require('dotenv').config();

// Define the stream links
const streamLinks = [
    {station:'peace_fm',link: 'https://peacefm-atunwadigital.streamguys1.com/peacefm?listening-from-radio-garden=1683350919'},
    {station:'citi_fm',link:'https://citi973fm.radioca.st/;?listening-from-radio-garden=1683341725'},
    {station:'oyerepa_fm',link:'https://stream-051.zeno.fm/457dru9abnzuv?zs=3ago7epERPCwKFLaupowTg&listening-from-radio-garden=1683614724'},
    {station:'three_fm',link:'https://stream-050.zeno.fm/e5qwnn42u8quv?zs=CaK-2iFsTX6H8aPAfPECXQ&listening-from-radio-garden=1683611974'},
    {station:'asaase_fm',link:'https://n0d.radiojar.com/cyg76xcvp0hvv?listening-from-radio-garden=1683611720&rj-ttl=4&rj-tok=AAABh_9OC7wAxxNbCbf6tVWxBw'},
    {station:'onua_fm',link:'https://stream-049.zeno.fm/hmz5ma42u8quv?zs=JXBFbNleRPacrBIoCFcXNg&listening-from-radio-garden=1683613869'},
    {station:'kessben_fm',link:'https://kessben933fmkumasi-atunwadigital.streamguys1.com/kessben933fmkumasi?listening-from-radio-garden=1683602818'},
    {station:'peace_fm',link:'https://peacefm-atunwadigital.streamguys1.com/peacefm?listening-from-radio-garden=1683611294'},
    {station:'atl_fm',link:'https://atlfm.radioca.st/stream?listening-from-radio-garden=1683615371'},
    {station:'sikka_fm',link:'https://sikkafm-atunwadigital.streamguys1.com/sikkafm?listening-from-radio-garden=1683616762'},
];

// Configure Google Drive API
const credentials = require('./credentials.json'); // Path to your Google Drive API credentials file
const token = require('./token.json'); // Path to your Google Drive API token file

const client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});

const drive = google.drive({ version: 'v3', auth: client });

// Function to record streams
async function recordStreams() {
    for (let i = 0; i < streamLinks.length; i++) {
      const streamLink = streamLinks[i]['link'];
      const currentDate = new Date();
      let formattedDate = currentDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      formattedDate = formattedDate.replace(/\//g, '_'); // Replace forward slashes with underscores
      const startTime = currentDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const startTimeParts = startTime.split(':');
      const startHour = parseInt(startTimeParts[0]);
      const startMinute = parseInt(startTimeParts[1]);
      const startSecond = parseInt(startTimeParts[2]);
      
      const endTime = new Date();
      endTime.setHours(startHour);
      endTime.setMinutes(startMinute + 1); //estimate 1 minute endtime after start time 
      endTime.setSeconds(startSecond);
  
      const endTimeFormatted = endTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
  
  
      const fileName = `${streamLinks[i]['station']}_${formattedDate}_${startTime}_${endTimeFormatted}.mp3`;
  
      // Execute ffmpeg command             -q:a 2 for max audio quality 9 for lowest 
      const command = `ffmpeg -i "${streamLink}" -c:a libmp3lame -q:a 9 -t 60 "${fileName}"`;
      //const command = `ffmpeg -i "${streamLink}" -c:a libmp3lame -q:a 2 -t 60 "${fileName}"`;


      const child = exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error recording stream ${i + 1}: ${error}`);
        } else {
          console.log(`Stream ${i + 1} recorded successfully.`);
  
          // Upload file to Google Drive
          const fileMetadata = {
            name: fileName,
            //parents: ['<Google Drive Folder ID>'], // Replace with the ID of the destination folder in Google Drive
          };
          const media = {
            mimeType: 'audio/mpeg',
            body: fs.createReadStream(fileName),
          };
  
          console.log('uploading ...')
  
          try {
            const response = await drive.files.create({
              resource: fileMetadata,
              media: media,
              fields: 'id',
            });
  
            console.log(`File ${fileName} uploaded to Google Drive with ID: ${response.data.id}`);
  
            const fileId = response.data.id;
  
            // Set the permissions to make the file public
            await drive.permissions.create({
              fileId: fileId,
              requestBody: {
                role: 'reader',
                type: 'anyone',
              },
              supportsAllDrives: true,
            });

            writeToDB({'stationName':streamLinks[i]['station'], 'startTime':startTime, 'endTime': endTimeFormatted, 'link': `https://drive.google.com/uc?export=download&id=${fileId}`  })
          
            console.log('File uploaded and made public!');
  
            // Delete local file
            fs.unlinkSync(fileName);
            console.log(`Local file ${fileName} deleted.`);
          } catch (error) {
            console.error(`Error uploading file ${fileName} to Google Drive: ${error}`);
          }
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
