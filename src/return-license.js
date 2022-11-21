const core = require('@actions/core');
const unity = require('./unity');

async function run() {
    try {
        const unityPath = core.getInput('unity-path') || process.env.UNITY_PATH;
        if (!unityPath) {
            throw new Error('unity path not found');
        }
        if (core.getInput('unity-serial')) {
            const unityUsername = core.getInput('unity-username', { required: true });
            const unityPassword = core.getInput('unity-password', { required: true });
            await unity.returnLicense(unityPath, unityUsername, unityPassword);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
