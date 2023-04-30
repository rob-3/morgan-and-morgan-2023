import sqlite3 from 'sqlite3';
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new sqlite3.Database(path.resolve(__dirname, 'mydb.sqlite'))

function createdb() {
    db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY, 
    name TEXT, 
    phone TEXT
    )`, function(err) {
        if (err) {
            console.log('Error creating table:', err.message);
        } else {
            console.log('Table created successfully');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS Documents (
    id INTEGER PRIMARY KEY, 
    filename TEXT, 
    summary TEXT, 
    clientid INTEGER
    )`, function(err) {
        if (err) {
            console.log('Error creating table:', err.message);
        } else {
            console.log('Table created successfully');
        }
    });
}

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
        db.run('INSERT INTO Documents (filename, summary, clientId) VALUES (?, ?, ?)', [document.filename, document.summary, document.clientId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

export function insertSummary(clientid) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO summaries (summary, id) VALUES (?, ?)', [user.summary, clientid], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

//read region
export function queryClients(name, phone) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM clients WHERE name = ? OR phone = ?`, [name, phone], function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

//this grabs all relevant documents for a client
export function queryDocuments(clientid) {
    return new Promise((resolve, reject) => {
        db.all(`
                SELECT * FROM Documents WHERE clientid = ?`, [clientid], function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export function queryByFilename(filename) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM Documents WHERE filename = ?`, [filename], function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export function queryBySummary(summary) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM Documents WHERE summary LIKE '%' || ? || '%';`, [summary], function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export function queryByPhone(phone) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM clients WHERE phone = ? `, [phone], function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export function queryByName(name) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM clients WHERE name = ? `, [name], function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


export function getSummariesByClientId(clientId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT summary FROM Documents WHERE clientid = ?';
        db.all(query, [clientId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
