import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";
import { showSuccess, showFail } from '../utils/showMessage';

export const axiosLikeClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000,
});

/**
 * @param {number} userId - 用户ID
 * @param {number} productId - 商品ID
 */
export async function apiToggleProductLike(userId, productId) {
  const functionName = apiToggleProductLike.name; // For use in messages
  try {
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
