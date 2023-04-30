/**
 * @module ws
 */
import { WebSocketServer } from 'ws';

/**
 * @module twilio
 */
import twilio from 'twilio';

/**
 * @module ngrok
 */
import ngrok from '@ngrok/ngrok';

/**
 * @module TwilioMediaStreamSaveAudioFile
 */
import { TwilioMediaStreamSaveAudioFile } from "./TwilioMediaStreamSaveAudioFile.js";

/**
 * @module FeedWhisper
 */
import { FeedWhisper } from "./openai.js";

/**
 * @module fs
 */
import { createReadStream } from 'fs';

/**
 * @module app
 */

import Mailgun from 'mailgun-js';
import FormData from 'form-data';
import {promptGPT4} from "./mammoth.js";

// Global variable declarations
let clientSocket;

// Create a WebSocket server
let wss;

// Twilio credentials
const TEST_PHONE_SID = ''; // (218) 419-1978
const ACCOUNT_SID = '';
const AUTH_TOKEN = '';

// Initialize Twilio client
const Client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Create another WebSocket server
const wss2 = new WebSocketServer({ port: 1234 });

const mailgun = new Mailgun({
    apiKey: '',
    domain: '',
    formData: FormData,
});

/**
 * Initialize TwilioMediaStreamSaveAudioFile instance
 * @type {TwilioMediaStreamSaveAudioFile}
 */
const MEDIA_STREAM = new TwilioMediaStreamSaveAudioFile(async (filename) => {
    const transcript = await FeedWhisper(createReadStream(filename));
    if (parseInt(filename.slice(5)) % 2 === 1) {  // it's a name
        clientSocket.send(JSON.stringify({
            type: "name",
            name: transcript,
        }));
    } else {
        clientSocket.send(JSON.stringify({
            type: "transcript",
            transcript: transcript,
        }));
       await recordTranscript(transcript);
    }
});

/**
 * Log the transcript to the console
 * @param {string} transcript - The transcript to record
 */
async function recordTranscript(transcript) {
    const highlightCount = "3"
    const prompt = `Highlight the top ` + highlightCount + ` points of the following call transcript and place each in a p html tag:` + transcript["text"]
    const promptResponse = await promptGPT4(prompt, "skip")
    await sendEmail(promptResponse, transcript)
}

function buildHTML(topPointsHTML){
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Morgan & Morgan Transcript Summary</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
        }

        .container {
            width: 80%;
            margin: auto;
            padding: 2rem;
            background-color: #f4f4f4;
            border-radius: 5px;
        }

        .logo {
            display: block;
            width: 250px;
            margin: 0 auto;
            margin-bottom: 2rem;
        }

        h1, h3 {
            font-size: 1.5rem;
            color: #444;
            text-align: center;
            margin-bottom: 1rem;
        }

        p {
            margin-bottom: 1rem;
        }

        .summary {
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .footer {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://www.forthepeople.com/sites/default/files/theme-assets/ftp/images/logo-black-and-yellow.svg" alt="Morgan & Morgan Logo" class="logo">
        <h1>Transcript Summary</h1>

        <p class="summary">Key Topics Discussed:</p>
        ` + topPointsHTML + `
    
        <p>For the full transcript and more details about the meeting, please refer to the attached document.</p>

        <p>Best Regards,</p>
        <p>Morgan & Morgan</p>

        <div class="footer">
            Morgan & Morgan | 20 N Orange Ave Suite 1600, Orlando, FL 32801 |  (407) 420-1414 | www.morganandmorgan.com
        </div>
    </div>
</body>
</html>
    `
}

async function sendEmail(topPointsHTML, transcript){
    const ingestHTML = buildHTML(topPointsHTML)
    const emailData = {
        from: 'Mailgun Sandbox <postmaster@sandbox5bbfeed88d71486a90c2d8eac12ece7a.mailgun.org>',
        to: 'rob@casel.ink',
        subject: 'Thanks for trusting in CaseLink!',
        html: ingestHTML,
        attachment: [
            {
                data: transcript,
                filename: 'transcript.txt',
                contentType: 'text/plain',
            },
        ],
    };

    mailgun.messages().send(emailData, (error, body) => {
        if (error) {
        } else {
            console.log('Message sent:', body);
        }
    });
}

/**
 * Update Twilio internal voice URL
 * @param {string} voiceURL - The voice URL to update
 */
function updateTwilioInternalVoiceURL(voiceURL) {
    Client.incomingPhoneNumbers(TEST_PHONE_SID)
        .update({
            voiceUrl: voiceURL,
        })
        .then((number) => {
            console.log('Phone number updated successfully:', number.voiceUrl);
        })
        .catch((err) => {
            console.error('Error updating phone number:', err);
        });
}

/**
 * Retrieve the caller's phone number by call SID
 * @param {string} sid - The call SID to search for
 * @return {Promise<string|null>} The caller's phone number or null if not found
 */
function retrieveCallerNumber(sid) {
    return Client.calls.list({ limit: 2 })
        .then(calls => {
            const call = calls.find(c => c.sid === sid);
            if (call) {
                return call.fromFormatted;
            } else {
                return null
            }
        });
}

/**
 * Initialize Twilio and connect to ngrok
 * @function
 * @return {Promise<void>}
 */
export async function InitializeTwilio(server) {
    ngrok.connect({ addr: 8082, authtoken_from_env: true }).then((url) => {
        updateTwilioInternalVoiceURL(url+"/call");
    })
    wss = new WebSocketServer({ server });

    wss.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    wss2.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    /**
     * Connection event listener for WebSocket server wss
     * @event
     * @param {WebSocket} ws - The WebSocket instance
     */
    wss.on("connection", (ws) => {
        let sid, isDone;

        // Set the WebSocket instance for MEDIA_STREAM
        MEDIA_STREAM.setWebsocket(ws);

        /**
         * Message event listener for WebSocket
         * @event
         * @param {string} message - The received message data
         */
        ws.on("message", async (message) => {
            const msg = JSON.parse(message);
            switch (msg.event) {
                case "start":
                    sid = msg.start.callSid;
                    MEDIA_STREAM.twilioStreamStart();
                    break;
                case "media":
                    MEDIA_STREAM.twilioStreamMedia(msg.media.payload);
                    !isDone && (isDone = true) && retrieveCallerNumber(sid)
                        .then(fromNumber => {
                             if(clientSocket){
                                 clientSocket.send(JSON.stringify({
                                     type: "newphonecall",
                                     phone: fromNumber,
                                 }));
                             } else {
                                 console.log("Frontend Not Connected")
                             }
                        });
                    break;
                case "stop":
                    MEDIA_STREAM.twilioStreamStop();
                    break;
                default:
                    break;
            }
        });
    });

    /**
     * Connection event listener for WebSocket server wss2
     * @event
     * @param {WebSocket} ws - The WebSocket instance
     */
    wss2.on('connection', (ws) => {
        clientSocket = ws;

        /**
         * Error event listener for WebSocket
         * @event
         * @param {Error} error - The error object
         */
        ws.on('error', console.error);

        /**
         * Message event listener for WebSocket
         * @event
         * @param {string} data - The received message data
         */
        ws.on('message', function message(data) {
            console.log('received: %s', data);
        });

    });
}



