<template>
  <div class="orders-container">
    <h1 class="page-title">我的订单</h1>
    
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="all" tab="全部订单"></a-tab-pane>
      <a-tab-pane key="pending" tab="待付款"></a-tab-pane>
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
        placeholder="搜索订单号或商品名称"
        style="width: 300px"
        @search="onSearch"
      />
    </div>
    
    <div v-if="filteredOrders.length === 0" class="empty-orders">
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
                  <template v-if="item.order_state === 'pending'">
                     <a-button size="small" @click="cancelOrder(item)">取消订单</a-button>
                  </template>
                  <template v-else-if="item.order_state === 'shipped'">
                    <a-button type="primary" size="small" @click="confirmReceipt(item)">确认收货</a-button>
                  </template>
                  <template v-else-if="item.order_state === 'completed'">
                    <a-button size="small" @click="rebuyOrder(item)">再次购买</a-button>
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
import { ref, computed, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

const router = useRouter();
const activeTab = ref('all');
const searchText = ref('');
const dateRange = ref(null);

const orders = reactive([
  {
    order_id: 'ORD20240501001',
    order_state: 'completed',
    receiver: '张三',
    address: '北京市朝阳区xxx街道xxx号',
    user_id: 10001,
    orderDate: '2024-05-01 14:30:25',
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
     totalAmount: 9999
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
    order_state: 'pending',
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
  }
]);

const filteredOrders = computed(() => {
  let result = orders;
  if (activeTab.value !== 'all') {
    result = result.filter(order => order.order_state === activeTab.value);
  }
  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    result = result.filter(order => 
      order.order_id.toLowerCase().includes(lowerSearch) ||
      order.products.some(p => p.product_name.toLowerCase().includes(lowerSearch))
    );
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
    'pending': '待付款',
    'processing': '待发货',
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

const getTotalItems = (order) => {
  return order.products.reduce((sum, product) => sum + product.quantity, 0);
};

const getTotalPrice = (order) => {
  return order.products.reduce((sum, product) => sum + product.price * product.quantity, 0);
};

const onSearch = (value) => {
  console.log('搜索订单:', value);
};

const cancelOrder = (orderToCancel) => {
   const orderIndex = orders.findIndex(o => o.order_id === orderToCancel.order_id);
   if (orderIndex !== -1) {
       orders[orderIndex].order_state = 'cancelled';
       message.success(`订单已取消`);
   } else {
       message.error('取消订单失败');
   }
};

const confirmReceipt = (orderToConfirm) => {
  const orderIndex = orders.findIndex(o => o.order_id === orderToConfirm.order_id);
   if (orderIndex !== -1) {
       orders[orderIndex].order_state = 'completed';
        message.success(`已确认收货`);
   } else {
        message.error('确认收货失败');
   }
};

const rebuyOrder = (orderToRebuy) => {
  const newOrderId = `REBUY${Date.now()}`;
  const newOrderDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const newProducts = JSON.parse(JSON.stringify(orderToRebuy.products));
  const newTotalAmount = getTotalPrice(orderToRebuy);

  const newOrder = {
      ...orderToRebuy,
      order_id: newOrderId,
      order_state: 'pending',
      orderDate: newOrderDate,
      products: newProducts,
      totalAmount: newTotalAmount
  };

  orders.unshift(newOrder); 
  message.success('已根据原订单创建新订单，请在"待付款"中查看');
};

const viewOrderDetail = (orderId) => {
  router.push(`/order/${orderId}`);
};

const viewProductDetail = (productId) => {
    router.push(`/product/${productId}`);
}
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
.status-processing { color: #1890ff; background-color: #e6f7ff; border: 1px solid #91d5ff; }
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
  