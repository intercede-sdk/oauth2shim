// needs node.js v18+ in order to use fetch api
// node.js settings - this webservice
const webserviceport = 3003; // pick an unused port on your system
const webservicehost = undefined; // (undefined) - by default listens to local connections only

// settings - external authentication webservice method to post to (adjust as needed)
const authEndpoint = 'set this value!'; //eg 'https://servername/appname/Authenticate'
const tokenLifetimeSeconds = 3600; // 1h, adjust this if the api issues tokens with different lifetime tokens

// simulate an oauth2 client_credential grant, but call another api under the hood to obtain the token
// Can be used (for example) to allow MyID rest notifications (that support oauth2 client_credential grant) to get an auth token by a custom mechanism
var express = require('express');

// if using windows and need to trust additional windows root CAs - allow root windows CAs to be trusted when calling external api. Can remove if not needed
require('win-ca').inject('+');

var app = express();
app.use(express.urlencoded()); // oauth2 input is urlencoded

// listen for oauth2 token endpoint calls for client_credential grant
app.post('/oauth2/token', function (req, res) {
  // take input params as if we are an oauth2 client_credential grant, first from body
  let clientId = req?.body?.client_id;
  let clientSecret = req?.body?.client_secret; // taking this from the body. some systems may pass it as authorization header instead

  // (if not present in body) try to take from Basic auth header
  if (!clientId && !clientSecret && req.headers.authorization) {
    // Basic b64encodingOf(client_id:client_secret)
    const basicAuth = req.headers.authorization.split(' ');
    if (basicAuth.length >= 2 && basicAuth[0] == 'Basic') {
      const credentials = Buffer.from(basicAuth[1], 'base64').toString('ascii');
      [clientId, clientSecret] = credentials.split(':');
    }
  }

  if (!clientId)
    throw Error('client_id is missing');

  if (!clientSecret)
    throw Error('client_secret is missing');

  // call an external json api with client_id and client_secret from the oauth2 client credential grant input. adjust this according to your api
  fetch(`${authEndpoint}`, {
    method: 'POST',
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      "username": clientId,
      "password": clientSecret
    })
  }).then(function (response) {
    // check success, return json response
    if (!response.ok)
      throw Error(`error calling api ${authEndpoint}, status ${response.status}`);

    return response.json();
  }).then(function (data) {
    // get the Token returned from the json api. (in this sample, the response is {"Token":"theTokenHere"}. adjust if necessary)
    const token = data.Token;
    if (!token)
      throw Error('auth api did not return Token');

    console.log('Token retrieved from auth api. returning oauth2 response.');

    // simulate oauth2 client_credentials response, with the token https://www.rfc-editor.org/rfc/rfc6749#section-4.4.3
    res.status(200).json({
      access_token: token,
      expires_in: tokenLifetimeSeconds,
      token_type: "bearer"
    }).end();
  }).catch(function (error) {
    console.log('Request failed', error);
    // https://www.rfc-editor.org/rfc/rfc6749#section-5.2
    res.status(400).json({
      error: 'invalid_request',
      customErrorInfo: error
    }).end();
  });
});

var server = app.listen(webserviceport, webservicehost, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Node app listening at http://%s:%s", host, port);
})