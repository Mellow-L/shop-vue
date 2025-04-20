import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";
import { showSuccess, showFail } from '../utils/showMessage';

// Create a dedicated Axios client instance (optional, could reuse another if appropriate)
// Using a separate instance allows for specific interceptors or defaults if needed later.
export const axiosLikeClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000,
  // Potentially add headers like Authorization if needed for authenticated requests
  // headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

/**
 * 点赞/取消点赞商品
 * 后端需要根据 user_id 和 product_id 判断是添加点赞还是取消点赞
 * @param {number} userId - 用户ID
 * @param {number} productId - 商品ID
 */
export async function apiToggleProductLike(userId, productId) {
  const functionName = apiToggleProductLike.name; // For use in messages
  try {
    // Assuming a POST request is suitable for this toggle action
    // Sending data likely as JSON or form-data, depending on backend
    // Using qs.stringify for consistency with other examples, adjust if backend expects JSON
    const res = await axiosLikeClient.post('/api/product_star/star', qs.stringify({
      user_id: userId,
      product_id: productId
    }));

    if (res?.data?.code === 200) {
        // Backend message might indicate '点赞成功' or '取消点赞成功'
        showSuccess(functionName, res.data.message || "操作成功"); 
        return res.data; // Return response data which might include updated like status/count
    } else {
        const errorMsg = res?.data?.message || "点赞/取消点赞失败";
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    // Handle network errors or errors thrown from the try block
    const errorMsg = error.message || "点赞操作时发生网络错误";
    showFail(functionName, errorMsg);
    throw error; // Re-throw the error for the calling component to potentially handle
  }
}
