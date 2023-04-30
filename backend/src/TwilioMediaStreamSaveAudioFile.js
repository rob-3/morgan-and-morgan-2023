import { createWriteStream, open, write } from 'fs';
import { Readable } from 'stream';

export class TwilioMediaStreamSaveAudioFile {
    constructor(onFinishedCallback) {
        this.buffer = [];
        this.saveLocation = process.cwd();
        this.saveFilename = "audio";
        this.onSaved = null;
        this.websocket = null;
        this.i = 0;
        this.onFinishedCallback = onFinishedCallback;
        this.once = false;
    }

    get filename() {
        this.i++;
        return `${this.saveFilename}${this.i}.wav`;
    }

    get writeStreamPath() {
        return `${this.saveLocation}/${this.filename}`;
    }

    get audioBuffer() {
        return this.buffer;
    }

    setWebsocket(websocket) {
        this.websocket = websocket;
    }

    twilioStreamStart() {
        !this.isDone && setTimeout(() => {
            const oldStream = this.websocket.wstream;
            this.isDone = true;
            this.twilioStreamStart();
            oldStream.write("", () => {
                open(oldStream.path, "r+", (err, fd) => {
                    let count = oldStream.bytesWritten;
                    count -= 58;
                    write(
                        fd,
                        Buffer.from([
                            count % 256,
                            (count >> 8) % 256,
                            (count >> 16) % 256,
                            (count >> 24) % 256,
                        ]),
                        0,
                        4, // Write 4 bytes
                        54, // starts writing at byte 54 in the file
                        () => this.onFinishedCallback(`audio1.wav`)
                    );
                    //this.pushToStreamBuffer()
                    //if (this.onSaved) {
                    //    this.onSaved();
                    //}
                });
            })
        }, 6000);
        this.websocket.wstream = createWriteStream(this.writeStreamPath, {
            encoding: "binary",
        });
        this.websocket.wstream.write(
            Buffer.from([
                0x52,
                0x49,
                0x46,
                0x46,
                0x62,
                0xb8,
                0x00,
                0x00,
                0x57,
                0x41,
                0x56,
                0x45,
                0x66,
                0x6d,
                0x74,
                0x20,
                0x12,
                0x00,
                0x00,
                0x00,
                0x07,
                0x00,
                0x01,
                0x00,
                0x40,
                0x1f,
                0x00,
                0x00,
                0x80,
                0x3e,
                0x00,
                0x00,
                0x02,
                0x00,
                0x04,
                0x00,
                0x00,
                0x00,
                0x66,
                0x61,
                0x63,
                0x74,
                0x04,
                0x00,
                0x00,
                0x00,
                0xc5,
                0x5b,
                0x00,
                0x00,
                0x64,
                0x61,
                0x74,
                0x61,
                0x00,
                0x00,
                0x00,
                0x00, // Those last 4 bytes are the data length
            ])
        );
    }

    pushToStreamBuffer() {
        const count = this.websocket.wstream.bytesWritten - 58;
        this.buffer.push(Buffer.from([
            count % 256,
            (count >> 8) % 256,
            (count >> 16) % 256,
            (count >> 24) % 256,
        ]))
    }

    twilioStreamMedia(mediaPayload) {
        // decode the base64-encoded data and write to stream
        this.websocket.wstream.write(Buffer.from(mediaPayload, "base64"));
        this.pushToStreamBuffer();
    }

    clearBuffer() {
        this.buffer = [];
    }

    getBufferStream() {
        console.log(Buffer.concat(this.buffer))
        return Readable.from(Buffer.concat(this.buffer));
    }

    twilioStreamStop() {
        // Now the only thing missing is to write the number of data bytes in the header
        this.websocket.wstream.write("", () => {
            open(this.websocket.wstream.path, "r+", (err, fd) => {
                let count = this.websocket.wstream.bytesWritten;
                count -= 58;
                write(
                    fd,
                    Buffer.from([
                        count % 256,
                        (count >> 8) % 256,
                        (count >> 16) % 256,
                        (count >> 24) % 256,
                    ]),
                    0,
                    4, // Write 4 bytes
                    54, // starts writing at byte 54 in the file
                    () => this.onFinishedCallback(`audio2.wav`)
                );
                //this.pushToStreamBuffer()
                //if (this.onSaved) {
                //    this.onSaved();
                //}
            });
        })
    }
}
