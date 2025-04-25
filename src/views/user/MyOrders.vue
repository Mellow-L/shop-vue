<template>
  <div class="orders-container">
    <h1 class="page-title">我的订单</h1>
    
    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="all" tab="全部订单"></a-tab-pane>
      <a-tab-pane key="pending" tab="待发货"></a-tab-pane>
      <a-tab-pane key="shipped" tab="待收货"></a-tab-pane>
      <a-tab-pane key="completed" tab="已完成"></a-tab-pane>
      <a-tab-pane key="cancelled" tab="已取消"></a-tab-pane>
    </a-tabs>
    
    <div class="orders-search">
      <a-range-picker
        v-model:value="dateRange"
        :placeholder="['开始日期', '结束日期']"
        style="width: 300px; margin-right: 16px;"
        @change="onDateRangeChange"
      />
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索订单号或商品名称"
        style="width: 300px"
        @search="onSearch"
      />
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin tip="加载订单中..." />
    </div>
    
    <div v-else-if="error" class="error-container">
      <a-alert type="error" :message="error" show-icon />
      <a-button type="primary" @click="fetchUserOrders" style="margin-top: 16px;">重试</a-button>
    </div>
    
    <div v-else-if="filteredOrders.length === 0" class="empty-orders">
      <a-empty :description="activeTab === 'all' ? '暂无订单' : `暂无${getStatusText(activeTab)}订单`" />
      <a-button type="primary" @click="$router.push('/')">去选购商品</a-button>
    </div>
    
    <div v-else class="orders-list">
      <a-list
        :dataSource="filteredOrders"
        :pagination="pagination"
        :grid="{ gutter: 16, column: 1 }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card class="order-card" :body-style="{ padding: '16px' }">
              <div class="order-header">
                <div class="order-info">
                  <span class="order-number">订单号: {{ item.order_id }}</span> 
                  <span class="order-date">{{ item.orderDate }}</span> 
                </div>
                <div class="order-status" :class="'status-' + item.order_state">
                  {{ getStatusText(item.order_state) }}
                </div>
              </div>
              
              <div class="order-products-list">
                 <div v-for="product in item.products" :key="product.product_id" class="order-product-item">
                   <img 
                     :src="getProductImage(product)" 
                     :alt="product.product_name" 
                     class="product-image-item" 
                     @click="viewProductDetail(product.product_id)"
                   />
                   <div class="product-details">
                     <div class="product-name-item" @click="viewProductDetail(product.product_id)">
                        {{ product.product_name }}
                     </div>
                     <div class="product-price-quantity">
                       ¥{{ formatPrice(product.price) }} × {{ product.quantity }}
                     </div>
                   </div>
                    <div class="product-subtotal">
                      ¥{{ formatPrice(product.price * product.quantity) }}
                    </div>
                 </div>
              </div>
              
              <div class="order-footer">
                <div class="order-total">
                  共 {{ getTotalItems(item) }} 件商品， 合计： <span class="total-price">¥{{ formatPrice(getTotalPrice(item)) }}</span>
                </div>
                <div class="order-actions">
                  <template v-if="item.order_state === 'pending'">
                     <a-button size="small" :loading="processingOrderId === item.order_id" @click="cancelOrder(item)">取消订单</a-button>
                  </template>
                  <template v-else-if="item.order_state === 'shipped'">
                    <a-button type="primary" size="small" :loading="processingOrderId === item.order_id" @click="confirmReceipt(item)">确认收货</a-button>
                  </template>
                  <template v-else-if="item.order_state === 'completed'">
                    <a-button size="small" :loading="processingOrderId === item.order_id" @click="rebuyOrder(item)">再次购买</a-button>
                  </template>
                  <a-button size="small" @click="viewOrderDetail(item.order_id)">订单详情</a-button> 
                </div>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { message, Spin, Empty, Button as AButton, Select as ASelect, InputSearch as AInputSearch, SelectOption as ASelectOption, Tag as ATag, CardMeta as ACardMeta, Card as ACard, Row as ARow, Col as ACol, List as AList, Tabs as ATabs, TabPane as ATabPane, RangePicker as ARangePicker, Alert as AAlert } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { apiFindOrdersByUserId, apiUpdateOrderStatus, apiDeleteOrder } from '@/api/order';
