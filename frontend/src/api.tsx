/* Where we put the axios definition for calling the backend API */
// allows us to use the "api" variable to send requests instead of axios itself
// so we dont have to write out the base url every time
// we only need to write out the endpoint that we want to call
// so if we want to change the endpoint, we only have to change one line of code
// this is best practice

import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000" // Define this as the URL for the backend server
});

// Export the Axios instance
export default api;