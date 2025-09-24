const { getUser, registerUser } = require('./TempleAccess');

(async () => {
    try {
        // 1️⃣ Register a new user (owner-only)
        const receipt = await registerUser('UID123', 'AADHAAR123', 'John Doe');
        console.log('User Registered. Tx Hash:', receipt.transactionHash);

        // 2️⃣ Fetch the user info
        const user = await getUser('UID123');
        console.log('Fetched User:', user);

    } catch (err) {
        console.error(err);
    }
})();
