<template>
  <div v-if="loading" class="loading-state">
    <a-spin size="large" tip="加载订单详情中..."></a-spin>
  </div>

  <div v-else-if="error" class="error-state">
    <a-alert
      message="加载订单失败"
      :description="error"
      type="error"
      show-icon
    >
      <template #action>
        <a-button type="primary" @click="fetchOrderDetails">重试</a-button>
        <a-button @click="goBack" style="margin-left: 8px">返回列表</a-button>
      </template>
    </a-alert>
  </div>

  <div v-else-if="order" class="order-detail-container">
    <a-page-header
      class="site-page-header"
      :title="`订单详情 (ID: ${order.order_id})`"
      @back="goBack"
    >
       <template #tags>
         <a-tag :color="getStatusColor(order.order_state)">{{ getStatusText(order.order_state) }}</a-tag>
       </template>
    </a-page-header>

    <a-card title="订单信息" style="margin-bottom: 24px;">
      <a-descriptions bordered :column="{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }">
        <a-descriptions-item label="订单号">{{ order.order_id }}</a-descriptions-item>
        <a-descriptions-item label="订单状态">
          <a-tag :color="getStatusColor(order.order_state)">{{ getStatusText(order.order_state) }}</a-tag>
        </a-descriptions-item>
         <a-descriptions-item label="下单时间">{{ formatDateTime(order.order_time) }}</a-descriptions-item> 
        <a-descriptions-item label="商品总数">{{ getTotalItems(order) }} 件</a-descriptions-item>
        <a-descriptions-item label="订单总额">
          <span class="total-amount-value">¥{{ formatPrice(order.total_price) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="用户ID">{{ order.user_id }}</a-descriptions-item>
        <a-descriptions-item label="收货人">{{ order.receiver || 'N/A' }}</a-descriptions-item>
        <!-- <a-descriptions-item label="联系电话">{{ order.recipient_phone || 'N/A' }}</a-descriptions-item> -->
        <a-descriptions-item label="收货地址" :span="{ xxl: 3, xl: 3, lg: 3, md: 3, sm: 1, xs: 1 }">{{ order.address || 'N/A' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="商品列表" style="margin-bottom: 24px;">
      <a-table
        :dataSource="orderProductDisplayList"
        :columns="productColumns"
        :pagination="false"
        rowKey="product_id"
        :scroll="{ x: 600 }" 
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'product_picture'">
             <img :src="getImageUrl(record.product_picture)" :alt="record.product_name" class="product-image" />
          </template>
          <template v-else-if="column.key === 'product_name'">
            <router-link :to="`/product/${record.product_id}`">{{ record.product_name }}</router-link>
          </template>
          <template v-else-if="column.key === 'price'">
            <span class="price">¥{{ formatPrice(record.price) }}</span> 
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span>× {{ record.quantity }}</span>
          </template>
          <template v-else-if="column.key === 'subtotal'">
            <span class="subtotal">¥{{ formatPrice(record.subtotal) }}</span> 
          </template>
        </template>
      </a-table>
    </a-card>

     <div class="order-actions-footer">
      <!-- 操作按钮可以根据需要添加，但通常详情页只做展示 -->
       <a-button @click="goBack">返回订单列表</a-button>
    </div>

  </div>
  
  <div v-else class="not-found-state">
     <a-empty description="未找到该订单信息" />
     <a-button @click="goBack">返回订单列表</a-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Spin, Alert, PageHeader, Card, Descriptions, DescriptionsItem, Tag, Table, Empty, Button } from 'ant-design-vue';
// import { LikeOutlined } from '@ant-design/icons-vue'; // 如果需要操作按钮再引入
import { apiFindOrderById } from '@/api/order'; // 引入 API
import apiConfig from '@/config/api'; // 引入 API 配置
import dayjs from 'dayjs'; // 引入 dayjs 用于格式化日期

const route = useRoute();
const router = useRouter();

// State Refs
const order = ref(null); 
const orderProductDisplayList = ref([]); // *** New ref for table data ***
const loading = ref(true);
const error = ref(null);
const orderId = ref(route.params.id);

// 商品表格列配置
const productColumns = [
  { title: '商品图片', key: 'product_picture', width: 80 }, 
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name', ellipsis: true }, 
  { title: '商品ID', dataIndex: 'product_id', key: 'product_id', width: 100, align: 'right' },
  { title: '单价', key: 'price', width: 100, align: 'right' },
  { title: '数量', key: 'quantity', width: 80, align: 'center' }, 
  { title: '小计', key: 'subtotal', width: 120, align: 'right' },
];

// 获取订单详情
const fetchOrderDetails = async () => {
  if (!orderId.value) {
      error.value = "无效的订单ID";
      loading.value = false;
      return;
  }
  loading.value = true;
  error.value = null;
  order.value = null;
  orderProductDisplayList.value = []; // Reset product list

  try {
    const res = await apiFindOrderById(orderId.value);
    console.log("API Response for order detail:", res);
    
    if (res && res.code === 200 && res.order) { 
      order.value = res.order; // Store the main order object

      // *** Manually construct the single product item for the table ***
      if (order.value.product_id) { // Check if product info exists
          const quantity = order.value.product_number || 0;
          const totalPrice = order.value.total_price || 0;
          const unitPrice = quantity > 0 ? totalPrice / quantity : 0;
          
          orderProductDisplayList.value = [{
              product_id: order.value.product_id,
              product_name: order.value.product_name,
              product_picture: order.value.product_img, // Use product_img
              price: unitPrice, // Use calculated unit price
              quantity: quantity,
              subtotal: totalPrice // Use total_price as subtotal
          }];
          console.log("Constructed product list for table:", orderProductDisplayList.value);
      } else {
          console.warn("Order details loaded, but no product information found within the order object.");
          orderProductDisplayList.value = []; // Ensure it's empty if no product info
      }
    } else {
      throw new Error(res?.message || "未找到订单信息或加载失败");
    }
  } catch (err) {
    console.error("获取订单详情失败:", err);
    error.value = err.message || "加载订单详情时发生错误";
    order.value = null; 
    orderProductDisplayList.value = [];
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
    return 'https://placehold.co/80x80/EEE/AAA?text=No+Image';
  }
};

// 格式化价格
const formatPrice = (price) => {
  if (typeof price === 'number') {
      return price.toFixed(2);
  }
  return '0.00';
};

// 格式化日期时间
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return dayjs(dateTimeString).format('YYYY-MM-DD HH:mm:ss');
}

// 获取订单状态文本 (与 MyOrders.vue 保持一致或根据需要调整)
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待发货', // 内部状态映射到显示文本
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消',
    // --- 直接处理 API 可能返回的原始状态字符串 --- 
    '待发货': '待发货', 
    '已支付': '待发货', // 假设已支付也是待发货
    '已发货': '待收货',
    '已完成': '已完成',
    '已取消': '已取消',
    '购物车': '购物车' // 虽然理论上详情页不应显示购物车状态
  };
  return statusMap[status] || status || '未知状态';
};

