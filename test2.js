const { getUser } = require('./TempleAccess');

(async () => {
    const uid = 'UID123';  // change to UID you registered
    const user = await getUser(uid);

    if (user) {
        console.log('User found:', user);
    } else {
        console.log('User not registered');
    }
})();
