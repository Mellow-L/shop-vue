<template>
  <div class="cart-container">
    <h1 class="page-title">我的购物车</h1>
    
    <div class="cart-controls">
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索购物车中的商品"
        style="width: 300px; margin-bottom: 16px;"
        @search="onSearch"
        allow-clear
      />
      <a-button 
        type="primary" 
        danger 
        :disabled="!hasSelected || loading"
        :loading="deletingSelected"
        @click="removeSelectedItems"
      >
        删除选中 ({{ selectedRowKeys.length }})
      </a-button>
    </div>

    <a-spin :spinning="loading" tip="加载购物车...">
      <div v-if="error" class="error-state">
         <a-alert
           message="加载失败"
           :description="error"
           type="error"
           show-icon
         >
           <template #action>
             <a-button type="primary" @click="fetchCartItems">重试</a-button>
           </template>
         </a-alert>
      </div>
      
      <div v-else-if="filteredCartItems.length === 0 && searchValue === ''" class="empty-cart">
        <a-empty description="购物车还是空的" />
        <a-button type="primary" @click="$router.push('/')">去选购商品</a-button>
      </div>
      <div v-else-if="filteredCartItems.length === 0 && searchValue !== ''" class="empty-cart">
         <a-empty :description="`未找到与 '${searchValue}' 相关的商品`" />
      </div>
  
      <div v-else class="cart-content">
        <a-table
          :dataSource="filteredCartItems" 
          :columns="columns"
          :pagination="false"
          rowKey="order_id" 
          :row-selection="rowSelection" 
          :loading="loading" 
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'image'">
              <img :src="getImageUrl(record.product_picture)" :alt="record.product_name" class="product-image" />
            </template>
            
            <template v-else-if="column.key === 'name'">
              <a @click="$router.push(`/product/${record.product_id}`)">{{ record.product_name }}</a>
              <!-- <div class="product-category">{{ record.category }}</div> --> <!-- 暂时移除，API未提供 -->
            </template>
            
            <template v-else-if="column.key === 'price'">
              <span class="product-price">¥{{ formatPrice(record.product_price) }}</span>
            </template>
            
            <template v-else-if="column.key === 'quantity'">
              <a-input-number
                v-model:value="record.quantity"
                :min="1"
                :max="99" 
                @change="updateQuantity(record)"
                :disabled="record.updating" 
              />
            </template>
            
            <template v-else-if="column.key === 'subtotal'">
              <span class="subtotal">¥{{ formatPrice(record.product_price * record.quantity) }}</span>
            </template>
            
            <template v-else-if="column.key === 'action'">
              <a-button type="link" danger @click="removeItem(record)" :loading="record.deleting">删除</a-button>
            </template>
          </template>
        </a-table>
  
        <div class="cart-footer">
          <div class="cart-summary">
            <div class="summary-item">
              <span>已选商品总数:</span>
              <span>{{ totalSelectedItems }} 件</span>
            </div>
            <div class="summary-item">
              <span>已选商品总价:</span>
              <span class="total-price">¥{{ formatPrice(totalSelectedPrice) }}</span>
            </div>
          </div>
          
          <div class="cart-actions">
            <a-button @click="$router.push('/')">继续购物</a-button>
            <a-button 
              type="primary" 
              :disabled="!hasSelected || loading"
              @click="checkoutSelected"
            >
              结算选中 ({{ selectedRowKeys.length }})
            </a-button>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'; 
import { message, Spin, Empty, Button, InputSearch, Table, InputNumber, Alert } from 'ant-design-vue'; // 引入所需组件
import { useRouter } from 'vue-router';
import { apiFindAllOrders, apiUpdateOrderQuantity, apiDeleteCartItem } from '@/api/order'; // 引入 API
import apiConfig from '@/config/api'; // 引入 API 配置

const router = useRouter();

// State Refs
const searchValue = ref('');
const selectedRowKeys = ref([]);
const cartItems = ref([]); // 使用 ref 存储动态数据
const loading = ref(true);
const error = ref(null);
const deletingSelected = ref(false); // 删除选中按钮加载状态

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

// 获取图片 URL
const getImageUrl = (relativePath) => {
  if (relativePath) {
    const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
    const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return baseUrl + imagePath;
  } else {
    return 'https://placehold.co/80x80/EEE/AAA?text=No+Image'; // Placeholder
  }
};

