const pm2 = require('pm2');
const { execSync } = require('child_process');
const fs = require('fs');

const logFilePath = '/root/storechain_service_monitor/restarts.log'; // Change this to the path of your log file

pm2.list((err, list) => {
    if (err) {
        console.error('Error listing PM2 processes:', err);
        return;
    }

    let offlineProcesses = [];

    list.forEach(process => {
        const status = process.pm2_env.status;
        console.log(`Process ${process.name} status: ${status}`);

        if (status !== 'online') {
            offlineProcesses.push(process.name);
        }
    });

    if (offlineProcesses.length > 0) {
        console.log('One or more processes are offline. Restarting...');


        const command = 'cd /root/storagechainnode-linux/ && ./kill_port.sh && /usr/local/bin/pm2 delete all && ./main.sh';


        try {
            const output = execSync(command);
            console.log(output.toString());

            // Log to file
            const logEntry = `${new Date().toISOString()} - Services offline: ${offlineProcesses.join(', ')}\n`;
            fs.appendFileSync(logFilePath, logEntry);

            // Check log file size
            const stats = fs.statSync(logFilePath);
            const fileSizeInBytes = stats.size;
            const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

            if (fileSizeInMB > 1) {
                fs.unlinkSync(logFilePath); // Delete the file if it exceeds 1MB
                fs.writeFileSync(logFilePath, ''); // Recreate the file
            }
        } catch (error) {
            console.error(`Error executing command: ${error.message}`);
        }

        process.exit();
    } else {
        console.log('All processes are online.');
	process.exit();
    }
});
