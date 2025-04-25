<template>
  <!-- Loading State -->
  <div v-if="userLoading || !userId" class="loading-state">
    <a-spin size="large" tip="加载用户信息中..." />
  </div>

  <!-- Error State -->
  <div v-else-if="userError" class="error-state">
     <a-alert message="加载用户信息失败" :description="userError" type="error" show-icon>
       <template #action>
         <a-button type="primary" @click="fetchUserDetails">重试</a-button>
         <a-button @click="goBack" style="margin-left: 8px">返回列表</a-button>
       </template>
     </a-alert>
  </div>

  <!-- User Detail Content -->
  <div v-else-if="user" class="user-detail-container">
    <a-breadcrumb class="breadcrumb">
      <a-breadcrumb-item><router-link to="/admin/dashboard">管理后台</router-link></a-breadcrumb-item>
      <a-breadcrumb-item><router-link to="/admin/users">用户管理</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>用户详情 (ID: {{ user.user_id }})</a-breadcrumb-item>
    </a-breadcrumb>

    <a-row :gutter="24">
      <!-- Left Column: User Info -->
      <a-col :xs="24" :sm="24" :md="9" :lg="8" :xl="7">
        <a-card class="user-info-card">
          <div class="user-avatar-section">
            <a-avatar :size="100" :src="getFullImageUrl(user.avatar) || 'https://placehold.co/100x100?text=No+Avatar'" />
            <h2 class="user-detail-name">{{ user.username || user.email || 'N/A' }}</h2>
          </div>
          <a-descriptions
            bordered
            :column="1"
            size="small"
            class="user-details-descriptions"
            :labelStyle="{ whiteSpace: 'nowrap' }"
          >
            <a-descriptions-item label="用户ID">{{ user.user_id }}</a-descriptions-item>
            <a-descriptions-item label="邮箱">{{ user.email || 'N/A' }}</a-descriptions-item>
            <a-descriptions-item label="用户名">{{ user.username || '-' }}</a-descriptions-item>
            <a-descriptions-item label="收货信息">{{ user.address || '未设置' }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="getUserStatusColor(user.user_state)">{{ getUserStatusText(user.user_state) }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <!-- Admin Actions for User -->
          <a-divider />
          <div class="user-admin-actions">
            <a-button
              v-if="user.user_state === true" 
              danger
              @click="toggleUserStatus(false)"
              :loading="processingStatusChange"
              :disabled="processingStatusChange"
            >
              冻结用户
            </a-button>
            <a-button
              v-else 
              type="primary"
              @click="toggleUserStatus(true)"
              :loading="processingStatusChange"
              :disabled="processingStatusChange"
            >
              解冻用户
            </a-button>
          </div>
        </a-card>
      </a-col>

      <!-- Right Column: User Orders -->
      <a-col :xs="24" :sm="24" :md="15" :lg="16" :xl="17">
        <a-card title="用户订单历史">
          <!-- Loading/Error/Empty for Orders -->
          <div v-if="ordersLoading" class="loading-indicator-small">
            <a-spin tip="加载订单中..." />
          </div>
          <div v-else-if="ordersError" class="error-indicator-small">
            <a-alert message="加载订单失败" :description="ordersError" type="error" show-icon>
              <template #action>
                 <a-button size="small" type="primary" @click="fetchUserOrders">重试</a-button>
              </template>
            </a-alert>
          </div>
          <div v-else-if="userOrders.length === 0" class="empty-orders-small">
            <a-empty description="该用户暂无订单记录" />
          </div>

          <!-- Order List (similar to ManageOrders) -->
          <a-list
            v-else
            class="orders-list-condensed"
            :dataSource="userOrders"
            :pagination="orderPagination"
            :grid="{ gutter: 16, column: 1 }"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-card class="order-card-condensed" size="small">
                  <div class="order-header">
                    <div class="order-info">
                      <span class="order-number">订单号: {{ item.order_id }}</span>
                      <span class="order-date">{{ item.orderDate }}</span>
                    </div>
                    <div class="order-status" :class="'status-' + item.order_state">
                      {{ getOrderStateText(item.order_state) }}
                    </div>
                  </div>
                  <div class="order-products-list">
                    <div v-for="product in item.products" :key="product.product_id" class="order-product-item-condensed">
                       <img :src="getProductImage(product)" :alt="product.product_name" class="product-image-small" />
                       <div class="product-details-condensed">
                         <div class="product-name-item" @click="viewProductDetail(product.product_id)">{{ product.product_name }}</div>
                         <div class="product-price-quantity">¥{{ formatPrice(product.price) }} × {{ product.quantity }}</div>
                       </div>
                       <div class="product-subtotal">¥{{ formatPrice(product.price * product.quantity) }}</div>
                    </div>
                  </div>
                  <div class="order-footer-condensed">
                     <span>合计: <span class="total-price">¥{{ formatPrice(getTotalPrice(item)) }}</span></span>
                     <a-button size="small" @click="viewAdminOrderDetail(item.order_id)">查看详情</a-button>
                  </div>
                </a-card>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>

  <!-- Not Found State -->
  <div v-else class="not-found-state">
     <a-empty description="未找到该用户信息" />
     <a-button @click="goBack">返回用户列表</a-button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Spin, Alert, Breadcrumb, BreadcrumbItem, Card, Avatar, Tag, Row, Col, Empty, Button, List, Descriptions, DescriptionsItem, Space, Divider } from 'ant-design-vue'; // Added necessary components
// Import User and Order APIs
import { apiFindUserById, apiUpdateStatus } from '@/api/user';
import { apiFindOrdersByUserId } from '@/api/order';
import apiConfig from '@/config/api';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();

// State Refs
const user = ref(null);
const userOrders = ref([]);
const userLoading = ref(true);
const userError = ref(null);
const ordersLoading = ref(true);
const ordersError = ref(null);
const userId = ref(route.params.id);
const processingStatusChange = ref(false); // Loading state for status change button

const orderPagination = reactive({
  current: 1,
  pageSize: 5, // Show fewer orders per page in detail view
  total: 0,
  onChange: (page, pageSize) => {
    orderPagination.current = page;
    orderPagination.pageSize = pageSize;
    // If using server-side pagination for orders, call fetchUserOrders() here
  },
  showTotal: total => `共 ${total} 条`,
  pageSizeOptions: ['5', '10', '20'],
  hideOnSinglePage: true,
});

// --- Helper Functions (Copied/Adapted) ---
const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
  const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return baseUrl + imagePath;
};

