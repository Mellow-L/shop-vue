import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";
import { showSuccess, showFail } from '../utils/showMessage';

export const axiosClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000
});

// 用户注册
export async function apiRegisterUser(formData) {
    try {
        const res = await axios.post('/api/user/register', qs.stringify(formData));
        if (res?.data?.code === 200) {
            showSuccess(apiRegisterUser.name, "注册成功");
            return res.data;
        } else {
            showFail(apiRegisterUser.name, res?.data?.message || "注册验证失败");
            throw new Error(res?.data?.message || "注册验证失败");
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
          console.error('Registration API Error 400:', error.response.data);
          showFail(apiRegisterUser.name, "用户已注册，请登录");
          return null;
        } else {
          console.error('Registration API General Error:', error);
          showFail(apiRegisterUser.name, error.message || "注册时发生错误");
          throw error;
        }
    }
}

// 用户登录
export async function apiLogin(formData) {
  try {
    const form = new FormData();
    form.append('email', formData.email);
    form.append('password', formData.password);
    form.append('isManager', formData.isManager);
    const res = await axios.post('/api/user/login', form);
    
    if (res?.data?.code === 200) {
        showSuccess(apiLogin.name, "登录成功");
      return res.data;
    } else {
        showFail(apiLogin.name, res?.data?.message || "登录验证失败");
        return res.data;
    }
  } catch (error) {
    if (error.response) {
      console.error('Login API Error Response:', error.response);
      if (error.response.status === 401) {
        showFail(apiLogin.name, error.response.data.message);
      } else if (error.response.status === 404) {
        showFail(apiLogin.name, "用户不存在，请先注册");
      } else {
        showFail(apiLogin.name, `登录失败：服务器错误 (${error.response.status})`);
      }
    } else if (error.request) {
      console.error('Login API No Response:', error.request);
      showFail(apiLogin.name, "登录请求失败，请检查网络连接");
    } else {
      console.error('Login API Request Setup Error:', error.message);
      showFail(apiLogin.name, `登录出错: ${error.message}`);
    }
    return null;
  }
}

// 获取用户列表
export async function apiGetUserList() {
  try {
    const res = await axiosClient.get('/api/user/find-all');
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiGetUserList.name, res?.data?.message || "获取用户列表失败");
        throw new Error(res?.data?.message || "获取用户列表失败");
    }
  } catch (error) {
    showFail(apiGetUserList.name, error.message || "获取用户列表失败");
    throw error;
  }
}

// 搜索用户 (Updated to handle 404 specifically in catch)
export async function apiSearchUserList(searchTerm) { 
  const functionName = apiSearchUserList.name;
  try {
    const params = { SearchContent: searchTerm }; 
    console.log(`[${functionName}] Sending request with params:`, params);
    
    const res = await axiosClient.get('/api/user/manager/find', { params });
    
    // Handle successful response or non-200 codes that didn't throw
    if (res?.data?.code === 200) {
        console.log(`[${functionName}] Search successful for term: ${searchTerm}`);
        // Return empty list if data.list is not an array or is empty
        if (!Array.isArray(res.data.list) || res.data.list.length === 0) {
             console.log(`[${functionName}] Search successful but returned empty list for term: ${searchTerm}`);
             // You might want to return an empty list structure if needed by the component
             // return { code: 200, message: '未找到用户', list: [], totalCount: 0 }; 
             // For now, let's rely on the component handling the empty array from res.data
        }
        return res.data;
    } else {
        // Handle non-200 codes reported in the response body
        const errorMsg = res?.data?.message || `搜索用户列表失败 (Code: ${res?.data?.code}, Term: ${searchTerm})`;
        console.error(`[${functionName}] Search failed (non-200 code in response):`, res);
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    // --- MODIFIED CATCH BLOCK for 404 --- 
    const errorMsg = error.message || `搜索用户列表时发生网络错误 (Term: ${searchTerm})`;
    console.error(`[${functionName}] Error caught:`, error);
    
    // Check if it's specifically a 404 error
    if (error.isAxiosError && error.response?.status === 404) {
      console.log(`[${functionName}] Received 404 Not Found. Suppressing global message.`);
      // DO NOT call showFail for 404 errors
    } else {
      // For all other errors (network, 500, etc.), show the global message
      showFail(functionName, errorMsg);
    }
    // Always re-throw the error so the calling component's catch block runs
    throw error;
    // --- END MODIFIED CATCH BLOCK ---
  }
}

// 查找用户
export async function apiFindUserById(userId) {
  try {
    const res = await axios.get(`/api/user/find-byid?user_id=${userId}`);
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindUserById.name, res?.data?.message || "查找用户失败");
        throw new Error(res?.data?.message || "查找用户失败");
    }
  } catch (error) {
    showFail(apiFindUserById.name, error.message || "查找用户失败");
    throw error;
  }
}