// 格式化价格
const formatPrice = (price) => {
  if (typeof price === 'number') {
      return price.toFixed(2);
  }
  return '0.00';
};

// 获取购物车数据
const fetchCartItems = async () => {
  loading.value = true;
  error.value = null;
  const userId = getUserId();

  if (!userId) {
    error.value = "无法获取用户信息，请登录后查看购物车";
    loading.value = false;
    // 可选：跳转到登录页
    // router.push('/login');
    return;
  }

  try {
    const res = await apiFindAllOrders();
    console.log("API Response from apiFindAllOrders:", res);
    if (res && res.code === 200 && Array.isArray(res.list)) {
      const userCartItems = res.list
        .filter(item => item.user_id === userId && item.order_state === '购物车')
        .map(item => ({
            ...item, // 包含所有 API 返回的字段，如 order_id, product_id, user_id 等
            quantity: item.product_number, // 将 product_number 映射到 quantity
            // 计算单价，注意处理 quantity 为 0 的情况
            product_price: item.product_number > 0 ? (item.total_price / item.product_number) : 0, 
            // *** 添加图片字段映射 ***
            product_picture: item.product_img || null, // 假设API返回的是 product_img
            // 添加加载状态，用于后续操作
            updating: false, 
            deleting: false
        }));
      cartItems.value = userCartItems;
      console.log("Filtered Cart Items:", cartItems.value);
    } else {
      throw new Error(res?.message || "获取购物车数据失败");
    }
  } catch (err) {
    console.error("获取购物车失败:", err);
    error.value = err.message || "加载购物车时发生错误";
    cartItems.value = []; // 清空数据
  } finally {
    loading.value = false;
  }
};

// 表格列配置 (保持不变, 但移除 category)
const columns = [
  { title: '商品图片', key: 'image', width: 100 },
  { title: '商品名称', key: 'name', dataIndex: 'product_name', width: 300 }, // 使用 product_name
  { title: '单价', key: 'price', dataIndex: 'product_price', width: 100 }, // 使用计算出的 product_price
  { title: '数量', key: 'quantity', dataIndex: 'quantity', width: 120 }, // 使用 quantity
  { title: '小计', key: 'subtotal', width: 120 },
  { title: '操作', key: 'action', width: 100 },
];

// 搜索过滤逻辑
const filteredCartItems = computed(() => {
  if (!searchValue.value) {
    return cartItems.value;
  }
  const lowerSearchValue = searchValue.value.toLowerCase();
  // 确保访问 product_name 字段
  return cartItems.value.filter(item => 
    item.product_name && item.product_name.toLowerCase().includes(lowerSearchValue)
  );
});

const onSearch = () => {
};

// 行选择配置
const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const onSelectChange = keys => {
  selectedRowKeys.value = keys;
};

// rowKey 现在使用 order_id
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: onSelectChange,
}));

// 计算选中项的总数和总价
const totalSelectedItems = computed(() => {
  return cartItems.value
    .filter(item => selectedRowKeys.value.includes(item.order_id)) // 使用 order_id
    .reduce((sum, item) => sum + item.quantity, 0);
});

const totalSelectedPrice = computed(() => {
  return cartItems.value
    .filter(item => selectedRowKeys.value.includes(item.order_id)) // 使用 order_id
    .reduce((sum, item) => sum + item.product_price * item.quantity, 0);
});

// 更新数量 (调用 API)
const updateQuantity = async (record) => {
  const userId = getUserId();
  if (!userId) return; 
  
  record.updating = true; 
  try {
    const res = await apiUpdateOrderQuantity(record.product_id, userId, record.quantity);
    if (res && res.code === 200) {
      // *** 移除这里的 message.success，因为 API 函数已处理 ***
      // message.success("数量更新成功");
    } else {
      console.error("数量更新失败 (API Response):", res);
      await fetchCartItems(); 
    }
  } catch (error) {
    console.error("数量更新失败 (Catch Block):", error);
    await fetchCartItems(); 
  } finally {
    setTimeout(() => { record.updating = false; }, 300); 
  }
};