const getProductImage = (product) => {
  const relativePath = product?.product_picture;
  if (!relativePath) return 'https://placehold.co/60x60?text=NoImg';
  return getFullImageUrl(relativePath); // Reuse the helper
};

const formatPrice = (price) => {
    if (typeof price === 'number') return price.toFixed(2);
    const num = parseFloat(price);
    return !isNaN(num) ? num.toFixed(2) : '0.00';
};

const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return dayjs(dateTimeString).format('YYYY-MM-DD HH:mm:ss');
};

// Status mapping logic (copied from ManageOrders)
const mapApiStateToInternal = (apiState) => {
    if (!apiState) return 'unknown';
    if (apiState === '待发货' || apiState === '已支付' || apiState === 'pending') return 'pending';
    if (apiState === '已发货' || apiState === '待收货' || apiState === 'shipped') return 'shipped';
    if (apiState === '已完成' || apiState === 'completed') return 'completed';
    if (apiState === '已取消' || apiState === 'cancelled') return 'cancelled';
    console.warn(`Unknown order state from API: ${apiState}`);
    return 'unknown';
};
const getStatusText = (userState) => {
  return userState === true ? '正常' : '禁用'; // Use the boolean user_state
};
const getStatusColor = (userState) => {
  return userState === true ? 'green' : 'red'; // Use the boolean user_state
};

