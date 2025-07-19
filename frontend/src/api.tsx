/* 
Where we put the axios definition for calling the backend API
 * allows us to use the "api" variable to send requests instead of axios itself
 * so we dont have to write out the base url every time
 * we only need to write out the endpoint that we want to call
 * so if we want to change the endpoint, we only have to change one line of code
 * this is best practice
*/

import axios from 'axios';
import config from './config';

// Create a custom axios instance
const api = axios.create({
  baseURL: config.API_URL,
});

// Add a request interceptor to automatically add the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global token refresh and auth handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh_token = localStorage.getItem('refresh_token');
      
      // Don't try to refresh if this is already a refresh request
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh token is expired, clear tokens and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/logged-out';
        return Promise.reject(error);
      }
      
      if (refresh_token) {
        try {
          // Use the refreshToken API call directly
          const refreshed = await api.post(
            `${config.API_URL}/auth/refresh`,
            { refresh_token },
            { headers: { 'Content-Type': 'application/json' } }
          );
          localStorage.setItem('token', refreshed.data.access_token);
          localStorage.setItem('refresh_token', refreshed.data.refresh_token);
          // Update the Authorization header and retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${refreshed.data.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to logged-out page
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/logged-out';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to logged-out page
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/logged-out';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

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

const loginUser = async (credentials: LoginCredentials): Promise<{ access_token: string; refresh_token: string; token_type: string }> => {
    try {
        const params = new URLSearchParams();
        for (const key in credentials) {
            params.append(key, credentials[key as keyof LoginCredentials]);
        }

        const response = await api.post(
            `/auth/token`,
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
        await api.post(`/auth/register`, userData);
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

const refreshToken = async (refresh_token: string): Promise<{ access_token: string; refresh_token: string; token_type: string }> => {
    try {
        const response = await api.post(
            `/auth/refresh`,
            {refresh_token},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Refresh token error:", error);
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
    created_date?: string;
    updated_date?: string;
}
interface CollectionCreate {
    name: string;
    description?: string;
}
interface UserUpdate {
    new_username: string;
    current_password: string; // is this secure?
}

const fetchUserProfile = async (): Promise<UserProfile> => {
    try {
        const response = await api.get(`/users/me/`);
        return response.data;
    } catch (error) {
        console.error("Fetch user profile error:", error);
        throw error;
    }
};

const updateUserUsername = async (userData: UserUpdate): Promise<UserProfile> => {
    try {
        const response = await api.patch(`/users/me/`, 
            {
                new_username: userData.new_username,
                current_password: userData.current_password
            }
        );
        return response.data;
    } catch (error) {
        console.error('Update username error:', error);
        throw error;
    }
}

const deleteUser = async (currentPassword: string): Promise<void> => {
    try {
        await api.delete(`/users/me`,
            {
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

const fetchCollections = async (): Promise<Collection[]> => {
    try {
        const response = await api.get(`/users/me/collections`);
        return response.data;
    } catch (error) {
        console.error("Fetch collections error:", error);
        throw error;
    }
};

const createCollection = async (collectionData: CollectionCreate): Promise<Collection> => {
    try {
        const response = await api.post(`/users/me/collections`, collectionData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Create collection error:", error);
        throw error;
    }
};

const reorderCollections = async (order_update: number[]): Promise<Collection[]> => {
    try {
        const response = await api.patch(`/users/me/collections/order`, order_update, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Update collection order error:", error);
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
    created_date?: string;
    updated_date?: string;
}
interface ItemCreate {
    name: string;
    description?: string;
}
interface ItemImage {
    id: number;
    item_id: number;
    image_url: string;
    image_order: number;
}

const fetchCollection = async (collectionID: number): Promise<Collection> => {
    try {
        const response = await api.get(`/collections/${collectionID}`);
        return response.data;
    } catch (error) {
        console.error("Fetch collection error:", error);
        throw error;
    }
};

const updateCollection = async (collectionID: number, collectionUpdate: CollectionCreate): Promise<Collection> => {
    try {
        const response = await api.patch(`/collections/${collectionID}`, 
            {
                name: collectionUpdate.name,
                description: collectionUpdate.description
            }
        );
        return response.data;
    } catch (error) {
        console.error('Update collection error:', error);
        throw error;
    }
}

const deleteCollection = async (collectionID: number): Promise<void> => {
    try {
        await api.delete(`/collections/${collectionID}`);
    } catch (error) {
        console.error('Delete collection error:', error);
        throw error;
    }
}

const fetchCollectionItems = async (collectionID: number): Promise<Item[]> => {
    try {
        const response = await api.get(`/collections/${collectionID}/items`);
        return response.data;
    } catch (error) {
        console.error("Fetch collection items error:", error);
        throw error;
    }
};

const createItem = async (collectionId: number, itemData: ItemCreate): Promise<Item> => {
    try {
        const response = await api.post(`/collections/${collectionId}/items`, itemData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Create item error:", error);
        throw error;
    }
};

const reorderItems = async (collectionId: number, order_update: number[]): Promise<Item[]> => {
    try {
        const response = await api.patch(`/collections/${collectionId}/items/order`, { item_ids: order_update }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Update item order error:", error);
        throw error;
    }
};

const fetchItem = async (itemID: number): Promise<Item> => {
    try {
        const response = await api.get(`/items/${itemID}`);
        return response.data;
    } catch (error) {
        console.error("Fetch item error:", error);
        throw error;
    }
};

const updateItem = async (itemId: number, itemData: ItemCreate): Promise<Item> => {
    try {
        const response = await api.patch(`/items/${itemId}`, itemData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Update item error:', error);
        throw error;
    }
};

const deleteItem = async (itemId: number): Promise<void> => {
    try {
        await api.delete(`/items/${itemId}`);
    } catch (error) {
        console.error('Delete item error:', error);
        throw error;
    }
};

const uploadItemImages = async (itemId: number, files: File[]): Promise<ItemImage[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file); // 'files' matches parameter name in FastAPI endpoint
    });
  
    try {
      const response = await api.post(
        `/items/${itemId}/images/upload`,
        formData,
        {
          headers: {
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

const updateItemImages = async (
    itemId: number, 
    deleted_item_images: number[],  // List of image IDs to delete
    new_files: File[],      
    new_images_order: (number | string)[]   // List of image IDs or temp IDs of form "new-1"
): Promise<ItemImage[]> => {
    const formData = new FormData();
    
    // Add deleted image IDs as form field
    deleted_item_images.forEach(id => {
        formData.append('deleted_item_images', String(id));
    });
    
    // Add new files
    new_files.forEach((file) => {
        formData.append('new_files', file);
    });
  
  // Add new images order as form field
    new_images_order.forEach(id => {
        formData.append('new_images_order', String(id));
    });
  
    try {
        const response = await api.patch(
            `/items/${itemId}/images`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Update item images error:', error);
        throw error;
    }
};


/* ItemImage API Functions */

const deleteItemImage = async (itemImageId: number): Promise<void> => {
    try {
        await api.delete(`/images/${itemImageId}`);
    } catch (error) {
        console.error('Delete itemImage error:', error);
        throw error;
    }
};

/* Tag API Functions */
interface Tag {
  id: number;
  name: string;
}

const addItemTags = async (itemId: number, tags: string[]): Promise<Tag[]> => {
  try {
    const response = await api.post(
      `/items/${itemId}/tags`,
      { tags },
      {
        headers: {
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

const deleteItemTags = async (itemId: number): Promise<void> => {
    try {
        await api.delete(`/items/${itemId}/tags`);
    } catch (error) {
        console.error('Delete itemTags error:', error);
        throw error;
    }
};

export {
    loginUser,
    registerUser,
    fetchUserProfile,
    updateUserUsername,
    deleteUser,
    fetchCollections,
    createCollection,
    reorderCollections,
    fetchCollection,
    updateCollection,
    deleteCollection,
    fetchCollectionItems,
    createItem,
    reorderItems,
    fetchItem,
    updateItem,
    deleteItem,
    uploadItemImages,
    updateItemImages,
    deleteItemImage,
    addItemTags,
    deleteItemTags,
    refreshToken,
    type UserProfile,
    type Collection,
    type CollectionCreate,
    type UserUpdate,
    type Item,
    type ItemCreate,
    type ItemImage,
    type Tag
};