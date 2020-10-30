const core = require('@actions/core');
const unity = require('./unity');

async function run() {
    try {
        const unityPath = core.getInput('unity-path') || process.env.UNITY_PATH;
        if (!unityPath) {
            throw new Error('unity path not found');
        }
        const unityUsername = core.getInput('unity-username');
        const unityPassword = core.getInput('unity-password');
        const unitySerial = core.getInput('unity-serial');
        const unityManualLicense = core.getInput('unity-manual-license');

        if (unityUsername && unityPassword && unitySerial) {
            await unity.activateLicense(unityPath, unityUsername, unityPassword, unitySerial);
        } else if (unityManualLicense) {
            await unity.activateManualLicense(unityPath, unityManualLicense);
        } else {
            throw new Error('Empty (unity-username and unity-password and unity-serial) or unity-manual-license inputs');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

