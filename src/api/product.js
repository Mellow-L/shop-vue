import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";
import { showSuccess, showFail } from '../utils/showMessage';

export const axiosClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000
});


// 添加商品
export async function apiAddProduct(productData) {
  try {
    const res = await axios.post('/api/product/addProduct', productData);
    if (res?.data?.code === 200) {
        showSuccess(apiAddProduct.name, "商品添加成功");
        return res.data;
    } else {
        showFail(apiAddProduct.name, res?.data?.message || "商品添加失败");
        throw new Error(res?.data?.message || "商品添加失败");
    }
  } catch (error) {
    showFail(apiAddProduct.name, error.message || "商品添加失败");
    throw error;
  }
}

// 添加商品图片
export async function apiAddProductPicture(productId, picture) {
  try {
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('product_picture', picture);
    const res = await axios.put('/api/product/add/product_picture', formData);
    if (res?.data?.code === 200) {
        showSuccess(apiAddProductPicture.name, "商品图片上传成功");
        return res.data;
    } else {
        showFail(apiAddProductPicture.name, res?.data?.message || "商品图片上传失败");
        throw new Error(res?.data?.message || "商品图片上传失败");
    }
  } catch (error) {
    showFail(apiAddProductPicture.name, error.message || "商品图片上传失败");
    throw error;
  }
}

// 商品查询
export async function apiFindAllProducts(params = {}) {
  try {
    const res = await axios.get('/api/product/find-all', { params });
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindAllProducts.name, res?.data?.message || "查询所有商品失败");
        throw new Error(res?.data?.message || "查询所有商品失败");
    }
  } catch (error) {
    showFail(apiFindAllProducts.name, error.message || "查询所有商品失败");
    throw error;
  }
}

export async function apiFindProductsByClass(productClass, params = {}) {
  try {
    const queryParams = { ...params, product_class: productClass };
    const res = await axios.get('/api/product/find-byclass', { params: queryParams });
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindProductsByClass.name, res?.data?.message || "按类别查询商品失败");
        throw new Error(res?.data?.message || "按类别查询商品失败");
    }
  } catch (error) {
    showFail(apiFindProductsByClass.name, error.message || "按类别查询商品失败");
    throw error;
  }
}

export async function apiFindProductById(productId) {
  try {
    const res = await axios.get(`/api/product/find-byid?product_id=${productId}`);
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiFindProductById.name, res?.data?.message || "按ID查询商品失败");
        throw new Error(res?.data?.message || "按ID查询商品失败");
    }
  } catch (error) {
    showFail(apiFindProductById.name, error.message || "按ID查询商品失败");
    throw error;
  }
}

export async function apiSearchProducts(productName, params = {}) {
  try {
    const queryParams = { ...params, product_name: productName };
    const res = await axios.get('/api/product/search', { params: queryParams });
    if (res?.data?.code === 200) {
        return res.data;
    } else {
        showFail(apiSearchProducts.name, res?.data?.message || "搜索商品失败");
        throw new Error(res?.data?.message || "搜索商品失败");
    }
  } catch (error) {
    showFail(apiSearchProducts.name, error.message || "搜索商品失败");
    throw error;
  }
}

// 商品管理
export async function apiDeleteProduct(productId) {
  const functionName = apiDeleteProduct.name;
  try {
    // Use DELETE method, send product_id as a query parameter
    const res = await axiosClient.delete(`/api/product/delete/product_id`, {
        params: { product_id: productId } 
    });
    if (res?.data?.code === 200) {
        showSuccess(functionName, "商品删除成功");
        return res.data;
    } else {
        const errorMsg = res?.data?.message || "商品删除失败";
        showFail(functionName, errorMsg);
        throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMsg = error.message || "商品删除时发生网络错误";
    showFail(functionName, errorMsg);
    throw error;
  }
}

export async function apiUpdateProduct(productData) {
  try {
    const res = await axios.put('/api/product/update/productinfo', qs.stringify(productData));
    if (res?.data?.code === 200) {
        showSuccess(apiUpdateProduct.name, "商品信息更新成功");
        return res.data;
    } else {
        showFail(apiUpdateProduct.name, res?.data?.message || "商品信息更新失败");
        throw new Error(res?.data?.message || "商品信息更新失败");
    }
  } catch (error) {
    showFail(apiUpdateProduct.name, error.message || "商品信息更新失败");
    throw error;
  }
}