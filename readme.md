# oauth2 client_credential grant converter sample
This will take an https://www.ietf.org/rfc/rfc6749.txt oauth2 client_credential grant input (with client_id and client_secet, either in basic auth header or body) and call a custom webservice endpoint that uses the client_id and client_secret (but does not conform to rfc6749 oauth2) to obtain an auth token.
The auth token is then extracted from the custom webservice endpoint and an oauth2 rfc6749 oauth2 client_credential response is returned.
This is useful as a shim conversion layer for cases where a client (such as MyID notifications) supports oauth2 client_credentials grant for authorization, but a webservice has its own custom authorization endpoint for obtaining auth tokens.


## Instructions
* Requires node version 18 or higher
* Set variables at top of server.js to configure
  * webserviceport and webservicehost are set as required (determining where this service will be run)
  * authEndpoint is the url to call to obtain the token
  * tokenLifetimeSeconds should align with the lifetime of the tokens being issued by that endpoint
* Review the format of the "fetch" call - this is the format of data that is sent to obtain the token, adjust if necessary
* Currently this sample uses the win-ca package to use windows root CAs to trust for TLS certificates. Remove if necessary.
* Host the service. 
  * In the context of using this to enable oauth2 authorization from MyID notifications to work with an external non oauth2 authorization server, (for example) you could host this using Nssm on the MyID application server (in this example the same machine that is calling this webservice).

## Security Considerations
* Since the client_secret is sent, ensure the authEndpoint is pointing at the trusted location
* Since the client_secret is handled, ideally use TLS to protect this webservice otherwise ensure it is accessible only the server that is calling it (to ensure the client_secret cannot be snooped on the network.)
* The actual authorization is performed by the remove webservice it calls. Client auth is not required for this webservice (which is just a shim/proxy layer)
