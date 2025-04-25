<template>
  <div class="orders-container">
    <h1 class="page-title">订单管理</h1>
    
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
      />
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索订单号、商品名称或用户ID"
        style="width: 300px"
        @search="onSearch"
      />
    </div>

    <div v-if="loading" class="loading-container">
      <a-spin tip="加载订单中..." />
    </div>

    <div v-else-if="error" class="error-container">
      <a-alert type="error" :message="error" show-icon />
      <a-button type="primary" @click="fetchOrders" style="margin-top: 16px;">重试</a-button>
    </div>
    
    <div v-else-if="filteredOrders.length === 0" class="empty-orders">
      <a-empty :description="activeTab === 'all' ? '暂无订单' : `暂无${getStatusText(activeTab)}订单`" />
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
                  <span class="order-user">用户ID: {{ item.user_id }}</span>
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
                  <a-button 
                    v-if="item.order_state === 'pending'" 
                    type="primary" 
                    size="small" 
                    :loading="processingOrderId === item.order_id && processingAction === 'ship'" 
                    @click="markAsShipped(item)"
                  >
                    我已发货
                  </a-button>
                  <a-button 
                    v-if="item.order_state === 'pending' || item.order_state === 'shipped'" 
                    danger
                    size="small" 
                    :loading="processingOrderId === item.order_id && processingAction === 'cancel'" 
                    @click="cancelOrderAdmin(item)"
                  >
                    取消订单
                  </a-button>
                  <a-button size="small" @click="viewOrderDetail(item.order_id)">订单详情</a-button>
                </div>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </div>
    
    <!-- TODO: Implement Order Detail Modal or Page -->
    <!-- <OrderDetailModal v-model:visible="detailModalVisible" :orderId="selectedOrderId" /> -->
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { message, Tabs, TabPane, InputSearch, RangePicker, List, ListItem, Card, Empty, Button, Spin, Alert } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { apiFindAllOrders, apiMarkOrderAsShipped, apiCancelOrderByDeliver, apiFindOrdersByState } from '@/api/order';
import apiConfig from '@/config/api';

const router = useRouter();
const activeTab = ref('all');
const searchText = ref('');
const dateRange = ref(null);
const detailModalVisible = ref(false);
const selectedOrderId = ref(null);
const orders = ref([]);
const loading = ref(false);
const error = ref(null);
const processingOrderId = ref(null);
const processingAction = ref(null);

const getProductImage = (product) => {
  if (!product || !product.product_picture) return 'https://placehold.co/80x80?text=No+Image';
  
  const relativePath = product.product_picture;
  const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
  const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return baseUrl + imagePath;
};

const formatPrice = (price) => {
  if (typeof price !== 'number') {
      return '0.00';
  }
  return price.toFixed(2);
};

const mapFrontendStateToApiState = (frontendState) => {
  const map = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[frontendState] || frontendState;
};

const fetchOrders = async (state = null) => {
  loading.value = true;
  error.value = null;
  orders.value = [];

  try {
    let res;
    if (state && state !== 'all') {
        const apiState = mapFrontendStateToApiState(state);
        console.log(`Admin - Fetching orders with state: ${state} (API: ${apiState})`);
        res = await apiFindOrdersByState(apiState);
    } else {
        console.log('Admin - Fetching all orders');
        res = await apiFindAllOrders();
    }

    console.log(`Admin - API Response for orders (State: ${state || 'all'}):`, res);

    if (res && res.code === 200 && Array.isArray(res.list)) {
      const groupedOrders = {};
      res.list.forEach(item => {
        if (item.order_state === '购物车') {
            console.log(`Admin - 过滤掉购物车状态的订单项: Order ID ${item.order_id}, Product ID ${item.product_id}`);
            return; 
        }

        let internalState = 'unknown'; 
        switch (item.order_state) {
          case '待发货':
              internalState = 'pending'; break; 
          case '待收货':
          case '已发货':
              internalState = 'shipped'; break; 
          case '已完成': 
              internalState = 'completed'; break;
          case '已取消': 
              internalState = 'cancelled'; break;
          default: 
              console.warn(`Admin - 未知或非目标订单状态: ${item.order_state} for order ${item.order_id}`);
              internalState = 'unknown';
        }

        if (['pending', 'shipped', 'completed', 'cancelled', 'unknown'].includes(internalState)) {
            if (!groupedOrders[item.order_id]) {
              groupedOrders[item.order_id] = {
                order_id: item.order_id,
                order_state: internalState,
                user_id: item.user_id,
                orderDate: dayjs(item.order_time).format('YYYY-MM-DD HH:mm:ss'),
                create_time: item.order_time,
                products: []
              };
            }
            
            if (groupedOrders[item.order_id]) {
                groupedOrders[item.order_id].products.push({
                  product_id: item.product_id,
                  product_name: item.product_name,
                  quantity: item.product_number,
                  price: item.product_number > 0 ? (item.total_price / item.product_number) : 0, 
                  product_picture: item.product_img || null
                });
            }
        } else {
             console.log(`Admin - 过滤掉非目标状态的订单项: Order ID ${item.order_id}, State: ${item.order_state}`);
        }
      });
      
      orders.value = Object.values(groupedOrders);
      orders.value.sort((a, b) => dayjs(b.create_time).unix() - dayjs(a.create_time).unix());
      console.log("Admin - 重构后的订单数据:", JSON.parse(JSON.stringify(orders.value)));

    } else {
      if (res && res.code !== 200) {
           error.value = `获取订单失败: ${res.message || '未知错误'}`;
       } else if (!Array.isArray(res?.list)) {
           error.value = '获取订单失败: 返回的数据格式不正确';
       } else {
           console.log("Admin - 订单列表为空。");
       }
    }
  } catch (err) {
    console.error(`Admin - 获取订单失败 (State: ${state || 'all'}):`, err);
    error.value = err.message || '获取订单数据时发生网络或未知错误';
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

const filteredOrders = computed(() => {
  let result = orders.value; 

  if (activeTab.value !== 'all') {
    result = result.filter(order => order.order_state === activeTab.value);
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value;
    result = result.filter(order => {
      const orderDate = dayjs(order.create_time);
      return orderDate.isAfter(startDate.startOf('day')) && orderDate.isBefore(endDate.endOf('day'));
    });
  }

  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    result = result.filter(order => 
      order.order_id.toString().toLowerCase().includes(lowerSearch) ||
      order.user_id.toString().toLowerCase().includes(lowerSearch) ||
      (order.products && order.products.some(p => p.product_name && p.product_name.toLowerCase().includes(lowerSearch)))
    );
  }
  
  return result;
});

const pagination = {
  onChange: page => {
    console.log('Page changed to:', page);
  },
  pageSize: 5,
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待发货', 
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消',
    'unknown': '未知状态'
  };
  return statusMap[status] || status;
};