// 获取订单状态颜色 (与 MyOrders.vue 类似)
const getStatusColor = (status) => {
   const colorMap = {
    // 内部状态
    'pending': 'orange',
    'shipped': 'purple',
    'completed': 'green',
    'cancelled': 'red',
    // API 原始状态
    '待发货': 'orange',
    '已支付': 'orange',
    '已发货': 'purple',
    '已完成': 'green',
    '已取消': 'red',
    '购物车': 'blue'
  };
  return colorMap[status] || 'default';
};

// 计算商品总数 (Now directly from order object)
const getTotalItems = (currentOrder) => {
  // API response now directly provides product_number for the single item
  return currentOrder?.product_number || 0; 
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 组件挂载时获取数据
onMounted(() => {
  if (orderId.value) {
    fetchOrderDetails();
  } else {
    error.value = '无效的订单ID';
    loading.value = false;
    // message.error('无效的订单ID'); // fetchOrderDetails 内部会处理
    // router.push('/orders');
  }
});

</script>

<style scoped>
.order-detail-container {
  padding: 20px;
}

.loading-state,
.error-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.error-state .ant-alert {
  width: 100%;
  max-width: 600px;
  text-align: left;
}

.site-page-header {
  border: 1px solid rgb(235, 237, 240);
  margin-bottom: 24px;
  background-color: #fff;
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
    /* color: #f5222d; */ /* Keep price normal color */
}

.subtotal {
  font-weight: 500;
  color: #f5222d; /* Subtotal highlight */
}

.order-actions-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end; 
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-descriptions-item-label) {
    color: #666;
    font-weight: normal !important;
}

:deep(.ant-descriptions-item-content) {
    font-weight: normal;
}

.total-amount-value {
  font-size: 1.2em;
  font-weight: bold;
  color: #f5222d;
}
</style>
