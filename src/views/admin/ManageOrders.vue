<template>
  <div class="orders-container">
    <h1 class="page-title">订单管理</h1>
    
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="all" tab="全部订单"></a-tab-pane>
      <a-tab-pane key="processing" tab="待发货"></a-tab-pane>
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
    
    <div v-if="filteredOrders.length === 0" class="empty-orders">
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
                     :src="product.product_picture || 'https://placehold.co/80x80?text=No+Image'" 
                     :alt="product.product_name" 
                     class="product-image-item" 
                     @click="viewProductDetail(product.product_id)"
                   />
                   <div class="product-details">
                     <div class="product-name-item" @click="viewProductDetail(product.product_id)">
                        {{ product.product_name }}
                     </div>
                     <div class="product-price-quantity">
                       ¥{{ product.price.toFixed(2) }} × {{ product.quantity }}
                     </div>
                   </div>
                    <div class="product-subtotal">
                      ¥{{ (product.price * product.quantity).toFixed(2) }}
                    </div>
                 </div>
              </div>
              
              <div class="order-footer">
                <div class="order-total">
                  共 {{ getTotalItems(item) }} 件商品， 合计： <span class="total-price">¥{{ getTotalPrice(item).toFixed(2) }}</span>
                </div>
                <div class="order-actions">
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
import { ref, computed, reactive } from 'vue';
import { message, Tabs, TabPane, InputSearch, RangePicker, List, ListItem, Card, Empty, Button } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

const router = useRouter();
const activeTab = ref('all');
const searchText = ref('');
const dateRange = ref(null);
const detailModalVisible = ref(false);
const selectedOrderId = ref(null);

// Static data mimicking user/MyOrders.vue but with potentially more orders/users
const orders = reactive([
  {
    order_id: 'ORD20240501001',
    order_state: 'completed',
    receiver: '张三', // Keep receiver/address? Not strictly needed for admin list view
    address: '北京市朝阳区xxx街道xxx号',
    user_id: 10001,
    orderDate: '2024-05-01 14:30:25', // Use same date format as user page for consistency
    paymentMethod: '支付宝',
    shippingFee: 0.00,
    products: [
      {
        product_id: 1,
        product_name: 'iPhone 15 Pro Max',
        product_picture: 'https://placehold.co/300x300?text=iPhone',
        price: 9999,
        quantity: 1
      }
    ],
     totalAmount: 9999 // Keep for reference, but calculate dynamically if needed
  },
  {
    order_id: 'ORD20240502002',
    order_state: 'shipped',
    receiver: '李四',
    address: '上海市浦东新区xxx路xxx号',
    user_id: 10002,
    orderDate: '2024-05-02 09:45:12',
    paymentMethod: '微信支付',
    shippingFee: 10.00,
    products: [
      {
        product_id: 3,
        product_name: '有机水果礼盒',
        product_picture: 'https://placehold.co/300x300?text=Fruits',
        price: 199,
        quantity: 2
      },
      {
        product_id: 7,
        product_name: '有机红茶',
        product_picture: 'https://placehold.co/300x300?text=Tea',
        price: 89,
        quantity: 1
      }
    ],
    totalAmount: 497
  },
  {
    order_id: 'ORD20240503003',
    order_state: 'cancelled',
    receiver: '王五',
    address: '广州市天河区xxx大道xxx号',
    user_id: 10003,
    orderDate: '2024-05-03 16:20:33',
    paymentMethod: '银联',
    shippingFee: 5.00,
    products: [
      {
        product_id: 5,
        product_name: '智能手表',
        product_picture: 'https://placehold.co/300x300?text=Watch',
        price: 1599,
        quantity: 1
      },
      {
        product_id: 8,
        product_name: '数据结构与算法',
        product_picture: 'https://placehold.co/300x300?text=Algorithm',
        price: 99,
        quantity: 1
      }
    ],
    totalAmount: 1703
  },
    {
    order_id: 'ORD20240504004',
    order_state: 'processing',
    receiver: '赵六',
    address: '深圳市南山区xxx科技园',
    user_id: 10001, // Same user as first order
    orderDate: '2024-05-04 11:05:00',
    paymentMethod: '微信支付',
    shippingFee: 8.00,
    products: [
      {
        product_id: 10,
        product_name: '无线蓝牙耳机',
        product_picture: 'https://placehold.co/300x300?text=Earbuds',
        price: 499,
        quantity: 1
      }
    ],
    totalAmount: 507
  }
]);

const filteredOrders = computed(() => {
  let result = orders; // Use static data directly

  // Filter by status tab
  if (activeTab.value !== 'all') {
    result = result.filter(order => order.order_state === activeTab.value);
  }

  // Filter by date range (using orderDate)
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value;
    result = result.filter(order => {
      const orderDate = dayjs(order.orderDate); // Use orderDate from static data
      return orderDate.isAfter(startDate.startOf('day')) && orderDate.isBefore(endDate.endOf('day'));
    });
  }

  // Filter by search text (order ID, product name, user ID)
  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    result = result.filter(order => 
      order.order_id.toLowerCase().includes(lowerSearch) ||
      order.user_id.toString().toLowerCase().includes(lowerSearch) || // Keep user ID search
      (order.products && order.products.some(p => p.product_name.toLowerCase().includes(lowerSearch)))
    );
  }
  
  // Sort orders by date, newest first
  result.sort((a, b) => dayjs(b.orderDate).unix() - dayjs(a.orderDate).unix());

  return result;
});

