const axios = require('axios');

async function test() {
    try {
        console.log('Testing ipinfo.io...');
        const locRes = await axios.get('https://ipinfo.io/json');
        console.log('ipinfo success:', locRes.data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