// 修改密码
export async function apiUpdatePassword(userId, currentPassword, newPassword) {
  const functionName = apiUpdatePassword.name; 
  console.log(`[${functionName}] Called with userId: ${userId}`);
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('password', currentPassword);
    formData.append('newpassword', newPassword); 

    const res = await axiosClient.put('/api/user/update/password', formData);
    console.log(`[${functionName}] API Response:`, res);
    
    // Only handle explicit success (e.g., 200)
    if (res?.data?.code === 200) {
        showSuccess(functionName, res.data.message || "密码修改成功");
        return res.data;
    } else {
        // Handle non-200 codes that didn't throw an error (less common with default Axios)
        const backendMessage = res?.data?.message; 
        const statusCode = res?.status || res?.data?.code; 
        console.warn(`[${functionName}] Non-200 Response without throwing. Status: ${statusCode}, Message: ${backendMessage}`);
        const errorMsg = backendMessage || `密码修改失败 (代码: ${statusCode || 'N/A'})`; 
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
     // --- MODIFIED CATCH BLOCK --- 
    console.error(`[${functionName}] Error caught:`, error);
    let displayMessage = "修改密码时发生网络或未知错误"; // Default/fallback message

    // Check if it's an Axios error with a response object
    if (error.isAxiosError && error.response) {
        console.log(`[${functionName}] Axios error response received. Status: ${error.response.status}, Data:`, error.response.data);
        // Try to get the specific message from the response body
        if (error.response.data?.message) {
            displayMessage = error.response.data.message; 
            console.log(`[${functionName}] Using backend message from response body: "${displayMessage}"`);
        } else {
            // If no message in body, use Axios' default message or a generic one based on status
             displayMessage = error.message || `请求失败，状态码: ${error.response.status}`;
             console.log(`[${functionName}] No specific backend message found, using default/status-based message: "${displayMessage}"`);
        }
    } else if (error.message) {
        // Handle non-Axios errors or errors without a response object
        displayMessage = error.message;
        console.log(`[${functionName}] Non-Axios error or no response, using error.message: "${displayMessage}"`);
    }

    // Show the determined error message
    showFail(functionName, displayMessage);
    
    // Re-throw the original error so the calling component knows something went wrong
    throw error; 
    // --- END MODIFIED CATCH BLOCK ---
  }
}

// 地址管理
export async function apiAddAddress(userId, address) {
  try {
    const res = await axios.put('/api/user/add/address', qs.stringify({
      user_id: userId,
      address: address
    }));
    if (res?.data?.code === 200) {
        showSuccess(apiAddAddress.name, "地址添加成功");
        return res.data;
    } else {
        showFail(apiAddAddress.name, res?.data?.message || "地址添加失败");
        throw new Error(res?.data?.message || "地址添加失败");
    }
  } catch (error) {
    showFail(apiAddAddress.name, error.message || "地址添加失败");
    throw error;
  }
}

export async function apiUpdateAddress(userId, address) {
  try {
    const res = await axios.put('/api/user/update/address', qs.stringify({
      user_id: userId,
      address: address
    }));
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateAddress.name, "地址更新成功");
        return res.data;
    } else {
        showFail(apiUpdateAddress.name, res?.data?.message || "地址更新失败");
        throw new Error(res?.data?.message || "地址更新失败");
    }
  } catch (error) {
    showFail(apiUpdateAddress.name, error.message || "地址更新失败");
    throw error;
  }
}