import apiConfig from '@/config/api';

const router = useRouter();
const activeTab = ref('all');
const searchText = ref('');
const dateRange = ref(null);
const orders = ref([]);
const loading = ref(false);
const error = ref(null);
const processingOrderId = ref(null);

// 获取用户ID的函数
const getUserIdFromStorage = () => {
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
     console.error(`Error getting user ID from localStorage:`, e);
   } 
   console.warn('Failed to get user ID from localStorage.');
   return null;
};

// 获取商品图片完整URL
const getProductImage = (product) => {
  if (!product || !product.product_picture) return 'https://placehold.co/80x80?text=No+Image';
  
  const relativePath = product.product_picture;
  const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
  const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return baseUrl + imagePath;
};

// 格式化价格
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};

// 获取用户订单
const fetchUserOrders = async () => {
  const userId = getUserIdFromStorage();
  if (!userId) {
    error.value = '无法获取用户ID，请重新登录';
    return;
  }
  
  loading.value = true;
  error.value = null;
  orders.value = []; // Clear previous orders
  
  try {
    const res = await apiFindOrdersByUserId(userId);
    console.log("API Response for orders:", res); // Log API response

    // 检查 res.code 和 res.list
    if (res && res.code === 200 && Array.isArray(res.list)) {
      const groupedOrders = {};
      res.list.forEach(item => {
        // 过滤掉 '购物车' 状态的项
        if (item.order_state === '购物车') {
            console.log(`过滤掉购物车状态的订单项: Order ID ${item.order_id}, Product ID ${item.product_id}`);
            return; 
        }

        // 映射 API 状态到内部状态键 (需要根据实际 API 返回调整)
        let internalState = 'unknown'; 
        switch (item.order_state) {
          case '待发货': 
          case '已支付': 
              internalState = 'pending'; break; 
          case '已发货': 
              internalState = 'shipped'; break; 
          case '已完成': 
              internalState = 'completed'; break;
          case '已取消': 
              internalState = 'cancelled'; break;
          default: 
              console.warn(`未知的订单状态: ${item.order_state} for order ${item.order_id}`);
              internalState = item.order_state; // 保留原始状态以防万一
        }

        // 如果订单还未添加到 groupedOrders，则创建
        if (!groupedOrders[item.order_id]) {
          groupedOrders[item.order_id] = {
            order_id: item.order_id,
            order_state: internalState, // 使用映射后的内部状态
            receiver: item.receiver,
            address: item.address,
            user_id: item.user_id,
            orderDate: dayjs(item.order_time).format('YYYY-MM-DD HH:mm:ss'), // 使用 order_time
            create_time: item.order_time, // 保留原始时间，可能用于排序
            products: [] // 初始化 products 数组
          };
        }
        
        // 将当前项作为产品添加到对应订单的 products 数组中
        groupedOrders[item.order_id].products.push({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.product_number, // 使用 product_number 作为数量
          // --- 价格和图片处理 --- 
          // API 未直接提供单价，尝试从 total_price 计算 (如果 total_price 合理且 quantity > 0)
          // 注意：API 返回的 total_price 是 0.0，这里计算出的 price 会是 0 或 NaN
          price: item.product_number > 0 ? (item.total_price / item.product_number) : 0, 
          // *** 使用 API 返回的 product_img 填充 product_picture ***
          product_picture: item.product_img || null // 使用 API 返回的 product_img
        });
      });
      
      orders.value = Object.values(groupedOrders);
      console.log("重构后的订单数据 (排序前):", JSON.parse(JSON.stringify(orders.value))); // Log a copy before sorting

      // *** 添加排序逻辑：按 create_time 降序排列 (从新到旧) ***
      orders.value.sort((a, b) => {
          // 确保 create_time 存在且是有效日期字符串
          const dateA = a.create_time ? new Date(a.create_time) : new Date(0); // Default to epoch if invalid
          const dateB = b.create_time ? new Date(b.create_time) : new Date(0);
          return dateB - dateA; // Date 对象比较更可靠
      });
      console.log("重构后的订单数据 (排序后):", JSON.parse(JSON.stringify(orders.value))); // Log a copy after sorting

      if (orders.value.length === 0 && res.list.length > 0) {
          console.warn("API返回了数据，但过滤/重构后订单列表为空。可能所有订单都是'购物车'状态或其他未处理状态。")
          // 可以选择显示一个更具体的消息
          message.warning("未找到符合条件的订单记录（已过滤购物车状态）");
      }

    } else {
       // 处理 API 错误或返回数据格式不正确的情况
      if (res && res.code !== 200) {
           error.value = `获取订单失败: ${res.message || '未知错误'}`;
           console.error("API Error:", error.value);
       } else if (!Array.isArray(res.list)) {
           error.value = '获取订单失败: 返回的数据格式不正确';
           console.error("API Format Error:", error.value, "Response list:", res.list);
       } else {
           // 列表为空，但请求成功
           console.log("用户订单列表为空。");
       }
       orders.value = []; // 确保在出错或无数据时清空
    }
  } catch (err) {
    console.error('获取订单失败 (catch block):', err);
    error.value = err.message || '获取订单数据时发生网络或未知错误';
  } finally {
    loading.value = false;
  }
};