// Order total calculations (copied from ManageOrders)
const getTotalItems = (order) => {
  return order?.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;
};
const getTotalPrice = (order) => {
  return order?.products?.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0) || 0;
};

// --- User Status Display --- (Modified Text)
const getUserStatusText = (userState) => {
  return userState === true ? '正常' : '冻结';
};
const getUserStatusColor = (userState) => {
  return userState === true ? 'green' : 'red';
};

// --- Order Status Display --- (Keep separate mapping logic for orders)
const getOrderStateText = (internalState) => {
  const statusMap = { 'pending': '待发货', 'shipped': '待收货', 'completed': '已完成', 'cancelled': '已取消', 'unknown': '未知' };
  return statusMap[internalState] || internalState;
};
const getOrderStateColor = (internalState) => {
   const colorMap = { 'pending': 'blue', 'shipped': 'purple', 'completed': 'green', 'cancelled': 'red', 'unknown': 'default' };
  return colorMap[internalState] || 'default';
};

// --- Data Fetching ---
const fetchUserDetails = async () => {
  if (!userId.value) {
    userError.value = "无效的用户ID";
    userLoading.value = false;
    return;
  }
  userLoading.value = true;
  userError.value = null;
  try {
    const res = await apiFindUserById(userId.value);
    console.log("[UserDetailManage] API Response for user details:", res);

    if (res && res.code === 200 && res.user) {
      user.value = res.user;
    } else {
      throw new Error(res?.message || "获取用户信息失败或用户不存在");
    }
  } catch (err) {
    console.error("[UserDetailManage] 获取用户详情失败:", err);
    userError.value = err.message || "加载用户信息时出错";
    user.value = null;
  } finally {
    userLoading.value = false;
  }
};

const fetchUserOrders = async () => {
  if (!userId.value) {
    ordersError.value = "无效的用户ID";
    ordersLoading.value = false;
    return;
  }
  ordersLoading.value = true;
  ordersError.value = null;
  userOrders.value = [];

  try {
    const res = await apiFindOrdersByUserId(userId.value);
    if (res && res.code === 200 && Array.isArray(res.list)) {
        const groupedOrders = {};
        res.list.forEach(item => {
            if (item.order_state === '购物车') return;
            const internalState = mapApiStateToInternal(item.order_state);

            if (!groupedOrders[item.order_id]) {
                groupedOrders[item.order_id] = {
                    order_id: item.order_id,
                    order_state: internalState,
                    orderDate: formatDateTime(item.order_time),
                    create_time: item.order_time,
                    products: []
                };
            }
            groupedOrders[item.order_id].products.push({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.product_number || 0,
                price: item.product_number > 0 ? ((item.total_price || 0) / item.product_number) : 0,
                product_picture: item.product_img || null
            });
        });
        const processedOrders = Object.values(groupedOrders);
        processedOrders.sort((a, b) => dayjs(b.create_time).unix() - dayjs(a.create_time).unix());
        userOrders.value = processedOrders;
        orderPagination.total = processedOrders.length; // Update pagination total
    } else {
       userOrders.value = [];
       orderPagination.total = 0;
       if (res?.code !== 200) {
           throw new Error(res?.message || "获取用户订单失败");
       }
    }
  } catch (err) {
    console.error("获取用户订单失败:", err);
    ordersError.value = err.message || "加载用户订单时出错";
    userOrders.value = [];
    orderPagination.total = 0;
  } finally {
    ordersLoading.value = false;
  }
};

