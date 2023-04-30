import { readFileSync } from "fs";
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('mydb.sqlite');

//user is an object with name and phone properties
export function insertUser(user) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO clients (name, phone) VALUES (?, ?)', [user.name, user.phone], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

export function insertDoc(document) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO Documents (filename, summary, clientid) VALUES (?, ?, ?)', [document.filename, document.summary, document.clientid], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

const json = readFileSync('output.json').toString();

const data = JSON.parse(json);

const a = {};

for (const d of data) {
  const { clientName, ...rest } = d;
  if (!Array.isArray(a[clientName])) {
    a[clientName] = [];
  }
  a[clientName].push(rest);
}

for (const [name, data] of Object.entries(a)) {
  const clientId = await insertUser({ name, phone: "1234567890" });
  for (const document of data) {
    db.run('INSERT INTO Documents (filename, summary, clientid) VALUES (?, ?, ?)', [document.filename, document.summary, clientId]);
  }
}