// 过滤订单
const filteredOrders = computed(() => {
  let result = orders.value;
  
  // 按状态过滤
  if (activeTab.value !== 'all') {
    result = result.filter(order => order.order_state === activeTab.value);
  }
  
  // 按搜索文本过滤
  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    result = result.filter(order => 
      order.order_id.toLowerCase().includes(lowerSearch) ||
      order.products.some(p => p.product_name.toLowerCase().includes(lowerSearch))
    );
  }
  
  // 按日期范围过滤
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const startDate = dateRange.value[0].startOf('day');
    const endDate = dateRange.value[1].endOf('day');
    
    result = result.filter(order => {
      const orderDate = dayjs(order.create_time);
      return orderDate.isAfter(startDate) && orderDate.isBefore(endDate);
    });
  }
  
  return result;
});

const pagination = {
  onChange: page => {
    console.log(page);
  },
  pageSize: 5,
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待发货',
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消',
    'unknown': '未知状态' // 添加未知状态的处理
  };
  return statusMap[status] || status;
};

const getTotalItems = (order) => {
  return order.products.reduce((sum, product) => sum + product.quantity, 0);
};

const getTotalPrice = (order) => {
  return order.products.reduce((sum, product) => sum + product.price * product.quantity, 0);
};

const handleTabChange = () => {
  // 标签页变化时重置搜索和日期
  searchText.value = '';
  dateRange.value = null;
};

const onSearch = (value) => {
  searchText.value = value;
  console.log('搜索订单:', value);
};

const onDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    console.log('日期范围:', dates[0].format('YYYY-MM-DD'), '至', dates[1].format('YYYY-MM-DD'));
  }
};

// 取消订单
const cancelOrder = async (orderToCancel) => {
  processingOrderId.value = orderToCancel.order_id;
  
  try {
    // 使用 apiDeleteOrder 函数来删除订单
    const res = await apiDeleteOrder(orderToCancel.order_id);
    
    if (res && res.code === 200) {
      // 订单删除成功 (消息已由 API 函数显示)
      // 重新获取订单列表以更新界面
      fetchUserOrders();
    } else {
      // 删除失败 (消息已由 API 函数显示)
      console.error('取消订单失败 (API Response in MyOrders):', res);
    }
  } catch (error) {
    // 网络错误或其他错误 (消息已由 API 函数显示)
    console.error('取消订单失败 (Catch Block in MyOrders):', error);
  } finally {
    processingOrderId.value = null;
  }
};

