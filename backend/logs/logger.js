const date = require('date-and-time');
const fs = require('fs');
const fsPromises = fs.promises;

const MyLogger = async (path, message) => {
    if (!fs.existsSync(`logs/${path}`)) {
        fs.mkdirSync(`logs/${path}`, { recursive: true });
    }
    try {
        const log = await fsPromises.readFile(`logs/${path}${date.format(new Date(), 'YYYY. MM. DD')}.json`, 'utf8');
        const json = JSON.parse(log);
        json.push(message);
        await fsPromises.writeFile(`logs/${path}${date.format(new Date(), 'YYYY. MM. DD')}.json`, JSON.stringify(json));
    } catch (e) {
        await fsPromises.writeFile(
            `logs/${path}${date.format(new Date(), 'YYYY. MM. DD')}.json`,
            JSON.stringify([message])
        );
    }
};

module.exports = MyLogger;
