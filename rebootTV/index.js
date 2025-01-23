const { exec } = require('child_process');
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');

const adbPath = path.join(__dirname, '..', 'ADB', 'adb.exe');

// Fungsi untuk menjalankan perintah ADB
const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

// Fungsi untuk membaca data perangkat dari file JSON
const readDevicesFromFile = () => {
    const data = fs.readFileSync('../ipTv.json');
    return JSON.parse(data);
};

const rebootDevice = async () => {
    const devices = readDevicesFromFile();
    const failedReboot = [];
    for (const device of devices) {
        const deviceAddress = `${device.ipAddress}:5555`;

        try {
            console.log(`Trying connect to : ${device.name} | ${device.ipAddress} ...`);
            const connectCommand = `"${adbPath}" connect ${deviceAddress}`;
            const connectOutput = await runCommand(connectCommand);

            if (connectOutput.toLowerCase().includes('failed')) {
                console.error(`Cannot Connect to device ${device.name}: ${connectOutput}`);
                failedReboot.push({
                    name: device.name,
                    ipAddress: device.ipAddress,
                    status: "Failed to connect"
                });
                continue; 
            }

            console.log(`Trying to get uptime device : ${device.name} | ${device.ipAddress} ...`);
            const uptime = `"${adbPath}" -s ${deviceAddress} shell cat /proc/uptime`;
            const uptimeOutput = await runCommand(uptime);

            if (uptimeOutput.toLowerCase().includes('failed')) {
                console.error(`Cannot get uptime device : ${device.name}: ${uptimeOutput}`);
                failedReboot.push({
                    name: device.name,
                    ipAddress: device.ipAddress,
                    status: "Failed to get runtime"
                });
                continue;
            }

            const uptimeSeconds = parseFloat(uptimeOutput.split(" ")[0]);
            const uptimeDays = uptimeSeconds / (60 * 60 * 24);
            
            if (uptimeDays > 10) {
                console.log(`Trying to reboot : ${device.name} | ${device.ipAddress} ...`);
                const rebootSystem = `"${adbPath}" -s ${deviceAddress} reboot`;
                const rebootSystemOutput = await runCommand(rebootSystem);

                if (rebootSystemOutput.toLowerCase().includes('failed')) {
                    console.error(`Failed to reboot device ${device.name}: ${rebootSystemOutput}`);
                    failedReboot.push({
                        name: device.name,
                        ipAddress: device.ipAddress,
                        status: "Failed to reboot"
                    });
                    continue; 
                }
            }

            failedReboot.push({
                name: device.name,
                ipAddress: device.ipAddress,
                status: "Success"
            });
        } catch (error) {
            console.error(`Error trying to connect device ${device.name}:`, error);
            failedReboot.push({
                name: device.name,
                ipAddress: device.ipAddress,
                status: "Error occurred"
            });
        }
    }

    if (failedReboot.length > 0) {
        console.table(failedReboot);
    }
};


cron.schedule('0 9 * * *', () => {
    console.clear();
    console.log('Running Program');
    rebootDevice();
});