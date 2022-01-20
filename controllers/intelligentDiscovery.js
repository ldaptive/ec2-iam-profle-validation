const axios = require('axios').default;

// set to your required URL
var baseUrl = '<your IntelligentDiscovery URL>'  

/**
 * @param {object} credentials              Our credential object
 * @param {string} credentials.username     Our username that we need to authenticate with
 * @param {string} credentials.password     Our users password
 * @returns bearer token
 */
module.exports.authenticate = (credentials) => new Promise(async (resolve) => {
    console.log('here are credentials', credentials)
    console.log('here baseurl', baseUrl)
    try {
        var response = await axios.post(`${baseUrl}/api/authenticate`, credentials);
        resolve(response.data.token)
    } catch (error) {
        console.log('i have an error', error.message);
        resolve({ error: error.message });
    }
});

/**
 * @param {string} token                Our authentication token recieved from authenticate call 
 * @param {string} url                  Our api url for api get calls example: /api/ec2/instances 
 * @returns {array} data array
 */
module.exports.apiGet = (token, url) => new Promise(async (resolve) => {
    var config = {headers: {Authorization: `Bearer ${token}`}}
    try {
        var response = await axios.get(`${baseUrl}${url}`, config);
        console.log(response.data);
        resolve(response.data);
    } catch (error) {
        console.log('i have error', error.message);
        resolve({ error: error.message });
    };
})