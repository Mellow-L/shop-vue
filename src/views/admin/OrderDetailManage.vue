<template>
  <!-- Loading State (from OrderDetail.vue) -->
  <div v-if="loading" class="loading-state">
    <a-spin size="large" tip="加载订单详情中..." />
  </div>

  <!-- Error State (from OrderDetail.vue) -->
  <div v-else-if="error" class="error-state">
     <a-alert
      message="加载订单失败"
      :description="error"
      type="error"
      show-icon
    >
      <template #action>
        <!-- Pass orderId ref to fetch function -->
        <a-button type="primary" @click="fetchOrderDetail(orderId)">重试</a-button>
        <a-button @click="goBack" style="margin-left: 8px">返回列表</a-button>
      </template>
    </a-alert>
  </div>

  <!-- Order Detail Content (structure from OrderDetail.vue) -->
  <div v-else-if="order" class="order-detail-container">
    <!-- Page Header (adapted from OrderDetail.vue) -->
    <a-page-header
      class="site-page-header"
      :title="`订单详情管理 (ID: ${order.order_id})`" 
      @back="goBack"
    >
       <template #breadcrumb>
          <a-breadcrumb>
            <a-breadcrumb-item>
              <router-link to="/admin/dashboard">管理后台</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
              <router-link to="/admin/orders">订单管理</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>订单详情</a-breadcrumb-item>
          </a-breadcrumb>
       </template>
       <template #tags>
         <a-tag :color="getStatusColor(order.order_state)">{{ getStatusText(order.order_state) }}</a-tag>
       </template>
    </a-page-header>

    <!-- Order Info Card (structure from OrderDetail.vue) -->
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
        <a-descriptions-item label="收货人">{{ parsedRecipientName }}</a-descriptions-item>
        <a-descriptions-item label="联系邮箱">{{ parsedRecipientEmail }}</a-descriptions-item>
        <a-descriptions-item label="收货地址" :span="{ xxl: 3, xl: 3, lg: 3, md: 3, sm: 1, xs: 1 }">{{ parsedFullAddress }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- Product List Card (structure from OrderDetail.vue) -->
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
            <router-link :to="`/product/${record.product_id}`" target="_blank">{{ record.product_name }}</router-link>
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

    <!-- Admin Actions Footer (modified from previous version) -->
    <div class="admin-actions-footer">
      <a-space :size="12">
          <!-- 我已发货 按钮 (仅 pending 状态) -->
          <a-button
            v-if="order.order_state === 'pending'"
            type="primary"
            :loading="processingOrderId === order.order_id && processingAction === 'ship'"
            @click="markAsShipped(order)"
            :disabled="processingOrderId !== null"
          >
             <SendOutlined /> 发货
          </a-button>
          <!-- 取消订单 按钮 (仅 pending 或 shipped 状态) -->
           <a-popconfirm
                title="确定要取消这个订单吗？"
                ok-text="确定取消"
                cancel-text="再想想"
                @confirm="cancelOrderAdmin(order)"
                :disabled="processingOrderId !== null || !(order.order_state === 'pending' || order.order_state === 'shipped')"
            >
                <a-button
                  danger
                  :loading="processingOrderId === order.order_id && processingAction === 'cancel'"
                  :disabled="processingOrderId !== null || !(order.order_state === 'pending' || order.order_state === 'shipped')"
                >
                  <CloseCircleOutlined /> 取消订单
                </a-button>
            </a-popconfirm>
        <a-button @click="goBack">返回订单列表</a-button>
      </a-space>
    </div>

  </div>

   <!-- Not Found State (from OrderDetail.vue) -->
   <div v-else class="not-found-state">
     <a-empty description="未找到该订单信息" />
     <a-button @click="goBack">返回订单列表</a-button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Import necessary Ant Design components (merged from both files)
import { message, Spin, Alert, Breadcrumb, BreadcrumbItem, Card, Descriptions, DescriptionsItem, Tag, Table, Empty, Button, PageHeader, Space, Popconfirm } from 'ant-design-vue';
import { SendOutlined, CloseCircleOutlined } from '@ant-design/icons-vue';
// Import necessary API functions
import { apiFindOrderById, apiMarkOrderAsShipped, apiCancelOrderByDeliver } from '@/api/order';
import apiConfig from '@/config/api';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();

// State Refs (from OrderDetail.vue + admin action refs)
const order = ref(null);
const orderProductDisplayList = ref([]);
const loading = ref(true);
const error = ref(null);
const orderId = ref(route.params.id);
const processingOrderId = ref(null); // For loading state on buttons
const processingAction = ref(null);  // To distinguish ship/cancel loading

// Computed properties for parsing address (from OrderDetail.vue)
const parsedRecipientName = computed(() => {
    if (!order.value || !order.value.address || typeof order.value.address !== 'string') return 'N/A';
    const parts = order.value.address.split(',');
    return parts[0]?.trim() || 'N/A';
});
const parsedRecipientEmail = computed(() => {
    if (!order.value || !order.value.address || typeof order.value.address !== 'string') return 'N/A';
    const parts = order.value.address.split(',');
    return parts.length > 1 ? (parts[1]?.trim() || 'N/A') : 'N/A';
});
const parsedFullAddress = computed(() => {
    if (!order.value || !order.value.address || typeof order.value.address !== 'string') return 'N/A';
    const parts = order.value.address.split(',');
    return parts.length > 2 ? (parts.slice(2).join(',').trim() || 'N/A') : 'N/A';
});

// Product Table Columns (from OrderDetail.vue)
const productColumns = [
  { title: '商品图片', key: 'product_picture', width: 80 },
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name', ellipsis: true },
  { title: '商品ID', dataIndex: 'product_id', key: 'product_id', width: 100, align: 'right' },
  { title: '单价', key: 'price', width: 100, align: 'right' },
  { title: '数量', key: 'quantity', width: 80, align: 'center' },
  { title: '小计', key: 'subtotal', width: 120, align: 'right' },
];

// Fetch Order Detail (adapted from previous OrderDetailManage version)
const fetchOrderDetail = async (id) => {
  if (!id) {
    error.value = "无效的订单ID";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  order.value = null;
  orderProductDisplayList.value = [];

  try {
    const res = await apiFindOrderById(id);
    console.log("[Admin Detail] API Response for order detail:", res);

    if (res && res.code === 200 && res.order) {
      const apiOrderData = res.order;
      // --- Robust State Mapping --- (Ensuring internal state is set)
      let internalState = 'unknown';
      const apiState = apiOrderData.order_state;
      if (apiState === '待发货' || apiState === '已支付' || apiState === 'pending') {
         internalState = 'pending';
      } else if (apiState === '已发货' || apiState === '待收货' || apiState === 'shipped') {
         internalState = 'shipped';
      } else if (apiState === '已完成' || apiState === 'completed') {
         internalState = 'completed';
      } else if (apiState === '已取消' || apiState === 'cancelled') {
         internalState = 'cancelled';
      } else {
         console.warn(`[Admin Detail] Unknown or unhandled order state from API: ${apiState}`);
      }
      // Set the main order ref with mapped state
      order.value = { ...apiOrderData, order_state: internalState };

      // Construct Product List for Table
      if (apiOrderData.product_id) {
          const quantity = apiOrderData.product_number || 0;
          const totalPrice = apiOrderData.total_price || 0;
          const unitPrice = quantity > 0 ? totalPrice / quantity : 0;
          orderProductDisplayList.value = [{
              product_id: apiOrderData.product_id,
              product_name: apiOrderData.product_name,
              product_picture: apiOrderData.product_img,
              price: unitPrice,
              quantity: quantity,
              subtotal: totalPrice
          }];
      } else {
          orderProductDisplayList.value = [];
      }
    } else {
      throw new Error(res?.message || "未找到订单信息或加载失败");
    }
  } catch (err) {
    console.error("[Admin Detail] 获取订单详情失败:", err);
    error.value = err.message || "加载订单详情时发生错误";
    order.value = null;
    orderProductDisplayList.value = [];
  } finally {
    loading.value = false;
  }
};

// Helper Functions (from OrderDetail.vue)
const getImageUrl = (relativePath) => {
  if (relativePath) {
    const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
    const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return baseUrl + imagePath;
  } else {
    return 'https://placehold.co/80x80/EEE/AAA?text=No+Image';
  }
};
const formatPrice = (price) => {
  if (typeof price === 'number') {
      return price.toFixed(2);
  }
  return '0.00';
};
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return dayjs(dateTimeString).format('YYYY-MM-DD HH:mm:ss');
};
const getTotalItems = (currentOrder) => {
    return currentOrder?.product_number || 0;
};

// Status text/color using internal states (adapted for admin view)
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
const getStatusColor = (status) => {
   const colorMap = {
    'pending': 'blue', // Admin uses blue for pending
    'shipped': 'purple',
    'completed': 'green',
    'cancelled': 'red',
    'unknown': 'default'
  };
  return colorMap[status] || 'default';
};

// Admin Actions (from previous ManageOrders.vue adaptation)
const markAsShipped = async (orderToMark) => {
  processingOrderId.value = orderToMark.order_id;
  processingAction.value = 'ship';
  try {
    const res = await apiMarkOrderAsShipped(orderToMark.order_id);
    if (res && res.code === 200) {
      message.success(`订单 ${orderToMark.order_id} 已标记为发货！`);
      fetchOrderDetail(orderToMark.order_id); // Refresh details
    } else {
       // API function shows message
    }
  } catch (err) {
      // API function shows message
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
       message.success(`订单 ${orderToCancel.order_id} 已取消！`);
       fetchOrderDetail(orderToCancel.order_id); // Refresh details
    } else {
       // API function shows message
    }
  } catch (error) {
     // API function shows message
  } finally {
    processingOrderId.value = null;
    processingAction.value = null;
  }
};

// Go Back Function (from OrderDetail.vue)
const goBack = () => {
  router.back();
};

// Fetch data on mount (from OrderDetail.vue)
onMounted(() => {
  if (orderId.value) {
    fetchOrderDetail(orderId.value);
  } else {
    error.value = '无效的订单ID';
    loading.value = false;
    message.error('无效的订单ID，将返回列表');
    router.push('/admin/orders'); // Redirect admin back to list
  }
});

</script>

<style scoped>
/* Use styles from OrderDetail.vue and add/keep admin specifics */
.order-detail-container {
  padding: 20px;
  background-color: #f0f2f5; /* Admin background */
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

/* Use PageHeader styles */
.site-page-header {
  border: 1px solid rgb(235, 237, 240);
  margin-bottom: 24px;
  background-color: #fff;
}

.breadcrumb {
  /* Removed, handled by PageHeader now */
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

.price { /* Normal color */ }

.subtotal {
  font-weight: 500;
  color: #f5222d;
}

.admin-actions-footer {
  margin-top: 24px;
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 -1px 3px rgba(0,0,0,0.06);
  text-align: right;
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

