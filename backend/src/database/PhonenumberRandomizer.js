import sqlite3 from 'sqlite3';
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);
const db = new sqlite3.Database(path.resolve(__dirname, 'mydb.sqlite'))


db.run(`UPDATE Documents SET link = 'https://forthepeople0-my.sharepoint.com/:w:/r/personal/pblair_forthepeople_com/_layouts/15/Doc.aspx?sourcedoc=%7BD06C8E51-D0B5-4CED-94B2-3EF6F2DF271C%7D&file=Litigation%20Checklist.docx&action=default&mobileredirect=true' WHERE id = 51 ;`, function(err) {
    if (err) {
        console.log('Error updating table:', err.message);
    } else {
        console.log('Table updated successfully');
    }
});