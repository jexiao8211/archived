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

const reorderCollections = async (token: string, order_update: number[]): Promise<Collection[]> => {
    try {
        const response = await axios.patch(`${API_URL}/users/me/collections/order`, order_update, {
            headers: {
                Authorization: `Bearer ${token}`,
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

const createItem = async (token: string, collectionId: number, itemData: ItemCreate): Promise<Item> => {
    try {
        const response = await axios.post(`${API_URL}/collections/${collectionId}/items`, itemData, {
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

const reorderItems = async (token: string, collectionId: number, order_update: number[]): Promise<Item[]> => {
    try {
        const response = await axios.patch(`${API_URL}/collections/${collectionId}/items/order`, order_update, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Update item order error:", error);
        throw error;
    }
};

/* Item API Functions */
interface ItemImageOrderItem {
  id: number;
  image_order: number;
}

interface ItemImageOrderUpdate {
  image_orders: ItemImageOrderItem[];
}

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

const updateItem = async (token: string, itemId: number, itemData: ItemCreate): Promise<Item> => {
    try {
        const response = await axios.patch(`${API_URL}/items/${itemId}`, itemData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Update item error:', error);
        throw error;
    }
};

const deleteItem = async (token: string, itemId: number): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/items/${itemId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Delete item error:', error);
        throw error;
    }
};

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

const updateItemImages = async (
    token: string, 
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
        const response = await axios.patch(
            `${API_URL}/items/${itemId}/images`,
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
        console.error('Update item images error:', error);
        throw error;
    }
};


/* ItemImage API Functions */

const deleteItemImage = async (token: string, itemImageId: number): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/images/${itemImageId}`, {
            headers : {
                Authorization: `Bearer ${token}`
            }
        });
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

const deleteItemTags = async (token: string, itemId: number): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/items/${itemId}/tags`, {
            headers : {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Delete itemTags error:', error);
        throw error;
    }
};




export type { UserProfile, Collection, CollectionCreate, Item, ItemCreate, ItemImage, Tag, ItemImageOrderItem, ItemImageOrderUpdate };
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
    updateItem,
    deleteItem,
    uploadItemImages,
    updateItemImages,
    addItemTags,
    deleteItemImage,
    deleteItemTags,
    reorderItems,
    reorderCollections
};