export async function apiDeleteAddress(userId) {
  const functionName = apiDeleteAddress.name; // For messages
  try {
    // Create FormData object
    const formData = new FormData();
    formData.append('user_id', userId);

    // Send FormData with axios.delete
    // Axios automatically sets Content-Type to multipart/form-data when data is FormData
    const res = await axios.delete('/api/user/delete/address', {
      data: formData 
      // No need to set Content-Type header manually
    });

    if (res?.data?.code === 200) {
        showSuccess(functionName, "地址删除成功");
        return res.data;
    } else {
        const errorMsg = res?.data?.message || "地址删除失败";
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || "删除地址时发生网络错误";
    showFail(functionName, errorMsg);
    throw error;
  }
}

// 其他用户操作
export async function apiUpdateUsername(userId, username) {
  const functionName = apiUpdateUsername.name;
  console.log(`[${functionName}] Called with userId: ${userId}, username: ${username}`);
  try {
    // Use axiosClient and PUT method, sending data as application/x-www-form-urlencoded via qs.stringify
    const res = await axiosClient.put('/api/user/update/username', qs.stringify({
      user_id: userId,
      username: username
    }));
    console.log(`[${functionName}] API Response:`, res);

    if (res?.data?.code === 200) {
        showSuccess(functionName, res.data.message || "用户名更新成功");
        return res.data;
    } else {
        // Handle non-200 responses that didn't throw
        const backendMessage = res?.data?.message;
        const statusCode = res?.status || res?.data?.code;
        console.warn(`[${functionName}] Non-200 Response without throwing. Status: ${statusCode}, Message: ${backendMessage}`);
        const errorMsg = backendMessage || `用户名更新失败 (代码: ${statusCode || 'N/A'})`;
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    // --- MODIFIED CATCH BLOCK --- 
    console.error(`[${functionName}] Error caught:`, error);
    let displayMessage = "更新用户名时发生网络或未知错误"; // Default/fallback message

    if (error.isAxiosError && error.response) {
        console.log(`[${functionName}] Axios error response received. Status: ${error.response.status}, Data:`, error.response.data);
        if (error.response.data?.message) {
            displayMessage = error.response.data.message;
            console.log(`[${functionName}] Using backend message from response body: "${displayMessage}"`);
        } else {
             displayMessage = error.message || `请求失败，状态码: ${error.response.status}`;
             console.log(`[${functionName}] No specific backend message found, using default/status-based message: "${displayMessage}"`);
        }
    } else if (error.message) {
        displayMessage = error.message;
        console.log(`[${functionName}] Non-Axios error or no response, using error.message: "${displayMessage}"`);
    }

    showFail(functionName, displayMessage);
    throw error; 
    // --- END MODIFIED CATCH BLOCK ---
  }
}

export async function apiUpdateAvatar(userId, avatar) {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('avatar', avatar);
    const res = await axios.put('/api/user/update/avatar', formData);
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateAvatar.name, "头像更新成功");
        return res.data;
    } else {
        showFail(apiUpdateAvatar.name, res?.data?.message || "头像更新失败");
        throw new Error(res?.data?.message || "头像更新失败");
    }
  } catch (error) {
    showFail(apiUpdateAvatar.name, error.message || "头像更新失败");
    throw error;
  }
}

export async function apiUpdateStatus(userId, status) {
  try {
    const res = await axios.put('/api/user/update/status', qs.stringify({
      user_id: userId,
      status: status
    }));
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateStatus.name, "用户状态更新成功");
        return res.data;
    } else {
        showFail(apiUpdateStatus.name, res?.data?.message || "用户状态更新失败");
        throw new Error(res?.data?.message || "用户状态更新失败");
    }
  } catch (error) {
    showFail(apiUpdateStatus.name, error.message || "用户状态更新失败");
    throw error;
  }
}

export async function apiDeleteUser(userId) {
  try {
    // *** 使用 FormData 发送数据 ***
    const formData = new FormData();
    formData.append('user_id', userId);

    const res = await axios.delete('/api/user/delete', {
      data: formData // 传递 FormData 对象
      // Axios 会自动设置 Content-Type 为 multipart/form-data
    });
    
    if (res?.data?.code === 200) {
        showSuccess(apiDeleteUser.name, "用户删除成功");
        return res.data;
    } else {
        showFail(apiDeleteUser.name, res?.data?.message || "用户删除失败");
        throw new Error(res?.data?.message || "用户删除失败");
    }
  } catch (error) {
    showFail(apiDeleteUser.name, error.message || "用户删除失败");
    throw error;
  }
}
