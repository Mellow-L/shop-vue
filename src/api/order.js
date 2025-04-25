import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";
import { showSuccess, showFail } from '../utils/showMessage';

export const axiosClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000
});

// 添加订单/加入购物车
export async function apiAddOrder(orderJsonData) {
  try {
    // 直接发送 JS 对象，Axios 会自动处理为 application/json
    const res = await axiosClient.post('/api/order/add/order', orderJsonData);
    if (res?.data?.code === 200) {
        showSuccess(apiAddOrder.name, "订单添加成功");
        return res.data;
    } else {
        showFail(apiAddOrder.name, res?.data?.message || "订单添加失败");
        throw new Error(res?.data?.message || "订单添加失败");
    }
  } catch (error) {
    showFail(apiAddOrder.name, error.message || "订单添加失败");
    throw error;
  }
}

// 删除购物车商品
export async function apiDeleteCartItem(productId, userId) {
  try {
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('user_id', userId);
    
    const res = await axiosClient.delete('/api/order/delete/double_id', {
      data: formData
    });
    if (res?.data?.code === 200) {
        showSuccess(apiDeleteCartItem.name, "购物车商品删除成功");
        return res.data;
    } else {
        showFail(apiDeleteCartItem.name, res?.data?.message || "购物车商品删除失败");
        throw new Error(res?.data?.message || "购物车商品删除失败");
    }
  } catch (error) {
    showFail(apiDeleteCartItem.name, error.message || "购物车商品删除失败");
    throw error;
  }
}

// 订单更新
export async function apiUpdateOrderQuantity(productId, userId, quantity) {
  try {
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('user_id', userId);
    formData.append('product_number', quantity);
    
    const res = await axiosClient.put('/api/order/update/product_id', formData);
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateOrderQuantity.name, "订单数量更新成功");
        return res.data;
    } else {
        showFail(apiUpdateOrderQuantity.name, res?.data?.message || "订单数量更新失败");
        throw new Error(res?.data?.message || "订单数量更新失败");
    }
  } catch (error) {
    showFail(apiUpdateOrderQuantity.name, error.message || "订单数量更新失败");
    throw error;
  }
}

export async function apiUpdateOrderStatus(formData) {
  try {
    // 直接使用传入的FormData或创建新的FormData
    if (!(formData instanceof FormData)) {
      const newFormData = new FormData();
      for (const key in formData) {
        newFormData.append(key, formData[key]);
      }
      formData = newFormData;
    }
    
    const res = await axiosClient.put('/api/order/update/state', formData);
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateOrderStatus.name, "订单状态更新成功");
        return res.data;
    } else {
        showFail(apiUpdateOrderStatus.name, res?.data?.message || "订单状态更新失败");
        throw new Error(res?.data?.message || "订单状态更新失败");
    }
  } catch (error) {
    showFail(apiUpdateOrderStatus.name, error.message || "订单状态更新失败");
    throw error;
  }
}

// 订单查询
export async function apiFindOrderById(orderId) {
  try {
    const res = await axiosClient.get(`/api/order/find-byorderid?order_id=${orderId}`);
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindOrderById.name, res?.data?.message || "查询订单失败");
        throw new Error(res?.data?.message || "查询订单失败");
    }
  } catch (error) {
    showFail(apiFindOrderById.name, error.message || "查询订单失败");
    throw error;
  }
}

export async function apiFindAllOrders() {
  try {
    const res = await axiosClient.get('/api/order/find-all');
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindAllOrders.name, res?.data?.message || "查询所有订单失败");
        throw new Error(res?.data?.message || "查询所有订单失败");
    }
  } catch (error) {
    showFail(apiFindAllOrders.name, error.message || "查询所有订单失败");
    throw error;
  }
}

// 删除订单
export async function apiDeleteOrder(orderId) {
  try {
    const formData = new FormData();
    formData.append('order_id', orderId);
    
    const res = await axiosClient.delete('/api/order/delete/order_id', {
      data: formData
    });
    if (res?.data?.code === 200) {
        showSuccess(apiDeleteOrder.name, "订单删除成功");
        return res.data;
    } else {
        showFail(apiDeleteOrder.name, res?.data?.message || "订单删除失败");
        throw new Error(res?.data?.message || "订单删除失败");
    }
  } catch (error) {
    showFail(apiDeleteOrder.name, error.message || "订单删除失败");
    throw error;
  }
}

export async function apiFindOrdersByUserId(userId) {
  try {
    const res = await axiosClient.get(`/api/order/find-byuserid?user_id=${userId}`);
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindOrdersByUserId.name, res?.data?.message || "按用户ID查询订单失败");
        throw new Error(res?.data?.message || "按用户ID查询订单失败");
    }
  } catch (error) {
    showFail(apiFindOrdersByUserId.name, error.message || "按用户ID查询订单失败");
    throw error;
  }
}

export async function apiUpdateOrderAddress(orderId, address) {
  try {
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('address', address);
    
    const res = await axiosClient.put('/api/order/update/address', formData);
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateOrderAddress.name, "订单地址更新成功");
        return res.data;
    } else {
        showFail(apiUpdateOrderAddress.name, res?.data?.message || "订单地址更新失败");
        throw new Error(res?.data?.message || "订单地址更新失败");
    }
  } catch (error) {
    showFail(apiUpdateOrderAddress.name, error.message || "订单地址更新失败");
    throw error;
  }
}
