// /* Where we put the axios definition for calling the backend API */
// // allows us to use the "api" variable to send requests instead of axios itself
// // so we dont have to write out the base url every time
// // we only need to write out the endpoint that we want to call
// // so if we want to change the endpoint, we only have to change one line of code
// // this is best practice

// import axios from "axios";

// const api = axios.create({
//     baseURL: "http://localhost:8000" // Define this as the URL for the backend server
// });

// // Export the Axios instance
// export default api;


import axios from 'axios';

const API_URL = 'http://localhost:8000';

interface LoginCredentials {
    username: string;
    password: string;
}

interface UserData {
    username: string;
    email: string;
    password: string;
}

interface UserProfile {
    id: number;
    username: string;
    email: string;
}

const loginUser = async (credentials: LoginCredentials): Promise<{ access_token: string; token_type: string }> => {
    try {
        const params = new URLSearchParams();
        for (const key in credentials) {
            params.append(key, credentials[key as keyof LoginCredentials]);
        }

        const response = await axios.post(
            `${API_URL}/auth/token`,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

const registerUser = async (userData: UserData): Promise<void> => {
    try {
        await axios.post(`${API_URL}/auth/register`, userData);
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

const fetchUserProfile = async (token: string): Promise<UserProfile> => {
    try {
        const response = await axios.get(`${API_URL}/users/me/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch user profile error:", error);
        throw error;
    }
};

// Collection API functions
interface Collection {
    id: number;
    name: string;
    description: string | null;
    owner_id: number;
    items: any[];
}

interface CollectionCreate {
    name: string;
    description?: string;
}

const fetchCollections = async (token: string): Promise<Collection[]> => {
    try {
        const response = await axios.get(`${API_URL}/users/me/collections`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch collections error:", error);
        throw error;
    }
};

const createCollection = async (token: string, collectionData: CollectionCreate): Promise<Collection> => {
    try {
        const response = await axios.post(`${API_URL}/users/me/collections`, collectionData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Create collection error:", error);
        throw error;
    }
};

export type { UserProfile, Collection, CollectionCreate };
export { loginUser, registerUser, fetchUserProfile, fetchCollections, createCollection };