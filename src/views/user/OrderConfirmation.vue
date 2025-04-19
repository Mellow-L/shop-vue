<template>
  <div class="order-confirmation-container">
    <h1 class="page-title">确认订单信息</h1>
    
    <a-spin :spinning="loading">
      <a-row :gutter="24">
        <!-- Left Side: Address and Products -->
        <a-col :xs="24" :md="16">
          <!-- Address Section -->
          <a-card title="收货地址" class="section-card">
            <template #extra>
              <a-button type="link" @click="showAddressModal">选择/修改地址</a-button>
            </template>
            <div v-if="selectedAddress">
              <p><strong>{{ selectedAddress.recipient_name }}</strong> {{ selectedAddress.recipient_phone }}</p>
              <p>{{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }}</p>
              <p>{{ selectedAddress.detailed_address }} {{ selectedAddress.postal_code }}</p>
            </div>
            <div v-else>
              <a-empty description="请选择收货地址" />
            </div>
          </a-card>

          <!-- Products Section -->
          <a-card title="商品列表" class="section-card">
            <a-list item-layout="horizontal" :data-source="orderItems">
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #avatar>
                      <a-avatar :src="item.product_picture || 'https://placehold.co/100x100?text=No+Image'" shape="square" :size="64"/>
                    </template>
                    <template #title>
                      <a>{{ item.product_name }}</a>
                    </template>
                    <template #description>
                      <span>单价: ¥{{ item.product_price }}</span> 
                    </template>
                  </a-list-item-meta>
                  <div class="item-quantity">
                     <a-input-number 
                       v-model:value="item.quantity" 
                       :min="1" 
                       :max="item.product_stock || 99" 
                       @change="updateTotal()" 
                     />
                  </div>
                  <div class="item-subtotal">
                    小计: ¥{{ (item.product_price * item.quantity).toFixed(2) }}
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>

        <!-- Right Side: Order Summary -->
        <a-col :xs="24" :md="8">
          <a-card title="订单总览" class="section-card summary-card">
            <a-descriptions :column="1">
              <a-descriptions-item label="商品总数">{{ totalQuantity }} 件</a-descriptions-item>
              <a-descriptions-item label="商品总价">¥{{ subtotal.toFixed(2) }}</a-descriptions-item>
              <a-descriptions-item label="运费">¥{{ shippingFee.toFixed(2) }}</a-descriptions-item>
              <a-descriptions-item label="订单总额">
                <strong style="font-size: 1.2em; color: #FA8C16;">¥{{ totalAmount.toFixed(2) }}</strong>
              </a-descriptions-item>
            </a-descriptions>
            <a-divider />
            <div class="order-actions">
              <a-button type="primary" size="large" @click="confirmOrder" :loading="submitting" block>确认下单</a-button>
              <a-button size="large" @click="cancelOrder" block style="margin-top: 12px;">取消</a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>

    <!-- Address Selection Modal -->
    <a-modal 
      v-model:open="isAddressModalVisible" 
      title="选择收货地址" 
      @ok="handleAddressSelect" 
      ok-text="确认选择"
      cancel-text="关闭"
      width="700px"
    >
       <a-radio-group v-model:value="modalSelectedAddressId" style="width: 100%;">
         <a-list :data-source="userAddresses" :loading="addressLoading" item-layout="horizontal">
           <template #renderItem="{ item }">
             <a-list-item>
                <a-radio :value="item.id" style="width: 100%;">
                   <p><strong>{{ item.recipient_name }}</strong> {{ item.recipient_phone }}</p>
                   <p>{{ item.province }} {{ item.city }} {{ item.district }} {{ item.detailed_address }} {{ item.postal_code }}</p>
                   <a-tag v-if="item.is_default" color="orange" style="margin-left: 8px;">默认</a-tag>
                </a-radio>
             </a-list-item>
           </template>
           <template #empty v-if="!addressLoading && userAddresses.length === 0">
              <a-empty description="暂无收货地址，请先到个人资料页添加" />
              <a-button type="link" @click="goToProfile">去添加地址</a-button>
           </template>
         </a-list>
       </a-radio-group>
    </a-modal>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const orderItems = reactive([]); // 商品列表
const userAddresses = reactive([]); // 用户地址列表
const selectedAddress = ref(null); // 当前选中的地址
const addressLoading = ref(false);

const isAddressModalVisible = ref(false);
const modalSelectedAddressId = ref(null);

