import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";
import { showSuccess, showFail } from '../utils/showMessage';

export const axiosClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000
});

// 购买，生成订单
export async function apiAddOrder(orderJsonData) {
  try {
    // 直接发送 JS 对象，Axios 会自动处理为 application/json
    const res = await axiosClient.post('/api/order/add/shop', orderJsonData);
    if (res?.data?.code === 200) {
        showSuccess(apiAddOrder.name, "添加成功");
        return res.data;
    } else {
        showFail(apiAddOrder.name, res?.data?.message || "添加失败");
        throw new Error(res?.data?.message || "添加失败");
    }
  } catch (error) {
    showFail(apiAddOrder.name, error.message || "添加失败");
    throw error;
  }
}

export async function apiAddtoCart(orderJsonData) {
  try {
    // 直接发送 JS 对象，Axios 会自动处理为 application/json
    const res = await axiosClient.post('/api/order/add/order', orderJsonData);
    if (res?.data?.code === 200) {
        showSuccess(apiAddtoCart.name, "添加成功");
        return res.data;
    } else {
        showFail(apiAddtoCart.name, res?.data?.message || "添加失败");
        throw new Error(res?.data?.message || "添加失败");
    }
  } catch (error) {
    showFail(apiAddtoCart.name, error.message || "添加失败");
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

// 标记订单为已发货 (使用 URL Params)
export async function apiMarkOrderAsShipped(orderId) {
  const functionName = apiMarkOrderAsShipped.name;
  try {
    // 使用 PUT 请求，将数据放在 URL 参数中，第三个参数是 config 对象
    const res = await axiosClient.put(`/api/order/deliver`, null, { 
      params: { 
          order_id: orderId,
          order_state: "待收货" 
      }
    });

    if (res?.data?.code === 200) {
        showSuccess(functionName, res.data.message || "订单标记为已发货成功");
        return res.data;
    } else {
        const errorMsg = res?.data?.message || "标记订单为已发货失败";
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || "标记订单为已发货时发生网络错误";
    showFail(functionName, errorMsg);
    throw error;
  }
}

// 取消订单 (通过 deliver 接口，使用 URL Params)
export async function apiCancelOrderByDeliver(orderId) {
  const functionName = apiCancelOrderByDeliver.name;
  try {
    // 使用 PUT 请求，将数据放在 URL 参数中
    const res = await axiosClient.put(`/api/order/deliver`, null, { 
      params: {
          order_id: orderId,
          order_state: "已取消" 
      }
    });

    if (res?.data?.code === 200) {
        showSuccess(functionName, res.data.message || "订单取消成功");
        return res.data;
    } else {
        const errorMsg = res?.data?.message || "取消订单失败";
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || "取消订单时发生网络错误";
    showFail(functionName, errorMsg);
    throw error;
  }
}

// 确认收货 (通过 deliver 接口，使用 URL Params)
export async function apiConfirmReceiptByDeliver(orderId) {
  const functionName = apiConfirmReceiptByDeliver.name;
  try {
    // 使用 PUT 请求，将数据放在 URL 参数中
    const res = await axiosClient.put(`/api/order/deliver`, null, { 
      params: {
          order_id: orderId,
          order_state: "已完成" 
      }
    });

    if (res?.data?.code === 200) {
        showSuccess(functionName, res.data.message || "确认收货成功");
        return res.data;
    } else {
        const errorMsg = res?.data?.message || "确认收货失败";
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || "确认收货时发生网络错误";
    showFail(functionName, errorMsg);
    throw error;
  }
}

// 根据状态查询订单 (可选择按用户过滤)
export async function apiFindOrdersByState(orderState, userId = null) {
  const functionName = apiFindOrdersByState.name;
  try {
    const params = { order_state: orderState };
    if (userId !== null) {
      params.user_id = userId;
    }
    
    // 假设后端接口是 /api/order/find/order_state
    const res = await axiosClient.get(`/api/order/find/order_state`, { params });

    if (res?.data?.code === 200) {
        // 查询成功不显示全局消息，由调用处处理
        return res.data; 
    } else {
        const errorMsg = res?.data?.message || `按状态查询订单失败 (State: ${orderState}, UserID: ${userId})`;
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || `按状态查询订单时发生网络错误 (State: ${orderState}, UserID: ${userId})`;
    showFail(functionName, errorMsg);
    throw error;
  }
}

export async function apiManagerFindOrdersByState(orderState, userId = null) {
  const functionName = apiManagerFindOrdersByState.name;
  try {
    const params = { order_state: orderState };
    if (userId !== null) {
      params.user_id = userId;
    }
    
    // 假设后端接口是 /api/order/find/order_state
    const res = await axiosClient.get(`/api/order/find-orderstate-userid`, { params });

    if (res?.data?.code === 200) {
        // 查询成功不显示全局消息，由调用处处理
        return res.data; 
    } else {
        const errorMsg = res?.data?.message || `按状态查询订单失败 (State: ${orderState}, UserID: ${userId})`;
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || `按状态查询订单时发生网络错误 (State: ${orderState}, UserID: ${userId})`;
    showFail(functionName, errorMsg);
    throw error;
  }
}

