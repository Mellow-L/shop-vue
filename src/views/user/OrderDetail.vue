<template>
  <div class="order-detail-container" v-if="order">
    <a-breadcrumb class="breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/orders">我的订单</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>订单详情</a-breadcrumb-item>
    </a-breadcrumb>

    <a-card title="订单信息" style="margin-bottom: 24px;">
      <a-descriptions bordered :column="{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" layout="vertical">
        <a-descriptions-item label="订单号" :span="1">{{ order.order_id }}</a-descriptions-item>
        <a-descriptions-item label="订单状态" :span="1">
          <a-tag :color="getStatusColor(order.order_state)">{{ getStatusText(order.order_state) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="订单总额" :span="{ xxl: 1, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="total-amount-desc">
          <span class="total-amount-value">¥{{ order.totalAmount.toFixed(2) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="商品总数" :span="1">{{ getTotalItems(order) }} 件</a-descriptions-item>
        <a-descriptions-item label="下单时间" :span="1">{{ order.orderDate }}</a-descriptions-item>
        <a-descriptions-item label="用户ID" :span="1">{{ order.user_id }}</a-descriptions-item>
        <a-descriptions-item label="用户邮箱" :span="{ xxl: 2, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }">{{ order.userEmail || 'N/A' }}</a-descriptions-item>
        <a-descriptions-item label="收货人" :span="1">{{ order.receiver }}</a-descriptions-item>
        <a-descriptions-item label="收货地址" :span="{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }">{{ order.address }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="商品列表" style="margin-bottom: 24px;">
      <a-table
        :dataSource="order.products"
        :columns="productColumns"
        :pagination="false"
        rowKey="product_id"
        :scroll="{ x: 600 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'product_picture'">
            <img :src="record.product_picture || 'https://placehold.co/80x80?text=No+Image'" :alt="record.product_name" class="product-image" />
          </template>
          <template v-else-if="column.key === 'product_id'">
             <span>{{ record.product_id }}</span>
          </template>
          <template v-else-if="column.key === 'product_name'">
            <router-link :to="`/product/${record.product_id}`">{{ record.product_name }}</router-link>
          </template>
          <template v-else-if="column.key === 'price'">
            <span class="price">¥{{ record.price.toFixed(2) }}</span> 
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span>× {{ record.quantity }}</span> 
          </template>
          <template v-else-if="column.key === 'subtotal'">
            <span class="subtotal">¥{{ (record.price * record.quantity).toFixed(2) }}</span> 
          </template>
        </template>
      </a-table>
    </a-card>

    <div class="order-actions-footer">
      <template v-if="order.order_state === 'pending'">
        <a-button @click="cancelOrder(order)">取消订单</a-button>
      </template>
      <template v-else-if="order.order_state === 'shipped'">
        <a-button type="primary" @click="confirmReceipt(order)">确认收货</a-button>
      </template>
      <template v-else-if="order.order_state === 'completed'">
        <a-button type="primary" @click="likeOrderProducts(order)">
           <LikeOutlined /> 点赞商品
        </a-button>
        <a-button @click="rebuyOrder(order)">再次购买</a-button>
      </template>
       <a-button @click="$router.push('/orders')">返回订单列表</a-button>
    </div>

  </div>
  <div v-else class="loading-state">
    <a-spin size="large" tip="加载订单详情中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { LikeOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();
const order = ref(null);

const productColumns = [
  { title: '商品', key: 'product_picture', width: 80 }, 
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name', ellipsis: true }, 
  { title: '商品ID', dataIndex: 'product_id', key: 'product_id', width: 100, align: 'center' }, 
  { title: '单价', key: 'price', width: 100, align: 'right' },
  { title: '数量', key: 'quantity', width: 80, align: 'center' }, 
  { title: '小计', key: 'subtotal', width: 120, align: 'right' },
];

const fetchOrderDetail = async (orderId) => {
  console.log('Fetching order detail for:', orderId);
  await new Promise(resolve => setTimeout(resolve, 500)); 
  const mockOrders = {
    'ORD20240501001': {
      order_id: 'ORD20240501001',
      user_id: 10001,
      userEmail: 'user1@example.com',
      order_state: 'completed',
      orderDate: '2024-05-01 14:30:25', 
      receiver: '张三',
      address: '北京市朝阳区xxx街道xxx号',
      products: [
        {
          product_id: 1,
          product_name: 'iPhone 15 Pro Max Extra Long Name For Testing Ellipsis',
          price: 9999,
          quantity: 1,
          product_picture: 'https://placehold.co/300x300?text=iPhone'
        }
      ],
      totalAmount: 9999,
    },
    'ORD20240502002': {
      order_id: 'ORD20240502002',
      user_id: 10002,
      userEmail: 'user2@example.com',
      order_state: 'shipped',
      orderDate: '2024-05-02 09:45:12',
      receiver: '李四',
      address: '上海市浦东新区xxx路xxx号',
      products: [
        {
          product_id: 3,
          product_name: '有机水果礼盒',
          price: 199,
          quantity: 2,
          product_picture: 'https://placehold.co/300x300?text=Fruits'
        },
        {
          product_id: 7,
          product_name: '有机红茶',
          price: 89,
          quantity: 1,
          product_picture: 'https://placehold.co/300x300?text=Tea'
        }
      ],
      totalAmount: 487,
    },
     'ORD20240503003': {
      order_id: 'ORD20240503003',
      user_id: 10003,
      userEmail: 'user3@example.com',
      order_state: 'pending',
      orderDate: '2024-05-03 16:20:33',
      receiver: '王五',
      address: '广州市天河区xxx大道xxx号',
      products: [
        {
          product_id: 5,
          product_name: '智能手表',
          price: 1599,
          quantity: 1,
          product_picture: 'https://placehold.co/300x300?text=Watch'
        },
        {
          product_id: 8,
          product_name: '数据结构与算法',
          price: 99,
          quantity: 1,
          product_picture: 'https://placehold.co/300x300?text=Algorithm'
        }
      ],
      totalAmount: 1698,
    }
  };
  order.value = mockOrders[orderId] || null; 
};

onMounted(() => {
  const orderId = route.params.id;
  if (orderId) {
    fetchOrderDetail(orderId);
  } else {
    message.error('无效的订单ID');
    router.push('/orders');
  }
});

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

const getStatusColor = (status) => {
   const colorMap = {
    'pending': 'orange',
    'processing': 'blue',
    'shipped': 'purple',
    'completed': 'green',
    'cancelled': 'red'
  };
  return colorMap[status] || 'default';
};

const getTotalItems = (currentOrder) => {
  if (!currentOrder || !currentOrder.products) return 0;
  return currentOrder.products.reduce((sum, product) => sum + product.quantity, 0);
};

const cancelOrder = (currentOrder) => {
  message.success(`订单已取消`);
  if (order.value && order.value.order_id === currentOrder.order_id) {
      order.value.order_state = 'cancelled';
  }
};

const confirmReceipt = (currentOrder) => {
  message.success(`已确认收货`);
   if (order.value && order.value.order_id === currentOrder.order_id) {
      order.value.order_state = 'completed';
  }
};

const likeOrderProducts = (currentOrder) => {
  const productNames = currentOrder.products.map(p => p.product_name).join(', ');
  message.success(`点赞成功: ${productNames}`);
};

const rebuyOrder = (currentOrder) => {
  message.success(`已将订单商品添加到购物车`);
};
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
}

.breadcrumb {
  margin-bottom: 24px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

:deep(.ant-table-tbody > tr > td) {
    padding: 12px 8px;
}

.price {
    color: #f5222d;
}

.subtotal {
  font-weight: 500;
}

.order-actions-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end; 
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

:deep(.ant-descriptions-item-label) {
    color: #666;
    padding-bottom: 4px !important;
    font-weight: normal !important;
}

:deep(.ant-descriptions-item-content) {
    font-weight: normal;
    padding-bottom: 12px !important;
}

.total-amount-desc :deep(.ant-descriptions-item-content) {
    font-weight: bold;
}

.total-amount-value {
  font-size: 1.2em;
  font-weight: bold;
  color: #f5222d;
}
</style>
