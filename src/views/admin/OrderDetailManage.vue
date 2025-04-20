<template>
  <div class="order-detail-container" v-if="order">
    <a-breadcrumb class="breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/admin/dashboard">管理后台</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/admin/orders">订单管理</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>订单详情管理</a-breadcrumb-item>
    </a-breadcrumb>

    <a-card title="订单信息" style="margin-bottom: 24px;">
      <a-descriptions bordered :column="{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" layout="vertical">
        <a-descriptions-item label="订单号" :span="1">{{ order.order_id }}</a-descriptions-item>
        <a-descriptions-item label="订单状态" :span="1">
           <a-select v-model:value="editableOrderState" style="width: 120px" v-if="isEditing">
            <a-select-option value="processing">待发货</a-select-option>
            <a-select-option value="shipped">待收货</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="cancelled">已取消</a-select-option>
           </a-select>
           <a-tag :color="getStatusColor(order.order_state)" v-else>{{ getStatusText(order.order_state) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="订单总额" :span="{ xxl: 1, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="total-amount-desc">
          <span class="total-amount-value">¥{{ order.totalAmount.toFixed(2) }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="商品总数" :span="1">{{ getTotalItems(order) }} 件</a-descriptions-item>
        <a-descriptions-item label="下单时间" :span="1">{{ order.orderDate }}</a-descriptions-item>
        <a-descriptions-item label="用户ID" :span="1">{{ order.user_id }}</a-descriptions-item>
        <a-descriptions-item label="用户邮箱" :span="{ xxl: 2, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }">
            <a-input v-model:value="editableUserEmail" v-if="isEditing" placeholder="用户邮箱"/>
            <span v-else>{{ order.userEmail || 'N/A' }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="收货人" :span="1">
            <a-input v-model:value="editableReceiver" v-if="isEditing" placeholder="收货人姓名"/>
            <span v-else>{{ order.receiver }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="收货地址" :span="{ xxl: 3, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }">
            <a-textarea v-model:value="editableAddress" v-if="isEditing" placeholder="详细收货地址" :rows="2"/>
            <span v-else>{{ order.address }}</span>
        </a-descriptions-item>
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
            <router-link :to="`/product/${record.product_id}`" target="_blank">{{ record.product_name }}</router-link>
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

    <div class="admin-actions-footer">
      <a-space :size="12">
        <template v-if="!isEditing">
           <a-button 
              v-if="order.order_state === 'processing'" 
              type="primary" 
              @click="shipOrder(order)"
              :disabled="!canShip(order)"
            >
               <SendOutlined /> 发货
            </a-button>
            <a-popconfirm
                title="确定要取消这个订单吗？"
                ok-text="确定取消"
                cancel-text="再想想"
                @confirm="cancelOrderAdmin(order)"
                :disabled="!canCancel(order)"
            >
                <a-button 
                  danger 
                  :disabled="!canCancel(order)"
                >
                  <CloseCircleOutlined /> 取消订单
                </a-button>
            </a-popconfirm>
            <a-button @click="toggleEdit(true)"><EditOutlined /> 修改订单</a-button>
        </template>
        <template v-else>
            <a-button @click="undoChanges">
                <RollbackOutlined /> 撤销修改
            </a-button>
            <a-button type="primary" @click="confirmChanges">
                <CheckCircleOutlined /> 确认修改
            </a-button>
        </template>
        <a-button @click="$router.push('/admin/orders')">返回订单列表</a-button>
      </a-space>
    </div>

  </div>
  <div v-else class="loading-state">
    <a-spin size="large" tip="加载订单详情中..." />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Popconfirm, Select, SelectOption, Input, Textarea } from 'ant-design-vue';
import { SendOutlined, CloseCircleOutlined, EditOutlined, RollbackOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
// Assume API functions for admin exist
// import { apiAdminFindOrderById, apiAdminUpdateOrder, apiAdminCancelOrder, apiAdminShipOrder } from '@/api/admin/order'; 
// import { apiFindUserById } from '@/api/user'; // To fetch user details

const route = useRoute();
const router = useRouter();
const order = ref(null); // Original order data
const isEditing = ref(false);

// Editable fields refs
const editableOrderState = ref('');
const editableUserEmail = ref(''); // Assuming admin can edit user email (unlikely, maybe just display)
const editableReceiver = ref('');
const editableAddress = ref('');

const productColumns = [
  { title: '商品', key: 'product_picture', width: 80 }, 
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name', ellipsis: true }, 
  { title: '商品ID', dataIndex: 'product_id', key: 'product_id', width: 100, align: 'center' }, 
  { title: '单价', key: 'price', width: 100, align: 'right' },
  { title: '数量', key: 'quantity', width: 80, align: 'center' }, 
  { title: '小计', key: 'subtotal', width: 120, align: 'right' },
];

// --- Static Data Fetching (Replace with API call) ---
const fetchOrderDetail = async (orderId) => {
  console.log('[Admin Detail] Attempting to fetch order detail for ID:', orderId);
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
      order_state: 'cancelled',
      orderDate: '2024-05-03 16:20:33',
      receiver: '王五',
      address: '广州市天河区xxx大道xxx号',
      products: [
        { product_id: 5, product_name: '智能手表', price: 1599, quantity: 1, product_picture: 'https://placehold.co/300x300?text=Watch' },
        { product_id: 8, product_name: '数据结构与算法', price: 99, quantity: 1, product_picture: 'https://placehold.co/300x300?text=Algorithm' }
      ],
      totalAmount: 1698,
    },
    'ORD20240504004': {
      order_id: 'ORD20240504004',
      user_id: 10001,
      userEmail: 'user1@example.com',
      order_state: 'processing',
      orderDate: '2024-05-04 11:05:00',
      receiver: '赵六',
      address: '深圳市南山区xxx科技园',
      products: [
        { product_id: 10, product_name: '无线蓝牙耳机', price: 499, quantity: 1, product_picture: 'https://placehold.co/300x300?text=Earbuds' }
      ],
      totalAmount: 507
    }
  };
  const foundOrder = mockOrders[orderId];
  if (foundOrder) {
      console.log('[Admin Detail] Order data found:', foundOrder);
      order.value = foundOrder;
      resetEditableFields(); // Initialize editable fields when data is loaded
  } else {
      console.error('[Admin Detail] No order data found for ID:', orderId);
      message.error(`无法找到订单 ${orderId} 的详情`);
      order.value = null; // Ensure order is null if not found
      // Optionally redirect back
      // router.push('/admin/orders'); 
  }
};
// --- End Static Data --- 

onMounted(() => {
  const orderId = route.params.id;
  console.log('[Admin Detail] Component mounted. Order ID from route params:', orderId);
  if (orderId) {
    fetchOrderDetail(orderId);
  } else {
    console.error('[Admin Detail] No order ID found in route params.');
    message.error('无效的订单ID');
    router.push('/admin/orders');
  }
});

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待付款', // Should not appear in admin ideally?
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

// --- Admin Actions --- 

const resetEditableFields = () => {
    if (!order.value) return;
    editableOrderState.value = order.value.order_state;
    editableUserEmail.value = order.value.userEmail || '';
    editableReceiver.value = order.value.receiver;
    editableAddress.value = order.value.address;
};

const toggleEdit = (editMode) => {
    isEditing.value = editMode;
    if (!editMode) {
        resetEditableFields(); // Reset fields if cancelling edit
    }
};

const undoChanges = () => {
    resetEditableFields();
    toggleEdit(false);
    message.info('修改已撤销');
};

const confirmChanges = async () => {
    if (!order.value) return;
    const updatedData = {
        order_id: order.value.order_id,
        order_state: editableOrderState.value,
        receiver: editableReceiver.value,
        address: editableAddress.value,
        // userEmail: editableUserEmail.value, // Should email be editable?
    };
    console.log('确认修改，提交数据:', updatedData);
    try {
        // TODO: Replace with actual API call: apiAdminUpdateOrder(updatedData)
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        
        // Update local order data on success
        order.value.order_state = updatedData.order_state;
        order.value.receiver = updatedData.receiver;
        order.value.address = updatedData.address;
        // order.value.userEmail = updatedData.userEmail;
        
        message.success('订单信息更新成功！');
        toggleEdit(false);
    } catch (error) { 
        console.error("更新订单失败:", error);
        message.error('更新订单信息失败，请重试。');
    }
};

const shipOrder = async (currentOrder) => {
  console.log('发货操作 for order:', currentOrder.order_id);
  try {
      // TODO: Replace with actual API call: apiAdminShipOrder(currentOrder.order_id)
      await new Promise(resolve => setTimeout(resolve, 500));
      if (order.value && order.value.order_id === currentOrder.order_id) {
          order.value.order_state = 'shipped'; // Update local state
          resetEditableFields(); // Update editable state as well
      }
      message.success(`订单 ${currentOrder.order_id} 已标记为发货！`);
  } catch (error) {
      console.error("发货失败:", error);
      message.error('发货操作失败，请重试。');
  }
};

const cancelOrderAdmin = async (currentOrder) => {
  console.log('取消订单操作 for order:', currentOrder.order_id);
  try {
      // TODO: Replace with actual API call: apiAdminCancelOrder(currentOrder.order_id)
      await new Promise(resolve => setTimeout(resolve, 500)); 
      if (order.value && order.value.order_id === currentOrder.order_id) {
          order.value.order_state = 'cancelled'; // Update local state
           resetEditableFields(); // Update editable state as well
      }
       message.success(`订单 ${currentOrder.order_id} 已取消！`);
  } catch (error) {
      console.error("取消订单失败:", error);
      message.error('取消订单操作失败，请重试。');
  }
};

// --- Computed properties for button disabling logic ---
const canShip = computed(() => order.value && order.value.order_state === 'processing');
const canCancel = computed(() => order.value && (
    order.value.order_state === 'pending' || // Should admin see pending?
    order.value.order_state === 'processing'
));

</script>

<style scoped>
/* Copied styles from user/OrderDetail.vue and adjusted */
.order-detail-container {
  padding: 20px;
  background-color: #f0f2f5; /* Admin background color */
}

.breadcrumb {
  margin-bottom: 24px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
}

.price, .subtotal {
  font-weight: 500;
}

.total-amount-desc {
    /* Align value vertically */
    display: flex;
    align-items: center;
}
.total-amount-value {
    font-size: 1.2em;
    font-weight: bold;
    color: #d9534f; /* Highlight total amount */
}

.admin-actions-footer {
  margin-top: 24px;
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 -1px 3px rgba(0,0,0,0.06);
  text-align: right; /* Align buttons to the right */
}

.loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

/* Make descriptions items editable */
:deep(.ant-descriptions-item-content) {
    /* Allow inputs to take full width */
    display: block;
}
</style>

