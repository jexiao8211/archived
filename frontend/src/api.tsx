/* 
Where we put the axios definition for calling the backend API
 * allows us to use the "api" variable to send requests instead of axios itself
 * so we dont have to write out the base url every time
 * we only need to write out the endpoint that we want to call
 * so if we want to change the endpoint, we only have to change one line of code
 * this is best practice
*/

import axios from 'axios';

const API_URL = 'http://localhost:8000';


/* Auth API Functions */

interface LoginCredentials {
    username: string;
    password: string;
}
interface UserData {
    username: string;
    email: string;
    password: string;
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


/* User-level API Functions */

interface UserProfile {
    id: number;
    username: string;
    email: string;
}
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
interface UserUpdate {
    new_username: string;
    current_password: string; // is this secure?
}

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

const updateUserUsername = async (token: string, userData: UserUpdate): Promise<UserProfile> => {
    try {
        const response = await axios.patch(`${API_URL}/users/me/`, 
            {
                new_username: userData.new_username,
                current_password: userData.current_password
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Update username error:', error);
        throw error;
    }
}

const deleteUser = async (token: string, currentPassword: string): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/users/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: {
                    current_password: currentPassword
                }
            }
        );
    } catch (error) {
        console.error('Delete user error');
        throw error;
    }
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


/* Collection-level API Functions */
interface Item {
    id: number;
    name: string;
    description?: string;
    collection_id: number;
    images: any[];
    tags: any[];
}
interface ItemCreate {
    name: string;
    description?: string;
}
interface ItemImage {
    id: number;
    item_id: number;
    image_url: string;
}

const fetchCollection = async (token: string, collectionID: number): Promise<Collection> => {
    try {
        const response = await axios.get(`${API_URL}/collections/${collectionID}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch collection error:", error);
        throw error;
    }
};

const updateCollection = async (token: string, collectionID: number, collectionUpdate: CollectionCreate): Promise<Collection> => {
    try {
        const response = await axios.patch(`${API_URL}/collections/${collectionID}`, 
            {
                name: collectionUpdate.name,
                description: collectionUpdate.description
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Update collection error:', error);
        throw error;
    }
}

const deleteCollection = async (token: string, collectionID: number): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/collections/${collectionID}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    } catch (error) {
        console.error('Delete collection error');
        throw error;
    }
}

const fetchCollectionItems = async (token: string, collectionID: number): Promise<Item[]> => {
    try {
        const response = await axios.get(`${API_URL}/collections/${collectionID}/items`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch collection items error:", error);
        throw error;
    }
};

const createItem = async (token: string, collectionID: number, itemData: ItemCreate): Promise<Item> => {
    try {
        const response = await axios.post(`${API_URL}/collections/${collectionID}/items`, itemData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Create item error:", error);
        throw error;
    }
};


/* Item API Functions */

// getItems
const fetchItem = async (token: string, itemID: number): Promise<Item> => {
    try {
        const response = await axios.get(`${API_URL}/items/${itemID}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch item error:", error);
        throw error;
    }
};

// deleteItem

const fetchItemImages = async (token: string, itemId: number): Promise<ItemImage[]> => {
    try {
        const response = await axios.get(`${API_URL}/items/${itemId}/images`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch item images error:", error);
        throw error;
    }
}; // TODO: this is not used? fetchItem may be able to accomplish the same thing


const addItemImages = async (token: string, itemId: number, imageUrls: string[]): Promise<ItemImage[]> => {
    try {
        const response = await axios.post(`${API_URL}/items/${itemId}/images`, imageUrls, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Add item images error:", error);
        throw error;
    }
}; // TODO: Delete this? uploadItemImages may replace


const uploadItemImages = async (token: string, itemId: number, files: File[]): Promise<ItemImage[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file); // 'files' matches parameter name in FastAPI endpoint
    });
  
    try {
      const response = await axios.post(
        `${API_URL}/items/${itemId}/images/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Upload item images error:', error);
      throw error;
    }
  };

/* Tag API Functions */

interface Tag {
  id: number;
  name: string;
}

const addItemTags = async (token: string, itemId: number, tags: string[]): Promise<Tag[]> => {
  try {
    const response = await axios.post(
      `${API_URL}/items/${itemId}/tags`,
      { tags },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Add item tags error:', error);
    throw error;
  }
};

export type { UserProfile, Collection, CollectionCreate, Item, ItemCreate, ItemImage, Tag };
export { 
    loginUser, 
    registerUser,
    fetchUserProfile, 
    updateUserUsername, 
    deleteUser, 
    fetchCollections, 
    createCollection,
    fetchCollection, 
    updateCollection, 
    deleteCollection, 
    fetchCollectionItems, 
    createItem,
    fetchItem,
    fetchItemImages,
    addItemImages,
    uploadItemImages,
    addItemTags
};

/* TODO - implement in react and test:
 * updateUserUsername, deleteUser
 * fetchCollection, updateCollection, deleteCollection, fetchCollectionItems, createItem
*/