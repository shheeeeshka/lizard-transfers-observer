import { google } from "googleapis";
import { config } from "dotenv";
import axios from "axios";

config();

const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const client = await auth.getClient().catch((err) => console.error(err.message));

const googleSheets = google.sheets({ version: "v4", auth: client });

const spreadsheetId1 = process.env.SPREADSHEET_ID_TILDA;

const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId: spreadsheetId1,
}).catch((err) => console.error(err.message));

const { data } = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId: spreadsheetId1,
    range: "Лист1!A:W",
}).catch((err) => console.error(err.message));

let lastRowCount = data.values ? data.values.length : 0;

async function checkForNewRequests() {
    const { data } = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId: spreadsheetId1,
        range: "Лист1!A:W",
    });

    const currentRowCount = data.values ? data.values.length : 0;
    console.log({ lastRowCount, currentRowCount });

    if (currentRowCount > lastRowCount) {
        const newRows = data.values.slice(lastRowCount);
        newRows.forEach(async (row, i) => {
            const callbackData = { rowIndex: lastRowCount + i, row };
            console.log({ callbackData, rowIndex: lastRowCount + i });
            try {
                const { data } = await axios.post(`${process.env.BOT_URL}/new-request`, callbackData);
                console.log("Response : ", data);
            } catch (err) {
                console.error("An error occurred while sending notification : ", err.message);
            }
        });
    }
    lastRowCount = currentRowCount;
}

setInterval(checkForNewRequests, 1500);