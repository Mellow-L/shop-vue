<template>
  <div class="order-confirmation-container">
    <h1 class="page-title">确认订单信息</h1>
    
    <a-spin :spinning="loading">
      <a-row :gutter="24">
        <!-- Left Side: Address and Products -->
        <a-col :xs="24" :md="16">
          <!-- Address Section -->
          <a-card title="收货地址" class="section-card">
            <template #extra v-if="currentUserAddress && !addressLoading">
              <a-button type="link" @click="showEditAddressModal">修改地址</a-button>
            </template>
            
            <div v-if="addressLoading">
              <a-spin tip="加载地址中..."></a-spin>
            </div>
            <div v-else-if="addressError">
               <a-alert :message="addressError" type="warning" show-icon>
                 <template #action>
                   <a-button size="small" type="primary" ghost @click="goToProfile">
                     前往设置
                   </a-button>
                 </template>
               </a-alert>
            </div>
            <div v-else-if="currentUserAddress">
              <p><strong>{{ currentUserAddress }}</strong></p>
            </div>
            <div v-else>
              <a-empty description="未设置收货地址">
                 <a-button type="primary" @click="goToProfile">立即设置</a-button>
              </a-empty>
            </div>
          </a-card>

          <!-- Products Section -->
          <a-card title="商品列表" class="section-card">
            <a-list item-layout="horizontal" :data-source="orderItems">
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #avatar>
                      <a-avatar :src="getImageUrl(item.product_picture) || 'https://placehold.co/100x100?text=No+Image'" shape="square" :size="64"/>
                    </template>
                    <template #title>
                      <a>{{ item.product_name }}</a>
                    </template>
                    <template #description>
                      <span>ID: {{ item.product_id }} | 单价: ¥{{ formatPrice(item.product_price) }}</span> 
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

    <!-- Address Edit Modal -->
    <a-modal 
      v-model:open="isAddressModalVisible" 
      title="修改收货地址" 
      @ok="handleAddressUpdateFromConfirm" 
      :confirm-loading="addressSubmitting"
      width="600px"
      ok-text="保存"
      cancel-text="取消"
      :destroyOnClose="true" 
    >
      <a-alert message="请重新填写所有地址信息进行修改。" type="info" show-icon style="margin-bottom: 16px;" />
      <a-form :model="addressForm" ref="addressFormRef" layout="vertical" name="addressEditForm">
        <a-form-item 
          label="收货人姓名" 
          name="recipient_name" 
          :rules="[{ required: true, message: '请输入收货人姓名' }]"
        >
          <a-input v-model:value="addressForm.recipient_name" placeholder="请输入姓名" />
        </a-form-item>
        
        <a-form-item 
          label="电子邮箱" 
          name="recipient_email" 
          :rules="[
            { required: true, message: '请输入电子邮箱' },
            { type: 'email', message: '请输入有效的电子邮箱格式!' }
          ]"
        >
          <a-input v-model:value="addressForm.recipient_email" placeholder="请输入电子邮箱" />
        </a-form-item>
         
         <a-form-item 
            label="所在地区" 
            name="area" 
            :rules="[{ required: true, message: '请选择所在地区' }]"
         >
           <a-cascader 
             v-model:value="addressForm.area" 
             :options="addressOptions" 
             placeholder="请选择省/市/区"
           />
         </a-form-item>

        <a-form-item 
          label="详细地址" 
          name="detailed_address" 
          :rules="[{ required: true, message: '请输入详细地址' }]"
        >
          <a-textarea v-model:value="addressForm.detailed_address" placeholder="请输入街道、楼牌号等详细信息" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal, Spin, Row, Col, Card, Button, Empty, List, ListItem, ListItemMeta, Avatar, InputNumber, Descriptions, DescriptionsItem, RadioGroup, Radio, Divider, Alert, Form as AForm, FormItem as AFormItem, Input as AInput, Cascader as ACascader, Textarea as ATextarea } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { apiFindUserById, apiUpdateAddress } from '@/api/user';
import { apiAddOrder, apiDeleteCartItem } from '@/api/order';
import apiConfig from '@/config/api';

const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const orderItems = reactive([]);
const currentUserAddress = ref(null);
const addressLoading = ref(false);
const addressError = ref(null);

