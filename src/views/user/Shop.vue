<template>
  <div class="shop-container">
    <h1 class="page-title">商品列表</h1>
    
    <div class="shop-controls">
      <a-select
        v-model:value="categoryValue"
        style="width: 200px; margin-right: 16px;"
        placeholder="商品分类"
        @change="handleFilterChange"
        allowClear
      >
        <a-select-option value="">全部分类</a-select-option>
        <a-select-option value="electronics">电子产品</a-select-option>
        <a-select-option value="clothing">服装</a-select-option>
        <a-select-option value="food">食品</a-select-option>
        <a-select-option value="books">图书</a-select-option>
        <a-select-option value="裤子">裤子</a-select-option>
        <a-select-option value="衣服">衣服</a-select-option>
        <a-select-option value="鞋子">鞋子</a-select-option>
        <a-select-option value="化妆品">化妆品</a-select-option>
        <a-select-option value="美食">美食</a-select-option>
        <a-select-option value="嘻嘻">嘻嘻</a-select-option>
      </a-select>
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索商品名称"
        style="width: 300px"
        enter-button
        @search="handleSearch"
      />
    </div>

    <div v-if="loading" class="loading-indicator">
       <a-spin size="large" />
    </div>
    
    <div v-else-if="filteredProducts.length === 0" class="empty-products">
        <a-empty description="暂无符合条件的商品" />
    </div>

    <a-row v-else :gutter="[16, 16]" class="products-grid">
      <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(product) in paginatedProducts" :key="product.product_id">
        <a-card hoverable class="product-card" @click="viewProduct(product.product_id)">
          <template #cover>
            <img :src="getImageUrl(product.product_picture)" :alt="product.product_name" class="product-image" />
          </template>
          <template #actions>
            <span @click.stop="toggleLike(product)">
               <like-outlined key="like" /> {{ product.like_number || 0 }}
            </span>
          </template>
          <a-card-meta>
             <template #title>
                <div class="product-title">{{ product.product_name }}</div>
             </template>
             <template #description>
                <span class="product-price">¥{{ product.product_price.toFixed(2) }}</span>
             </template>
             <template #avatar>
               <a-tag color="blue">{{ product.product_class }}</a-tag>
             </template>
          </a-card-meta>
        </a-card>
      </a-col>
    </a-row>

    <div class="pagination-controls" v-if="!loading && filteredProducts.length > pagination.pageSize">
       <a-button @click="prevPage" :disabled="pagination.current <= 1">
           <LeftOutlined /> 上一页
       </a-button>
       <span class="current-page-indicator">第 {{ pagination.current }} 页</span>
       <a-button @click="nextPage" :disabled="!hasNextPage">
           下一页 <RightOutlined />
       </a-button>
    </div>
    
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message, Spin, Empty, Button as AButton, Select as ASelect, InputSearch as AInputSearch, SelectOption as ASelectOption, Tag as ATag, CardMeta as ACardMeta, Card as ACard, Row as ARow, Col as ACol } from 'ant-design-vue';
import { LikeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import { apiToggleProductLike } from '../../api/product_like';
import { apiFindAllProducts, apiSearchProducts, apiFindProductsByClass } from '../../api/product'; 
import apiConfig from '@/config/api';

const router = useRouter();
const searchValue = ref('');
const categoryValue = ref('');
const loading = ref(false);
const allFetchedProducts = ref([]);

const pagination = reactive({
  current: 1,
  pageSize: 12,
});

watch([categoryValue, searchValue], () => {
  pagination.current = 1;
});

const getImageUrl = (relativePath) => {
  if (relativePath) {
    const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
    const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return baseUrl + imagePath;
  } else {
    return 'https://placehold.co/300x200/EEE/AAA?text=暂无图片';
  }
};

const getUserId = () => {
   const storageKey = 'userInfo'; // Define key name clearly
   const userIdProperty = 'user_id'; // 修改为正确的属性名 'user_id' 而非 'userId'

   try {
     const userInfoString = localStorage.getItem(storageKey);
     console.log(`[getUserId] Value from localStorage for key '${storageKey}':`, userInfoString); // Log raw value

     if (userInfoString) {
       const userInfoObject = JSON.parse(userInfoString);
       console.log(`[getUserId] Parsed object from localStorage:`, userInfoObject); // Log parsed object

       if (userInfoObject && typeof userInfoObject === 'object' && userIdProperty in userInfoObject) {
           const id = userInfoObject[userIdProperty];
           console.log(`[getUserId] Found user ID:`, id);
           return id; 
       } else {
           console.error(`[getUserId] Parsed object does not contain property '${userIdProperty}':`, userInfoObject);
       }
     } else {
        console.warn(`[getUserId] No value found in localStorage for key: '${storageKey}'`);
     }
   } catch (e) {
     console.error(`[getUserId] Error parsing value from localStorage for key '${storageKey}':`, e);
   }
   
   console.warn(`[getUserId] Failed to get valid userId. Returning null.`);
   return null; // Return null if not found or error
};

const fetchProducts = async () => {
  loading.value = true;
  allFetchedProducts.value = [];
  pagination.current = 1;

  const apiCallParams = {
    ...(searchValue.value && { product_name: searchValue.value }), 
    ...(categoryValue.value && { product_class: categoryValue.value }),
  };
  
  console.log("Fetching ALL products with filters:", apiCallParams);

  try {
    let data;
    if (apiCallParams.product_class) {
       data = await apiFindProductsByClass(apiCallParams.product_class, apiCallParams);
    } else if (apiCallParams.product_name) {
       data = await apiSearchProducts(apiCallParams.product_name, {});
    } else {
       data = await apiFindAllProducts({});
    }

    if (data && Array.isArray(data.list)) {
       allFetchedProducts.value = data.list;
       console.log('全部商品获取/更新:', allFetchedProducts.value.length, 'items');
       if (pagination.current === 1) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
       }
    } else {
       console.error("API response format incorrect or no list:", data);
       allFetchedProducts.value = [];
       message.warning(data?.message || "未找到相关商品或获取失败");
    }

  } catch (error) {
    console.error("获取商品列表失败:", error);
    message.error('获取商品列表失败: ' + (error.message || '请稍后重试'));
    allFetchedProducts.value = [];
  } finally {
    loading.value = false;
  }
};

