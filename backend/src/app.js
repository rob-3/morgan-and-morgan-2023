import express, * as bodyParser from 'express';
import cors from 'cors';
import {
    queryByName,
    queryByPhone,
    queryClients,
    queryDocuments,
    queryBySummary,
    getSummariesByClientId
} from './database/db.js';
import { InitializeTwilio } from "./twilio.js";

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * @module twilio
 */
import twilio from 'twilio';

/**
 * @module http
 */
import { createServer } from 'http';
import {promptGPT4} from "./mammoth.js";

const app = express()
const server = createServer(app)
const port = 8081

app.use(cors());
app.use(bodyParser.json());

app.post("/call", (req, res) => {
    const response = new VoiceResponse();
    response.start().stream({ url: `wss://${req.headers.host}/` });
    response.say('Welcome to Morgan and Morgan, please say your first and last name to get started');
    response.pause({ length: 180 });
    res.set('Content-Type', 'text/xml');
    res.send(response.toString());
});

app.get('/summary/user', async(req, res) => {
    const data = await getSummariesByClientId(req.body["userid"])
    const summaryStrings = data.map(summaryObject => summaryObject.summary);
    const joinedSummaries = summaryStrings.join(', ');
    const prompt = "Make a combined summary from the summaries: " + joinedSummaries
    const promptResponse = await promptGPT4(prompt, "low")
    res.send(promptResponse)
})



app.post('/client/findByPhoneNumber', async(req, res) => {
    const phoneNumber = req.body["phone_number"]
    if (phoneNumber === undefined || phoneNumber === "") {
        return res.status(500).send("no number")
    }
    const data = await queryByPhone(phoneNumber)
    return res.send(data)

})

app.post('/client/findByName', async(req, res) => {
    console.log(req.body)
    const clientName = req.body["name"]

    if (clientName === undefined || clientName === "") {
        return res.status(500).send("no name given")
    }
    const data = await queryByName(clientName)
    return res.send(data)
})

app.post('/client/getClientData', async(req, res) => {
    const clientName = req.body["name"]
    const phoneNumber = req.body["phone_number"]
    if (clientName === undefined && phoneNumber === undefined) {
        return res.status(500).send("no name or phone number given")
    }
    try {
        let data = await getClientData(clientName, phoneNumber);
        return res.send(data);
    } catch (err) {
        return res.status(500).send(err)
    }

})

app.post('/client/queryBySummary', async(req, res) => {
    const summary = req.body["search"]
    if (summary === undefined || summary === "") {
        return res.status(500).send("no summary given")
    }
    try {
        const data = await queryBySummary(summary)
        return res.send(data)
    } catch (err) {
        return res.status(500).send(err)
    }
})


app.listen(port, async() => {
    await InitializeTwilio(server)
    console.log("API Started")
    server.listen(8082)
})

async function wrapperQueryClient(name, phone) {
    try {
        let rows = await queryClients(name, phone);
        if (rows.length !== 0) {
            return rows
        }
    } catch (err) {
        return err
    }
}
async function wrapperQueryDoc(clientid) {
    try {
        let rows = await queryDocuments(clientid);
        if (rows.length !== 0) {
            return rows
        }
    } catch (err) {
        return err
    }
}

async function getClientData(name, phone) {
    let data = null;

    if (name !== null) {
        data = await queryByName(name);
    } else if (phone !== null) {
        data = await queryByPhone(phone);
    } else {
        try {
            data = await wrapperQueryClient(name, phone);
        } catch (err) {
            return err;
        }
    }

    if (data !== null && data.length !== 0) {
        const clientId = data[0].id;
        const docs = await wrapperQueryDoc(clientId);

        if (docs.length !== 0) {
            return {
                client: data[0],
                documents: docs,
            };
        }
    }
}


/*
async function wrapperPhoneInsert() {
    if (phone === NULL) {
        await queryByName(name).then((rows) => {
            if (rows.length !== 0) {
                phone = rows[0].phone;
            }
        })
        if (phone !== NULL) {
            await insertUser(name, phone);
            name = `null`;
            phone = `null`;
        }
    } else {
        await insertUser(name, phone);
        name = `null`;
        phone = `null`;
    }
}

async function wrapperNameInsert() {

}
if (name === NULL) {
    await queryByPhone(phone).then((rows) => {
        if (rows.length !== 0) {
            name = rows[0].name;
        }
        // if this fails it will still be null right?
    })
    if (name !== NULL) {
        await insertUser(name, phone);
        name = `null`;
        phone = `null`;
    }
} else {
    await insertUser(name, phone);
    name = `null`;
    phone = `null`;
}
*/