// 确认收货
const confirmReceipt = async (orderToConfirm) => {
  processingOrderId.value = orderToConfirm.order_id;
  
  try {
    const formData = new FormData();
    formData.append('order_id', orderToConfirm.order_id);
    formData.append('state', 'completed');
    
    const res = await apiUpdateOrderStatus(formData);
    
    if (res && res.code === 200) {
      // 更新本地订单状态
      const orderIndex = orders.value.findIndex(o => o.order_id === orderToConfirm.order_id);
      if (orderIndex !== -1) {
        orders.value[orderIndex].order_state = 'completed';
      }
    } else {
      console.error('确认收货失败 (API Response in MyOrders):', res);
    }
  } catch (error) {
    console.error('确认收货失败 (Catch Block in MyOrders):', error);
  } finally {
    processingOrderId.value = null;
  }
};

// 再次购买
const rebuyOrder = async (orderToRebuy) => {
  processingOrderId.value = orderToRebuy.order_id;
  console.log("尝试再次购买订单:", orderToRebuy);
  
  try {
    // TODO: 实现真正的再次购买逻辑
    // 1. 获取订单中的所有 product_id 和 quantity
    // 2. 调用加入购物车的 API (可能需要循环调用或后端支持批量添加)
    // 3. 提示用户商品已添加到购物车
    
    message.info("再次购买功能待实现。商品信息已记录，将跳转到首页。");
    // 示例：记录要购买的商品
    orderToRebuy.products.forEach(p => {
      console.log(`  - 产品 ID: ${p.product_id}, 数量: ${p.quantity}`);
    });
    // router.push('/'); // 跳转到首页或购物车
    
  } catch (error) {
    console.error('再次购买失败:', error);
    message.error(error.message || '再次购买时发生错误');
  } finally {
    processingOrderId.value = null;
  }
};

const viewOrderDetail = (orderId) => {
  // Use named route for navigation
  router.push({ name: 'OrderDetail', params: { id: orderId } });
};

const viewProductDetail = (productId) => {
    router.push(`/product/${productId}`);
};

// 组件挂载时获取订单数据
onMounted(() => {
  fetchUserOrders();
});
</script>

<style scoped>
.orders-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 16px;
}

.orders-search {
  margin: 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 40px 0;
}

.empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 40px 0;
}

.empty-orders .ant-btn {
  margin-top: 16px;
}

.order-card {
    margin-bottom: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; 
  gap: 8px 16px;
  margin-bottom: 12px;
}

.order-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #666;
}

.order-number {
  color: #333;
  font-weight: 500;
}

.order-status {
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 8px;
}

.status-pending { color: #faad14; background-color: #fffbe6; border: 1px solid #ffe58f; }
.status-shipped { color: #722ed1; background-color: #f9f0ff; border: 1px solid #d3adf7; }
.status-completed { color: #52c41a; background-color: #f6ffed; border: 1px solid #b7eb8f; }
.status-cancelled { color: #bfbfbf; background-color: #fafafa; border: 1px solid #d9d9d9; }

.order-products-list {
    margin-top: 12px;
    margin-bottom: 12px;
}

.order-product-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    gap: 12px;
    border-bottom: 1px solid #f0f0f0;
}

.order-product-item:last-child {
    border-bottom: none;
}

.product-image-item {
  width: 60px;
  height: 60px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 4px;
}

.product-details {
    flex-grow: 1;
}

.product-name-item {
    margin-bottom: 4px;
    cursor: pointer;
    color: #333;
}

.product-name-item:hover {
    color: #1890ff;
}

.product-price-quantity {
    font-size: 12px;
    color: #999;
}

.product-subtotal {
    font-weight: 500;
    color: #333;
    width: 80px;
    text-align: right;
    flex-shrink: 0;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; 
  gap: 16px;
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.order-total {
    font-size: 14px;
}

.total-price {
  font-weight: bold;
  color: #f5222d;
  font-size: 16px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
   .order-footer {
     flex-direction: column;
     align-items: flex-end; 
   }
   .order-total {
       width: 100%; 
       text-align: right; 
       margin-bottom: 8px;
   }
   .order-actions {
       width: 100%; 
        justify-content: flex-end; 
   }
}
</style>
  