const filteredProducts = computed(() => {
   return allFetchedProducts.value; 
});

const paginatedProducts = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredProducts.value.slice(start, end);
});

const hasNextPage = computed(() => {
  return pagination.current * pagination.pageSize < filteredProducts.value.length;
});

const handleFilterChange = () => {
  fetchProducts();
};

const handleSearch = () => {
   fetchProducts();
};

const prevPage = () => {
    if (pagination.current > 1) {
        pagination.current--;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const nextPage = () => {
    if (hasNextPage.value) { 
        pagination.current++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const viewProduct = id => {
  // 使用路由名称和参数进行导航
  router.push({ name: 'ProductDetail', params: { id: id } });
};

const toggleLike = async (product) => { 
  const userId = getUserId();
  if (!userId) {
    message.warning('请先登录再点赞！');
    // Optionally redirect to login
    // router.push('/login');
    return;
  }

  const productId = product.product_id;
  const originalLikeCount = product.like_number || 0;
  
  // Optimistic UI update (optional but improves perceived performance)
  // product.like_number = originalLikeCount + 1; // Or toggle based on a 'liked' state if available
  // Consider adding a temporary 'loading' state to the like button

  try {
    const res = await apiToggleProductLike(userId, productId);
    if (res && res.code === 200) {
      // 点赞/取消点赞成功 (消息已由 API 函数显示)
      // 重新获取商品列表以更新点赞数
      fetchProducts(); 
    } else {
      // API 调用失败或返回非200状态码 (消息已由 API 函数显示)
      // 无需在此处额外操作
    }
  } catch (error) {
    // 网络错误或其他错误 (消息已由 API 函数显示)
    console.error("Error toggling like in Shop.vue:", error);
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.shop-container {
  padding: 24px;
}

.page-title {
  margin-bottom: 24px; 
  font-size: 24px; 
  font-weight: bold; 
}

.shop-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap; 
  gap: 16px;
  margin-bottom: 24px; 
  justify-content: flex-start; 
}

.loading-indicator, .empty-products {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    width: 100%;
}

.products-grid {
  margin-bottom: 24px;
}

.product-card {
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.product-image {
  height: 200px;
  width: 100%;
  object-fit: cover;
  background-color: #f0f0f0; 
}
.product-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px; 
}
.product-price {
    color: #ff4d4f; 
    font-size: 1.1em;
    font-weight: 500;
}

/* Action styles */
:deep(.ant-card-actions) {
    padding: 0;
}
:deep(.ant-card-actions > li) {
    margin: 12px 0;
    width: 100% !important; 
    text-align: center; 
    color: rgba(0, 0, 0, 0.45);
    transition: color 0.3s;
}
:deep(.ant-card-actions > li > span:hover) {
    color: #1890ff;
}

/* Custom Pagination Styles */
.pagination-controls {
  text-align: center;
  margin-top: 32px; 
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px; 
}

.current-page-indicator {
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
}

@media (max-width: 768px) {
   .shop-controls {
     justify-content: center; 
   }
   .shop-controls .ant-select,
   .shop-controls .ant-input-search {
       flex-grow: 1; 
       min-width: 180px; 
   }
}
</style>