// --- 新增地址模态框相关状态 ---
const isAddressModalVisible = ref(false);
const addressSubmitting = ref(false);
const addressFormRef = ref();
const addressForm = reactive({
  recipient_name: '', 
  recipient_email: '',
  area: [], 
  detailed_address: '' 
});
// 模拟地址选项，与 MyProfile 保持一致或从配置导入
const addressOptions = ref([
  { value: '浙江省', label: '浙江省', children: [
      { value: '杭州市', label: '杭州市', children: [
          { value: '西湖区', label: '西湖区' },
          { value: '上城区', label: '上城区' }
      ]}
  ]},
  { value: '江苏省', label: '江苏省', children: [
      { value: '南京市', label: '南京市', children: [
          { value: '鼓楼区', label: '鼓楼区' }
      ]}
  ]}
]);
// -------

const getUserId = () => {
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
     console.error(`[getUserId] Error getting user ID from localStorage:`, e);
   } 
   return null;
};

const fetchCurrentUserAddress = async () => {
    addressLoading.value = true;
    addressError.value = null;
    currentUserAddress.value = null;
    const userId = getUserId();

    if (!userId) {
        addressError.value = "无法获取用户ID，请重新登录";
        addressLoading.value = false;
        return;
    }

    try {
        const res = await apiFindUserById(userId);
        if (res && res.code === 200 && res.user) {
            if (res.user.address) {
                currentUserAddress.value = res.user.address;
            } else {
                addressError.value = "您还没有设置收货地址，请先前往个人资料页添加。";
                 currentUserAddress.value = null;
            }
        } else {
            throw new Error(res?.message || "获取地址信息失败");
        }
    } catch (err) {
        console.error("获取用户地址失败:", err);
        addressError.value = err.message || "加载地址信息时发生错误";
         currentUserAddress.value = null;
    } finally {
        addressLoading.value = false;
    }
};

const loadOrderItems = () => {
  const itemsString = sessionStorage.getItem('orderConfirmationItems');
  if (itemsString) {
    try {
      const items = JSON.parse(itemsString);
      if (Array.isArray(items) && items.length > 0) {
         orderItems.splice(0, orderItems.length, ...items); 
      } else {
        throw new Error('Invalid order items data');
      }
    } catch (e) {
      console.error('Failed to parse order items from sessionStorage:', e);
      message.error('加载订单信息失败，请重试');
      router.replace('/'); 
    }
  } else {
    message.error('没有找到订单信息');
    router.replace('/');
  }
};

const subtotal = computed(() => {
  return orderItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
});

const totalQuantity = computed(() => {
   return orderItems.reduce((sum, item) => sum + item.quantity, 0);
});

const shippingFee = ref(0); 

const totalAmount = computed(() => {
  return subtotal.value + shippingFee.value;
});

const updateTotal = () => {
};

const getImageUrl = (relativePath) => {
  if (relativePath) {
    const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
    const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return baseUrl + imagePath;
  } else {
    return 'https://placehold.co/100x100/EEE/AAA?text=No+Image';
  }
};

const formatPrice = (price) => {
  if (typeof price === 'number') {
      return price.toFixed(2);
  }
  return '0.00';
};

const showEditAddressModal = () => {
  // 重置表单（因为无法预填充）
  if (addressFormRef.value) {
      addressFormRef.value.resetFields();
  }
  addressForm.recipient_name = '';
  addressForm.recipient_email = '';
  addressForm.area = [];
  addressForm.detailed_address = '';
  
  isAddressModalVisible.value = true;
};

const handleAddressUpdateFromConfirm = async () => {
  const userId = getUserId();
  if (!userId) {
      message.error("用户ID丢失，无法保存地址");
      return;
  }
  try {
    await addressFormRef.value.validate();
    addressSubmitting.value = true;
    const { recipient_name, recipient_email, area, detailed_address } = addressForm;
    const [province, city, district] = area;
    const combinedAddressString = 
        `${recipient_name}, ${recipient_email}, ${province || ''}${city || ''}${district || ''}${detailed_address}`;
    console.log("准备更新的组合地址字符串:", combinedAddressString);

    // 调用更新地址 API (内部处理消息)
    const res = await apiUpdateAddress(userId, combinedAddressString);
    
    if (res && res.code === 200) {
      currentUserAddress.value = combinedAddressString; 
      isAddressModalVisible.value = false; 
    } else {
      console.error("地址更新失败 (API Response in OrderConfirmation):", res);
    }
  } catch (validationError) {
    console.error('Address form validation failed:', validationError);
  } finally {
    addressSubmitting.value = false;
  }
};

