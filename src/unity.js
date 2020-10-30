const exec = require('@actions/exec');
const fs = require('fs');

module.exports = { activateLicense, activateManualLicense, returnLicense }

async function activateLicense(unityPath, username, password, serial) {
    let stdout = '';
    await exec.exec(`${unityCmd(unityPath)} -batchmode -nographics -quit -logFile -projectPath ? -username "${username}" -password "${password}" -serial "${serial}"`, [], {
        ignoreReturnCode: true,
        listeners: {
            stdout: buffer => stdout += buffer.toString()
        }
    });
    if (!stdout.includes('Next license update check is after')) {
        throw new Error('Activation failed');
    }
}

async function activateManualLicense(unityPath, manualLicense) {
    fs.writeFileSync('license.ulf', manualLicense);
    let stdout = '';
    await exec.exec(`${unityCmd(unityPath)} -batchmode -nographics -quit -logFile -projectPath ? -manualLicenseFile license.ulf`, [], {
        listeners: {
            stdout: buffer => stdout += buffer.toString()
        }
    });
    if (!stdout.includes('Next license update check is after')) {
        throw new Error('Activation failed');
    }
}

async function returnLicense(unityPath) {
    await exec.exec(`${unityCmd(unityPath)} -batchmode -nographics -quit -logFile -returnlicense`);
}

function unityCmd(unityPath) {
    let unityCmd = '';
    if (process.platform === 'linux') {
        unityCmd = `sudo xvfb-run --auto-servernum "${unityPath}"`;
    } else if (process.platform === 'darwin') {
        unityCmd = `sudo "${unityPath}"`;
    } else if (process.platform === 'win32') {
        unityCmd = `"${unityPath}"`;
    }
    return unityCmd;
}