const pagination = {
  onChange: page => {
    console.log('Page changed to:', page);
  },
  pageSize: 5, // Match user page pagination for consistency
};

const getStatusText = (status) => {
  // Use the exact same map as user page
  const statusMap = {
    'processing': '待发货',
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

const getTotalPrice = (order) => {
  if (!order.products) return 0;
  return order.products.reduce((sum, product) => sum + product.price * product.quantity, 0);
};

const getTotalItems = (order) => {
  if (!order.products) return 0;
  return order.products.reduce((sum, product) => sum + product.quantity, 0);
};

const onSearch = () => {
  console.log('Searching for:', searchText.value);
};

const viewOrderDetail = (orderId) => {
  console.log('跳转到订单详情页:', orderId);
  // Option 1: Navigate to a detail page using named route
  router.push({ name: 'AdminOrderDetail', params: { id: orderId } }); 
  
  // Option 2: Show a modal (requires an OrderDetailModal component)
  // selectedOrderId.value = orderId;
  // detailModalVisible.value = true;
  
  // message.info(`功能待实现：查看订单 ${orderId} 的详情`); // Remove placeholder message
};

const viewProductDetail = (productId) => {
    console.log('查看商品详情:', productId);
    message.info(`功能待实现：查看商品 ${productId} 的详情`);
};

</script>

<style scoped>
.orders-container {
  padding: 24px;
  background-color: #fff; /* Changed back to white like user page */
}

.page-title {
  font-size: 20px; /* Matched user page font size */
  font-weight: 500;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.orders-search {
  margin-bottom: 20px;
  /* Removed background/shadow to match user page */
  /* padding: 16px; */ 
  /* background-color: #fff; */
  /* border-radius: 4px; */
  /* box-shadow: 0 1px 3px rgba(0,0,0,0.1); */
  display: flex;
  align-items: center;
}

.empty-orders {
  text-align: center;
  padding: 40px 0; /* Adjusted padding */
  /* Removed background/shadow/border */
}

.orders-list {
  margin-top: 0; /* Adjusted margin */
}

.order-card {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8; /* Added border like user page */
  border-radius: 2px; /* Matched user page border-radius */
  /* Removed box-shadow */
  transition: box-shadow 0.3s ease;
}

.order-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09); /* Matched user page hover shadow */
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 14px; /* Matched user page */
  color: rgba(0, 0, 0, 0.65); /* Matched user page */
}

.order-info span {
  margin-right: 16px;
}

.order-number {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85); /* Matched user page */
}

/* Added styles for user ID to differentiate */
.order-user {
    font-style: normal; /* Keep it standard */
    color: #888; /* Lighter color for less emphasis */
    font-size: 13px;
}

.order-status {
  font-weight: normal; /* Matched user page */
  /* Removed padding/border/font-size/text-transform defined below */
}

/* Status colors - kept admin version as they are more distinct */
.status-processing { color: #faad14; }
.status-shipped { color: #1890ff; }
.status-completed { color: #52c41a; }
.status-cancelled { color: #f5222d; }

.order-products-list {
  padding: 16px; /* Matched user page padding */
}

.order-product-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px; /* Matched user page */
  padding-bottom: 16px; /* Matched user page */
  border-bottom: 1px solid #e8e8e8; /* Matched user page */
}
.order-product-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.product-image-item {
  width: 80px; /* Matched user page */
  height: 80px; /* Matched user page */
  object-fit: cover;
  margin-right: 16px; /* Matched user page */
  border-radius: 2px; /* Matched user page */
  cursor: pointer;
  /* border: 1px solid #eee; */ /* Removed border */
}

.product-details {
  flex-grow: 1;
  margin-right: 16px;
}

.product-name-item {
  font-weight: normal; /* Matched user page */
  margin-bottom: 4px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.85); /* Matched user page */
  transition: color 0.3s;
}
.product-name-item:hover {
    color: #1890ff;
}

.product-price-quantity {
  color: rgba(0, 0, 0, 0.65); /* Matched user page */
  font-size: 14px; /* Matched user page */
}

.product-subtotal {
    font-weight: normal; /* Matched user page */
    color: rgba(0, 0, 0, 0.85); /* Matched user page */
    min-width: 80px;
    text-align: right;
    font-size: 14px; /* Added for consistency */
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px; /* Matched user page */
  border-top: 1px solid #e8e8e8;
}

.order-total {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85); /* Matched user page */
}

.total-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff4d4f; /* Matched user page price color */
}

.order-actions .ant-btn {
  margin-left: 8px;
}

/* Removed RangePicker width override */
/* :deep(.ant-picker) { */
/*   width: 300px !important; */ 
/* } */
</style>
  
  