const getTotalPrice = (order) => {
  if (!order.products) return 0;
  return order.products.reduce((sum, product) => {
      const price = typeof product.price === 'number' ? product.price : 0;
      const quantity = typeof product.quantity === 'number' ? product.quantity : 0;
      return sum + price * quantity;
  }, 0);
};

const getTotalItems = (order) => {
  if (!order.products) return 0;
  return order.products.reduce((sum, product) => {
      const quantity = typeof product.quantity === 'number' ? product.quantity : 0;
      return sum + quantity;
  }, 0);
};

const onSearch = () => {
  console.log('Admin - Searching for:', searchText.value);
};

const handleTabChange = (newTabKey) => {
  searchText.value = '';
  dateRange.value = null;
  fetchOrders(newTabKey);
};

const markAsShipped = async (orderToMark) => {
  processingOrderId.value = orderToMark.order_id;
  processingAction.value = 'ship';
  try {
    const res = await apiMarkOrderAsShipped(orderToMark.order_id);
    if (res && res.code === 200) {
      fetchOrders(activeTab.value);
    } else {
      console.error("Admin - 标记发货失败 (API Response):", res);
    }
  } catch (err) {
    console.error("Admin - 标记发货失败 (Catch Block):", err);
  } finally {
    processingOrderId.value = null;
    processingAction.value = null;
  }
};

const cancelOrderAdmin = async (orderToCancel) => {
  processingOrderId.value = orderToCancel.order_id;
  processingAction.value = 'cancel';
  try {
    const res = await apiCancelOrderByDeliver(orderToCancel.order_id);
    if (res && res.code === 200) {
      fetchOrders(activeTab.value);
    } else {
      console.error('Admin - 取消订单失败 (API Response):', res);
    }
  } catch (error) {
    console.error('Admin - 取消订单失败 (Catch Block):', error);
  } finally {
    processingOrderId.value = null;
    processingAction.value = null;
  }
};

const viewOrderDetail = (orderId) => {
  console.log('Admin - 跳转到订单详情页:', orderId);
  router.push({ name: 'AdminOrderDetail', params: { id: orderId } }); 
};

const viewProductDetail = (productId) => {
    console.log('Admin - 查看商品详情:', productId);
    router.push(`/product/${productId}`); 
};

onMounted(() => {
  fetchOrders(activeTab.value);
});

</script>

<style scoped>
.orders-container {
  padding: 24px;
  background-color: #fff;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.orders-search {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
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
  text-align: center;
  padding: 40px 0;
}

.orders-list {
  margin-top: 0;
}

.order-card {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  transition: box-shadow 0.3s ease;
}

.order-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.order-info span {
  margin-right: 16px;
}

.order-number {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.order-user {
    font-style: normal;
    color: #888;
    font-size: 13px;
}

.order-status {
  font-weight: normal;
}

.status-pending { color: #faad14; }
.status-shipped { color: #1890ff; }
.status-completed { color: #52c41a; }
.status-cancelled { color: #bfbfbf; }
.status-unknown { color: #888; }

.order-products-list {
  padding: 16px;
}

.order-product-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}
.order-product-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.product-image-item {
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin-right: 16px;
  border-radius: 2px;
  cursor: pointer;
}

.product-details {
  flex-grow: 1;
  margin-right: 16px;
}

.product-name-item {
  font-weight: normal;
  margin-bottom: 4px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.85);
  transition: color 0.3s;
}
.product-name-item:hover {
    color: #1890ff;
}

.product-price-quantity {
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.product-subtotal {
    font-weight: normal;
    color: rgba(0, 0, 0, 0.85);
    min-width: 80px;
    text-align: right;
    font-size: 14px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e8e8e8;
}

.order-total {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.total-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff4d4f;
}

.order-actions .ant-btn {
  margin-left: 8px;
}
</style>
  
  

