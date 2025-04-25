<template>
  <div v-if="loading" class="loading-state">
    <a-spin size="large" tip="加载商品信息..."></a-spin>
  </div>

  <div v-else-if="error" class="error-state">
    <a-alert
      message="加载失败"
      :description="error"
      type="error"
      show-icon
    >
      <template #action>
        <a-button type="primary" @click="fetchProductDetails">重试</a-button>
        <a-button @click="goBack" style="margin-left: 8px">返回</a-button>
      </template>
    </a-alert>
  </div>
  
  <div v-else-if="product && product.product_id" class="product-detail-container">
    <a-breadcrumb class="breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <a @click="$router.push('/?category=' + product.product_class)">{{ product.product_class }}</a>
      </a-breadcrumb-item>
      <a-breadcrumb-item>{{ product.product_name }}</a-breadcrumb-item>
    </a-breadcrumb>
    
    <a-row :gutter="32">
      <a-col :span="24" :md="12" :lg="10">
        <div class="product-image-container">
          <img :src="getImageUrl(product.product_picture)" :alt="product.product_name" class="product-image" />
        </div>
      </a-col>
      
      <a-col :span="24" :md="12" :lg="14">
        <div class="product-info">
          <h1 class="product-name">{{ product.product_name }}</h1>
          
          <div class="product-likes">
            <like-outlined /> {{ product.like_number || 0 }} 人赞过
          </div>
          
          <div class="product-price-container">
            <div class="product-price">
              <span class="price-label">价格</span>
              <span class="price-value">¥{{ formatPrice(product.product_price) }}</span>
            </div>
            <div class="product-tags">
              <a-tag v-if="product.product_stock && product.product_stock > 0" color="green">有货</a-tag>
              <a-tag v-else color="red">无货</a-tag>
            </div>
          </div>
          
          <div class="product-specs">
            <div class="spec-item">
              <span class="spec-label">销量</span>
              <span class="spec-value">{{ product.sale_amount || 0 }}件</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">库存</span>
              <span class="spec-value">{{ product.product_stock === null ? 'N/A' : product.product_stock + '件' }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">商品编号</span>
              <span class="spec-value">{{ product.product_id }}</span>
            </div>
             <div class="spec-item" v-if="product.product_intro">
              <span class="spec-label">简介</span>
              <span class="spec-value">{{ product.product_intro }}</span>
            </div>
          </div>
          
          <a-divider />
          
          <div class="product-options">
            <div class="option-group">
              <div class="option-label">数量</div>
              <div class="option-values">
                <a-input-number 
                  v-model:value="quantity" 
                  :min="1" 
                  :max="product.product_stock || 1"
                  :disabled="!product.product_stock || product.product_stock <= 0"
                />
                 <span style="margin-left: 8px; color: #888">(库存: {{ product.product_stock || 0 }})</span>
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <a-button 
              type="primary" 
              size="large" 
              class="buy-now-btn"
              :disabled="!product.product_stock || product.product_stock <= 0 || quantity <= 0"
              @click="buyNow"
            >
              立即购买
            </a-button>
            <a-button 
              size="large" 
              class="add-to-cart-btn"
              :disabled="!product.product_stock || product.product_stock <= 0 || quantity <= 0"
              @click="addToCart"
            >
              加入购物车
            </a-button>
            <a-button 
              size="large" 
              class="like-btn"
              @click="toggleLike"
              :loading="likeLoading"
            >
              <like-outlined />
              点赞 ({{ product.like_number || 0 }})
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
  <div v-else class="not-found-state">
     <a-empty description="未找到该商品信息" />
     <a-button @click="goBack">返回商品列表</a-button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message, Spin, Alert, Breadcrumb, BreadcrumbItem, Row, Col, Tag, Divider, InputNumber, Button, Empty } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { LikeOutlined, LikeFilled } from '@ant-design/icons-vue';
import { apiFindProductById } from '@/api/product'; // 引入真实 API
import { apiAddOrder } from '@/api/order'; // 引入真实 API
import { apiToggleProductLike } from '@/api/product_like'; // 引入点赞 API
import apiConfig from '@/config/api'; // 引入 API 配置

const router = useRouter();
const route = useRoute();

const product = ref(null); // 初始化为 null
const loading = ref(true);
const error = ref(null);
const quantity = ref(1);
const isLiked = ref(false);
const likeLoading = ref(false);
const productId = ref(route.params.id);

// 获取用户ID的函数
const getUserId = () => {
   const storageKey = 'userInfo';
   const userIdProperty = 'user_id';
   try {
     const userInfoString = localStorage.getItem(storageKey);
     if (userInfoString) {
       const userInfoObject = JSON.parse(userInfoString);
       if (userInfoObject && typeof userInfoObject === 'object' && userIdProperty in userInfoObject) {
           return userInfoObject[userIdProperty];
       } 
     }
   } catch (e) {
     console.error(`[getUserId] Error getting user ID from localStorage:`, e);
   } 
   return null;
};