// 删除单项 (调用 API)
const removeItem = async (record) => {
  const userId = getUserId();
  if (!userId) return;

  record.deleting = true; 
  try {
    const res = await apiDeleteCartItem(record.product_id, userId);
    if (res && res.code === 200) {
      const index = cartItems.value.findIndex(item => item.order_id === record.order_id);
      if (index !== -1) {
        cartItems.value.splice(index, 1); 
      }
      selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== record.order_id);
      // *** 移除这里的 message.success，因为 API 函数已处理 ***
      // message.success('商品已从购物车移除');
    } else {
      console.error("删除商品失败 (API Response):", res);
    }
  } catch (error) {
    console.error("删除商品失败 (Catch Block):", error);
  } finally {
     record.deleting = false; 
  }
};

// 删除选中项 (调用 API)
const removeSelectedItems = async () => {
  const userId = getUserId();
  if (!userId || !hasSelected.value) return;

  deletingSelected.value = true;
  const keysToRemove = [...selectedRowKeys.value];
  const itemsToRemove = cartItems.value.filter(item => keysToRemove.includes(item.order_id));
  let successCount = 0;

  for (const item of itemsToRemove) {
      item.deleting = true; 
      try {
          const res = await apiDeleteCartItem(item.product_id, userId);
          if (res && res.code === 200) {
              successCount++;
          } else {
              // *** 只记录日志，不显示 message，因为 API 函数已处理 ***
              console.error(`删除商品 ${item.product_name} (ID: ${item.product_id}) 失败 (API Response):`, res);
          }
      } catch (error) {
           // *** 只记录日志，不显示 message，因为 API 函数已处理 ***
          console.error(`删除商品 ${item.product_name} (ID: ${item.product_id}) 失败 (Catch Block):`, error);
      }
  }
  
  // 全部完成后刷新列表并给出提示 (保留这里的总结性提示)
  await fetchCartItems(); 
  selectedRowKeys.value = []; 
  deletingSelected.value = false;
  
  if (successCount === itemsToRemove.length) {
      message.success(`成功移除 ${successCount} 件商品`);
  } else {
      message.warning(`移除了 ${successCount} / ${itemsToRemove.length} 件商品，部分商品移除失败，请重试。`);
  }
};

// 结算选中项
const checkoutSelected = () => {
  const selectedItems = cartItems.value.filter(item => selectedRowKeys.value.includes(item.order_id));
  if (selectedItems.length === 0) {
    message.warning('请先选择要结算的商品');
    return;
  }
  
  // 准备传递给确认页的数据
  const itemsForConfirmation = selectedItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price, // 使用计算出的单价
      product_picture: item.product_picture, // 传递图片路径
      // product_stock: 99, // 库存信息可能没有，按需处理
      quantity: item.quantity,
  }));

  sessionStorage.setItem('orderConfirmationItems', JSON.stringify(itemsForConfirmation));
  router.push('/confirm-order');
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchCartItems();
});

</script>

<style scoped>
.cart-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
}

/* Controls Area Styles */
.cart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap; 
  gap: 16px; 
}

/* Loading and Empty States */
.error-state {
    padding: 20px;
    display: flex;
    justify-content: center;
}
.error-state .ant-alert {
    max-width: 800px;
}
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 40px 0;
  min-height: 200px; /* Ensure space for empty state */
}

.empty-cart .ant-btn {
  margin-top: 16px;
}

/* Table Styles */
.product-image {
  width: 60px; /* Smaller image in table */
  height: 60px;
  object-fit: cover;
}

.product-category {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.product-price {
  /* font-weight: bold; */ /* Removed bold to match other columns */
  /* color: #f5222d; */ /* Price color can be default black */
}

.subtotal {
  font-weight: bold;
  color: #f5222d;
}

/* Footer Styles */
.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between; /* Align label and value */
  gap: 16px;
  min-width: 250px; /* Give more space */
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #f5222d;
}

.cart-actions {
  display: flex;
  gap: 16px;
}

/* Responsive adjustments */
@media (max-width: 992px) { 
  .cart-controls {
    flex-direction: column; 
    align-items: flex-start; 
  }
   .cart-controls .ant-input-search {
     width: 100%; 
   }
}

@media (max-width: 768px) {
  .cart-footer {
    flex-direction: column;
    align-items: flex-end; 
    gap: 16px;
  }
  
  .cart-actions {
    width: 100%;
    justify-content: flex-end; 
  }
  .cart-summary {
     width: 100%; 
     align-items: flex-end; 
  }
}
</style>
  