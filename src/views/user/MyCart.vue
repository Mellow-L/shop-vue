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
        :disabled="!hasSelected"
        @click="removeSelectedItems"
      >
        删除选中 ({{ selectedRowKeys.length }})
      </a-button>
    </div>

    <div v-if="filteredCartItems.length === 0 && searchValue === ''" class="empty-cart">
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
        rowKey="id"
        :row-selection="rowSelection" 
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'image'">
            <img :src="record.image" :alt="record.name" class="product-image" />
          </template>
          
          <template v-else-if="column.key === 'name'">
            <a @click="$router.push(`/product/${record.id}`)">{{ record.name }}</a>
            <div class="product-category">{{ record.category }}</div>
          </template>
          
          <template v-else-if="column.key === 'price'">
            <span class="product-price">¥{{ record.price.toFixed(2) }}</span>
          </template>
          
          <template v-else-if="column.key === 'quantity'">
            <a-input-number
              v-model:value="record.quantity"
              :min="1"
              :max="99"
              @change="updateQuantity(record)"
            />
          </template>
          
          <template v-else-if="column.key === 'subtotal'">
            <span class="subtotal">¥{{ (record.price * record.quantity).toFixed(2) }}</span>
          </template>
          
          <template v-else-if="column.key === 'action'">
            <a-button type="link" danger @click="removeItem(record)">删除</a-button>
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
            <span class="total-price">¥{{ totalSelectedPrice.toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="cart-actions">
          <a-button @click="$router.push('/')">继续购物</a-button>
          <a-button 
            type="primary" 
            :disabled="!hasSelected"
            @click="checkoutSelected"
          >
            结算选中 ({{ selectedRowKeys.length }})
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'; 
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

// 搜索值
const searchValue = ref('');
// 选中行的 key
const selectedRowKeys = ref([]);

// 模拟购物车数据 (使用 reactive 以便过滤更新)
const cartItems = reactive([
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    price: 9999,
    category: '电子产品',
    quantity: 1,
    image: 'https://placehold.co/300x300?text=iPhone'
  },
  {
    id: 3,
    name: '有机水果礼盒',
    price: 199,
    category: '食品',
    quantity: 2,
    image: 'https://placehold.co/300x300?text=Fruits'
  },
  {
    id: 5,
    name: '智能手表',
    price: 1599,
    category: '电子产品',
    quantity: 1,
    image: 'https://placehold.co/300x300?text=Watch'
  },
  {
    id: 6, 
    name: '运动跑鞋', 
    price: 499, 
    category: '服装', 
    quantity: 1, 
    image: 'https://placehold.co/300x300?text=Shoes'
  }
]);

// 表格列配置 (保持不变)
const columns = [
  { title: '商品图片', key: 'image', width: 100 },
  { title: '商品名称', key: 'name', width: 300 },
  { title: '单价', key: 'price', width: 100 },
  { title: '数量', key: 'quantity', width: 120 },
  { title: '小计', key: 'subtotal', width: 120 },
  { title: '操作', key: 'action', width: 100 },
];

// 搜索过滤逻辑
const filteredCartItems = computed(() => {
  if (!searchValue.value) {
    return cartItems;
  }
  const lowerSearchValue = searchValue.value.toLowerCase();
  return cartItems.filter(item => 
    item.name.toLowerCase().includes(lowerSearchValue)
  );
});

const onSearch = () => {
  // 触发计算属性重新计算
};

// 行选择配置
const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const onSelectChange = keys => {
  selectedRowKeys.value = keys;
};

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: onSelectChange,
}));

// 计算选中项的总数和总价
const totalSelectedItems = computed(() => {
  return cartItems
    .filter(item => selectedRowKeys.value.includes(item.id))
    .reduce((sum, item) => sum + item.quantity, 0);
});

const totalSelectedPrice = computed(() => {
  return cartItems
    .filter(item => selectedRowKeys.value.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
});


const updateQuantity = (record) => {
  // 在实际应用中，这里应该调用API更新购物车数据
  console.log('更新数量:', record.id, record.quantity);
  // 注意：如果直接修改 cartItems 中的项，因为它是 reactive，表格会自动更新
};

// 删除单项
const removeItem = (record) => {
  const index = cartItems.findIndex(item => item.id === record.id);
  if (index !== -1) {
    cartItems.splice(index, 1); // 使用 splice 更新 reactive 数组
  }
  // 如果删除的项在选中项里，也要移除
  selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== record.id);
  message.success('商品已从购物车移除');
};

// 删除选中项
const removeSelectedItems = () => {
  const keysToRemove = new Set(selectedRowKeys.value);
  const remainingItems = cartItems.filter(item => !keysToRemove.has(item.id));
  // 直接替换 reactive 数组的内容
  cartItems.length = 0; 
  cartItems.push(...remainingItems);
  selectedRowKeys.value = []; // 清空选中项
  message.success('选中的商品已移除');
};

const router = useRouter();

// Checkout selected items
const checkoutSelected = () => {
  const selectedItems = cartItems.filter(item => selectedRowKeys.value.includes(item.id));
  if (selectedItems.length === 0) {
    message.warning('请先选择要结算的商品');
    return;
  }
  
  // Prepare items for confirmation page (ensure structure matches what OrderConfirmation expects)
  const itemsForConfirmation = selectedItems.map(item => ({
      product_id: item.id,
      product_name: item.name,
      product_price: item.price,
      product_picture: item.image,
      product_stock: 99, // Assuming a default stock if not available in cart data, adjust as needed
      quantity: item.quantity,
  }));

  // Store the selected items in sessionStorage
  sessionStorage.setItem('orderConfirmationItems', JSON.stringify(itemsForConfirmation));
  
  // Navigate to the confirmation page
  router.push('/confirm-order');
};

</script>

<style scoped>
.cart-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
}

/* 新增控件区域样式 */
.cart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap; /* 允许换行 */
  gap: 16px; /* 添加间距 */
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 40px 0;
}

.empty-cart .ant-btn {
  margin-top: 16px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
}

.product-category {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.product-price {
  font-weight: bold;
  color: #f5222d;
}

.subtotal {
  font-weight: bold;
  color: #f5222d;
}

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
  gap: 16px;
  min-width: 200px; /* 给总计区域一个最小宽度 */
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

@media (max-width: 992px) { /* 调整响应式断点 */
  .cart-controls {
    flex-direction: column; /* 在较小屏幕上垂直排列 */
    align-items: flex-start; /* 左对齐 */
  }
   .cart-controls .ant-input-search {
     width: 100%; /* 搜索框占满宽度 */
   }
}

@media (max-width: 768px) {
  .cart-footer {
    flex-direction: column;
    align-items: flex-end; /* 总计靠右 */
    gap: 16px;
  }
  
  .cart-actions {
    width: 100%;
    justify-content: flex-end; /* 按钮靠右 */
  }
  .cart-summary {
     width: 100%; /* 总计占满宽度 */
     align-items: flex-end; /* 总计内容靠右 */
  }
}
</style>
  