const goToProfile = () => {
    router.push('/profile');
}

const confirmOrder = async () => {
  const userId = getUserId();
  if (!currentUserAddress.value) {
    message.error('请先设置收货地址!');
    Modal.confirm({
        title: '缺少收货地址',
        content: '您需要先在个人资料页面设置收货地址才能下单。是否现在前往？',
        okText: '前往设置',
        cancelText: '取消',
        onOk: () => goToProfile(),
    });
    return;
  }
  if (!userId) {
      message.error("无法获取用户信息，请重新登录后再试");
      return;
  }

  submitting.value = true;
  const results = [];
  let hasError = false;

  console.log(`准备为 ${orderItems.length} 个商品创建订单并删除购物车项...`);

  for (const item of orderItems) {
      if (item.quantity <= 0) continue;

      const orderJsonData = {
          order_id: 0,
          order_state: "待发货",
          product_number: item.quantity,
          receiver: "用户", 
          address: currentUserAddress.value,
          product_id: item.product_id,
          product_name: item.product_name,
          user_id: userId,
          total_price: item.product_price * item.quantity,
      };

      console.log(`  - 正在为商品 ${item.product_id} 创建订单...`, orderJsonData);

      try {
          // 1. 创建订单 (apiAddOrder 内部处理消息)
          const addRes = await apiAddOrder(orderJsonData);
          results.push({ success: true, type: 'add', data: addRes, item });

          if (addRes && addRes.code === 200) {
              // 2. 删除购物车项 (apiDeleteCartItem 内部处理消息)
              console.log(`   - 订单创建成功，尝试删除购物车项...`);
              try {
                  const deleteRes = await apiDeleteCartItem(item.product_id, userId);
                  if (deleteRes && deleteRes.code === 200) {
                      console.log(`    - 购物车项删除成功。`);
                  } else {
                      hasError = true;
                      console.error(`    - 删除购物车项失败 (API Response):`, deleteRes);
                      results.push({ success: false, type: 'delete', data: deleteRes, item });
                  }
              } catch (deleteErr) {
                  hasError = true;
                  console.error(`    - 删除购物车项失败 (Catch Block):`, deleteErr);
                  results.push({ success: false, type: 'delete', error: deleteErr, item });
              }
          } else {
              hasError = true;
              console.error(`   - 商品 ${item.product_id} 订单创建失败 (API Response):`, addRes);
          }
      } catch (addErr) {
          hasError = true;
          results.push({ success: false, type: 'add', error: addErr, item });
          console.error(`   - 商品 ${item.product_id} 订单创建失败 (Catch Block):`, addErr);
      }
  }

  // *** 保留这里的总体成功/失败提示 ***
  if (!hasError) {
      message.success('所有商品订单已成功提交，购物车已更新!');
      sessionStorage.removeItem('orderConfirmationItems'); 
      router.push('/orders'); 
  } else {
       message.warning('订单提交过程中遇到问题，部分购物车项目可能未删除，请检查。详情见控制台日志。'); 
      results.filter(r => !r.success).forEach(r => {
           console.error(`失败详情: 操作类型 [${r.type}], 商品 ${r.item.product_name} (ID: ${r.item.product_id}), 错误:`, r.error || r.data?.message);
      });
       sessionStorage.removeItem('orderConfirmationItems');
       router.push('/orders'); 
  }

  submitting.value = false;
};

const cancelOrder = () => {
  sessionStorage.removeItem('orderConfirmationItems');
  router.go(-1); 
};

onMounted(async () => {
  loading.value = true;
  loadOrderItems();
  await fetchCurrentUserAddress();
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
  width: 80px;
}

.item-quantity {
  width: 100px;
  text-align: center;
  margin: 0 16px;
}

.item-subtotal {
  width: 120px;
  text-align: right;
  font-weight: bold;
}

.order-actions {
  margin-top: 16px;
}

:deep(.ant-modal-body .ant-list-item) {
    padding-top: 8px;
    padding-bottom: 8px;
}
:deep(.ant-modal-body .ant-radio-wrapper) {
    display: block;
    padding: 8px 0;
}
:deep(.ant-modal-body .ant-radio-wrapper p) {
    margin-bottom: 4px; 
    line-height: 1.4;
}
</style> 