// --- Admin Actions for User --- (Modified Text)
const toggleUserStatus = async (newStatus) => {
    if (!user.value?.user_id) return;
    processingStatusChange.value = true;
    const statusText = newStatus ? '解冻' : '冻结';
    try {
        const statusToSend = newStatus;
        console.log(`Attempting to set user ${user.value.user_id} status to: ${statusToSend} (${statusText})`);
        const res = await apiUpdateStatus(user.value.user_id, statusToSend);
        if (res && res.code === 200) {
            message.success(`用户已${statusText}`);
            await fetchUserDetails();
        } else {
             console.error(`Failed to ${statusText} user (API Response):`, res);
        }
    } catch (error) {
        console.error(`Failed to ${statusText} user (Catch Block):`, error);
    } finally {
        processingStatusChange.value = false;
    }
};

// --- Navigation ---
const goBack = () => {
  router.push('/admin/users'); // Go back to user list
};

const viewProductDetail = (productId) => {
    router.push(`/product/${productId}`); // Link to user-facing product detail
};
const viewAdminOrderDetail = (orderId) => {
    router.push({ name: 'AdminOrderDetail', params: { id: orderId } }); // Link to admin order detail
};

// --- Lifecycle Hook ---
onMounted(() => {
  if (userId.value) {
    fetchUserDetails();
    fetchUserOrders();
  } else {
    userError.value = '未提供用户ID';
    userLoading.value = false;
    ordersLoading.value = false;
    message.error('未提供用户ID，无法加载详情');
  }
});

</script>

<style scoped>
.user-detail-container {
  padding: 24px;
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

.breadcrumb {
  margin-bottom: 24px;
}

.user-info-card {
  /* text-align: center; // Keep default align */
}

.user-avatar-section {
  text-align: center; /* Center avatar and name */
  margin-bottom: 20px;
}

.user-detail-name {
  margin-top: 10px; /* Space between avatar and name */
  margin-bottom: 8px;
  font-size: 1.3em; /* Slightly smaller */
  font-weight: 500;
}

/* Descriptions styles */
.user-details-descriptions {
    margin-top: 16px;
}
/* Remove fixed label width if vertical layout is used or adjust as needed */
/* :deep(.user-details-descriptions .ant-descriptions-item-label) {
    width: 80px; 
    text-align: right;
    color: #888;
} */

/* Admin actions section */
.user-admin-actions {
    text-align: center; /* Center buttons */
    margin-top: 16px;
}

/* Styles for order list within the card */
.loading-indicator-small,
.error-indicator-small,
.empty-orders-small {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 150px; /* Smaller min-height */
    padding: 16px;
}
.error-indicator-small .ant-alert {
    width: 100%;
}

.orders-list-condensed {
    margin-top: 16px;
}
.order-card-condensed {
    margin-bottom: 12px;
    width: 100%; /* Ensure card takes full width */
    box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* Lighter shadow */
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
  color: #666;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.order-number { font-weight: 500; color: #333; }
.order-status { font-weight: normal; /* Normal weight for status text */
  font-size: 0.85em; }
/* Status colors (use same classes as ManageOrders) */
.status-pending { color: #faad14; }
.status-shipped { color: #1890ff; }
.status-completed { color: #52c41a; }
.status-cancelled { color: #bfbfbf; }
.status-unknown { color: #888; }

.order-products-list {
    /* No extra padding needed */
}
.order-product-item-condensed {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px dashed #f0f0f0;
}
.order-product-item-condensed:last-child {
    border-bottom: none;
}
.product-image-small {
    width: 40px; height: 40px; object-fit: cover; flex-shrink: 0;
}
.product-details-condensed { flex-grow: 1; }
.product-name-item { font-size: 0.9em; cursor: pointer; }
.product-name-item:hover { color: #1890ff; }
.product-price-quantity { font-size: 0.8em; color: #888; }
.product-subtotal { font-size: 0.9em; font-weight: 500; margin-left: auto; padding-left: 10px; }

.order-footer-condensed {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
    font-size: 0.9em;
}
.total-price { color: #f5222d; font-weight: bold; }

/* Ensure list items fill width */
:deep(.orders-list-condensed .ant-list-item) {
    width: 100%;
}

</style>
