const exec = require('@actions/exec');
const fs = require('fs');

module.exports = { activateLicense, activateManualLicense, returnLicense }

async function activateLicense(unityPath, username, password, serial) {
    await prepareForActivation();
    const stdout = await execute(`${unityCmd(unityPath)} -batchmode -nographics -quit -logFile -projectPath ? -username "${username}" -password "${password}" -serial "${serial}"`, true);
    if (!stdout.includes('Next license update check is after')) {
        throw new Error('Activation failed');
    }
}

async function activateManualLicense(unityPath, manualLicense) {
    fs.writeFileSync('license.ulf', manualLicense);
    await prepareForActivation();
    const stdout = await execute(`${unityCmd(unityPath)} -batchmode -nographics -quit -logFile -projectPath ? -manualLicenseFile license.ulf`);
    if (!stdout.includes('Next license update check is after')) {
        throw new Error('Activation failed');
    }
}

async function returnLicense(unityPath) {
    await execute(`${unityCmd(unityPath)} -batchmode -nographics -quit -logFile -returnlicense`);
}

async function prepareForActivation() {
    if (process.platform === 'darwin') {
        await execute('sudo mkdir -p "/Library/Application Support/Unity"');
        await execute(`sudo chown -R ${process.env.USER} "/Library/Application Support/Unity"`);
    }
}

function unityCmd(unityPath) {
    let unityCmd = '';
    if (process.platform === 'linux') {
        unityCmd = `xvfb-run --auto-servernum "${unityPath}"`;
    } else if (process.platform === 'darwin') {
        unityCmd = `"${unityPath}"`;
    } else if (process.platform === 'win32') {
        unityCmd = `"${unityPath}"`;
    }
    return unityCmd;
}

async function execute(command, ignoreReturnCode) {
    let stdout = '';
    await exec.exec(command, [], {
        ignoreReturnCode: ignoreReturnCode,
        listeners: {
            stdout: buffer => stdout += buffer.toString()
        }
    });
    return stdout;
}