// --- Fetch User Addresses (Similar to MyProfile) ---
const fetchUserAddresses = async () => {
    addressLoading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const mockAddresses = [
      { id: 1, recipient_name: '张三', recipient_phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', detailed_address: 'xxx街道xxx号', postal_code: '100010', is_default: true },
      { id: 2, recipient_name: '李四', recipient_phone: '13900139000', province: '上海市', city: '上海市', district: '浦东新区', detailed_address: 'yyy路yyy弄yyy号', postal_code: '200120', is_default: false },
    ];
    userAddresses.splice(0, userAddresses.length, ...mockAddresses);
    // Set default address if available
    const defaultAddress = userAddresses.find(addr => addr.is_default);
    if (defaultAddress) {
      selectedAddress.value = defaultAddress;
      modalSelectedAddressId.value = defaultAddress.id;
    }
    addressLoading.value = false;
};

// --- Load Order Items from sessionStorage ---
const loadOrderItems = () => {
  const itemsString = sessionStorage.getItem('orderConfirmationItems');
  if (itemsString) {
    try {
      const items = JSON.parse(itemsString);
      if (Array.isArray(items) && items.length > 0) {
         orderItems.splice(0, orderItems.length, ...items); // Update reactive array
      } else {
        throw new Error('Invalid order items data');
      }
    } catch (e) {
      console.error('Failed to parse order items from sessionStorage:', e);
      message.error('加载订单信息失败，请重试');
      router.replace('/'); // Redirect if data is invalid
    }
  } else {
    message.error('没有找到订单信息');
    router.replace('/'); // Redirect if no data found
  }
  // Clean up sessionStorage immediately after loading
  // sessionStorage.removeItem('orderConfirmationItems'); // Keep it for now for refresh, clear on confirm/cancel
};

// --- Computed Properties for Summary ---
const subtotal = computed(() => {
  return orderItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
});

const totalQuantity = computed(() => {
   return orderItems.reduce((sum, item) => sum + item.quantity, 0);
});

const shippingFee = ref(0); // Keep shipping fee simple for now

const totalAmount = computed(() => {
  return subtotal.value + shippingFee.value;
});

// --- Update Totals ---
const updateTotal = () => {
  // This function is called by input-number change,
  // computed properties will update automatically.
};

// --- Address Modal Logic ---
const showAddressModal = () => {
  isAddressModalVisible.value = true;
  // Ensure modalSelectedAddressId is current when opening
  if (selectedAddress.value) {
     modalSelectedAddressId.value = selectedAddress.value.id;
  }
};

const handleAddressSelect = () => {
  const newSelectedAddress = userAddresses.find(addr => addr.id === modalSelectedAddressId.value);
  if (newSelectedAddress) {
    selectedAddress.value = newSelectedAddress;
  }
  isAddressModalVisible.value = false;
};

const goToProfile = () => {
    isAddressModalVisible.value = false;
    router.push('/profile');
}

// --- Order Actions ---
const confirmOrder = async () => {
  if (!selectedAddress.value) {
    message.error('请选择收货地址!');
    return;
  }
  submitting.value = true;
  console.log('Submitting Order:', {
    address: JSON.parse(JSON.stringify(selectedAddress.value)),
    items: JSON.parse(JSON.stringify(orderItems)),
    total: totalAmount.value
  });
  // --- Simulate API Call ---
  await new Promise(resolve => setTimeout(resolve, 1500));
  // TODO: Replace with actual API call
  message.success('订单提交成功!');
  sessionStorage.removeItem('orderConfirmationItems'); // Clear temp data
  // TODO: Potentially clear cart items if coming from cart
  router.push('/orders'); // Navigate to My Orders page
  // --- End Simulate API Call ---
  submitting.value = false;
};

const cancelOrder = () => {
  sessionStorage.removeItem('orderConfirmationItems'); // Clear temp data
  router.go(-1); // Go back to the previous page
};

// --- Lifecycle Hook ---
onMounted(async () => {
  loading.value = true;
  loadOrderItems();
  await fetchUserAddresses();
  loading.value = false;
});

</script>

<style scoped>
.order-confirmation-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
}

.section-card {
  margin-bottom: 24px;
}

.summary-card .ant-descriptions-item-label {
  width: 80px; /* Adjust label width if needed */
}

.item-quantity {
  width: 100px; /* Adjust as needed */
  text-align: center;
  margin: 0 16px;
}

.item-subtotal {
  width: 120px; /* Adjust as needed */
  text-align: right;
  font-weight: bold;
}

.order-actions {
  margin-top: 16px;
}

/* Style for Radio buttons in Modal */
:deep(.ant-modal-body .ant-list-item) {
    padding-top: 8px;
    padding-bottom: 8px;
}
:deep(.ant-modal-body .ant-radio-wrapper) {
    display: block; /* Make radio take full width */
    padding: 8px 0;
}
:deep(.ant-modal-body .ant-radio-wrapper p) {
    margin-bottom: 4px; 
    line-height: 1.4;
}
</style> 