// 获取商品详情 (使用真实 API)
const fetchProductDetails = async () => {
  if (!productId.value) {
    error.value = "无效的商品ID";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  product.value = null; 

  try {
    const res = await apiFindProductById(productId.value);
    console.log("API Response for product detail:", res);
    if (res && res.code === 200 && res.product) {
      product.value = res.product;
      // 检查库存，调整默认购买数量
      if (!product.value.product_stock || product.value.product_stock <= 0) {
          quantity.value = 0;
          message.warning("该商品当前无货");
      } else {
          quantity.value = 1; 
      }
    } else {
      throw new Error(res?.message || "未找到商品信息或加载失败");
    }
  } catch (err) {
    console.error("获取商品详情失败:", err);
    error.value = err.message || "加载商品详情时发生错误";
    product.value = null; // 确保出错时 product 为 null
  } finally {
    loading.value = false;
  }
};

// 获取图片 URL
const getImageUrl = (relativePath) => {
  if (relativePath) {
    const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
    const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return baseUrl + imagePath;
  } else {
    return 'https://placehold.co/600x600/EEE/AAA?text=暂无图片';
  }
};

// 格式化价格
const formatPrice = (price) => {
  if (typeof price === 'number') {
      return price.toFixed(2);
  }
  return '0.00';
};

// 加入购物车 (使用真实 API)
const addToCart = async () => {
  const userId = getUserId();
  if (!userId) {
    message.error("请先登录");
    router.push('/login');
    return;
  }

  if (!product.value || quantity.value <= 0) {
    message.warning("请选择有效的商品和数量");
    return;
  }

  if (quantity.value > product.value.product_stock) {
      message.error("购买数量不能超过库存！");
      return;
  }

  // *** 构建符合后端 JSON 要求的对象 ***
  const orderData = {
    order_id: 0, // 按后端要求添加
    order_state: "购物车", // 状态为购物车
    product_number: quantity.value,
    // receiver: "待定", // 添加到购物车时通常不需要收货人
    // address: "待定", // 添加到购物车时通常不需要地址
    product_id: product.value.product_id,
    product_name: product.value.product_name, // *** 添加商品名称 ***
    user_id: userId,
    total_price: product.value.product_price * quantity.value, // 添加计算的总价
    // order_time: new Date().toISOString() // 通常不需要前端发送时间
  };

  console.log("准备加入购物车的数据 (JSON):", orderData);

  try {
    // apiAddOrder 内部处理消息
    await apiAddOrder(orderData); 
  } catch (err) {
    // apiAddOrder 内部处理消息
    console.error("添加到购物车失败 (catch block - ProductDetail):", err);
  }
};

// 立即购买 (使用真实 API)
const buyNow = async () => {
   const userId = getUserId();
   if (!userId) {
      message.error("请先登录");
      router.push('/login');
      return;
   }
   
   if (!product.value || quantity.value <= 0) {
      message.warning("请选择有效的商品和数量");
      return;
   }
   
   if (quantity.value > product.value.product_stock) {
      message.error("购买数量不能超过库存！");
      return;
   }

   // 准备传递给确认页面的项
   const itemForConfirmation = {
     product_id: product.value.product_id,
     product_name: product.value.product_name,
     product_price: product.value.product_price,
     product_picture: product.value.product_picture,
     product_stock: product.value.product_stock, 
     quantity: quantity.value, 
   };
   
   // 将其存储在 sessionStorage 中（作为数组，以便与购物车流程兼容）
   sessionStorage.setItem('orderConfirmationItems', JSON.stringify([itemForConfirmation]));
   
   // 导航到订单确认页面
   router.push('/confirm-order');
};

// 点赞/取消点赞 (使用真实 API)
const toggleLike = async () => {
   const userId = getUserId();
   if (!userId) {
      message.warning('请先登录再点赞！');
      return;
   }
   if (!product.value) return;
   
   likeLoading.value = true;
   
   try {
      // apiToggleProductLike handles showing success/error messages
      const res = await apiToggleProductLike(userId, product.value.product_id);
      if (res && res.code === 200) {
         // 点赞/取消点赞成功 (消息已由 API 函数显示)
         // 重新获取商品详情以更新点赞数
         fetchProductDetails(); 
         // 注意：isLiked 状态暂时不更新，因为没有可靠的方式判断当前状态
         // isLiked.value = res.like_number > originalLikeCount; // 移除此行
      } else {
         // API 调用失败或返回非200状态码 (消息已由 API 函数显示)
         console.error("点赞操作API未返回成功状态码 (ProductDetail):", res);
      }
   } catch (error) {
      // 网络错误或其他错误 (消息已由 API 函数显示)
      console.error("点赞操作失败 (catch block - ProductDetail):", error);
   } finally {
        likeLoading.value = false;
   }
};

// 返回上一页
const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchProductDetails();
});
</script>

<style scoped>
.product-detail-container {
  padding: 20px;
}

.loading-state,
.error-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px; /* Give some height */
  padding: 20px;
}

.error-state .ant-alert {
  width: 100%;
  max-width: 600px;
  text-align: left;
}

.breadcrumb {
  margin-bottom: 24px;
}

.product-image-container {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #f0f0f0;
  height: 400px; /* Fixed height */
  background-color: #fff; /* Ensure background */
}

.product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: none;
}

.product-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.product-likes {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #666;
}

.product-price-container {
  background-color: #fffbe6; /* Light yellow background */
  border: 1px solid #ffe58f;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.product-price {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
}

.price-label {
    color: #666;
    font-size: 14px;
}

.price-value {
  color: #ff4d4f;
  font-size: 28px;
  font-weight: bold;
}

.product-tags {
    margin-top: 8px;
}

.product-specs {
  margin-bottom: 16px;
}

.spec-item {
    display: flex;
    margin-bottom: 8px;
    font-size: 14px;
}

.spec-label {
    color: #666;
    width: 80px; /* Fixed width for alignment */
    flex-shrink: 0;
}

.spec-value {
    color: #333;
}

.product-options {
  margin-bottom: 24px;
}

.option-group {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.option-label {
  width: 80px;
  color: #666;
  font-size: 14px;
}

.product-actions {
  margin-top: 24px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.buy-now-btn,
.add-to-cart-btn,
.like-btn {
  flex-grow: 1; 
  min-width: 120px; 
}
</style>
  