<template>
  <div class="profile-container">
    <h1 class="page-title">个人资料</h1>
    
    <a-row :gutter="24">
      <a-col :xs="24" :sm="24" :md="8">
        <a-card class="user-card">
          <div class="user-avatar-container">
            <a-avatar :size="100" :src="avatarPreview || userForm.avatar || 'https://placehold.co/200x200?text=No+Avatar'" />
          </div>
           <a-upload
              name="avatar"
              list-type="picture"
              class="avatar-uploader-button"
              :show-upload-list="false"
              action="/mock/upload" 
              :before-upload="beforeAvatarUpload"
              @change="handleAvatarChange"
            >
              <a-button :loading="avatarUploading">
                 <UploadOutlined /> {{ avatarUploading ? '上传中...' : '更换头像' }}
              </a-button>
            </a-upload>
          
          <div class="user-basic-info">
            <h2 class="user-name">{{ userForm.username || userForm.email }}</h2>
            <p class="user-id">用户ID: {{ userForm.user_id }}</p>
          </div>
          
          <a-divider />
          <div class="quick-links">
            <a-button type="link" @click="$router.push('/cart')">
              <ShoppingCartOutlined /> 我的购物车
            </a-button>
            <a-button type="link" @click="$router.push('/orders')">
              <OrderedListOutlined /> 我的订单
            </a-button>
          </div>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="24" :md="16">
        <a-card>
          <a-tabs>
            <a-tab-pane key="user-info" tab="编辑资料">
              <a-form
                :model="userForm"
                name="userForm"
                layout="vertical" 
              >
                <a-form-item label="用户ID" name="user_id">
                  <a-input :value="userForm.user_id" disabled />
                </a-form-item>

                <a-form-item label="账号 (邮箱)" name="email">
                  <a-input :value="userForm.email" disabled />
                </a-form-item>

                <a-form-item label="用户名" name="username" help="用户名可用于显示，非必填">
                  <a-input v-model:value="userForm.username" placeholder="请输入用户名" />
                </a-form-item>
                
                <a-form-item>
                  <a-button type="primary" @click="saveUserInfo">保存基本资料</a-button>
                </a-form-item>
              </a-form>
              
              <a-divider />
              
              <div class="address-management">
                 <h3>收货地址管理</h3>
                 <a-button @click="showAddAddressModal" class="add-address-btn">
                   <plus-outlined /> 添加新地址
                 </a-button>
                 <a-list :data-source="userAddresses" :loading="addressLoading" item-layout="horizontal">
                   <template #renderItem="{ item }">
                     <a-list-item>
                       <a-list-item-meta>
                         <template #title>
                           <span>{{ item.recipient_name }} {{ item.recipient_phone }}</span>
                           <a-tag v-if="item.is_default" color="orange" style="margin-left: 8px;">默认</a-tag>
                         </template>
                         <template #description>
                           {{ item.province }} {{ item.city }} {{ item.district }} {{ item.detailed_address }} {{ item.postal_code }}
                         </template>
                       </a-list-item-meta>
                       <template #actions>
                         <a-button type="link" @click="editAddress(item)">编辑</a-button>
                         <a-popconfirm
                           title="确定要删除此地址吗？"
                           ok-text="删除"
                           cancel-text="取消"
                           @confirm="deleteAddress(item.id)"
                         >
                           <a-button type="link" danger>删除</a-button>
                         </a-popconfirm>
                       </template>
                     </a-list-item>
                   </template>
                   <template #empty v-if="!addressLoading && userAddresses.length === 0">
                     <a-empty description="暂无收货地址" />
                   </template>
                 </a-list>
              </div>
            </a-tab-pane>
            
            <a-tab-pane key="security" tab="账号安全">
              <a-list>
                <a-list-item>
                  <a-list-item-meta title="登录密码">
                    <template #description>
                      <span>定期修改密码可以保护账号安全</span>
                    </template>
                  </a-list-item-meta>
                  <template #extra>
                    <a-button @click="goToChangePassword">修改密码</a-button>
                  </template>
                </a-list-item>
                <a-list-item>
                    <a-list-item-meta title="退出登录">
                       <template #description>
                         <span>退出当前账号登录</span>
                       </template>
                     </a-list-item-meta>
                     <template #extra>
                       <a-button danger @click="handleLogout">退出登录</a-button>
                     </template>
                 </a-list-item>
                 <a-list-item>
                    <a-list-item-meta title="注销账户">
                       <template #description>
                         <span style="color: red;">警告：此操作将永久删除您的账户及所有数据，无法恢复。</span>
                       </template>
                     </a-list-item-meta>
                     <template #extra>
                       <a-popconfirm
                         title="确定要永久注销您的账户吗？"
                         ok-text="确认注销"
                         ok-type="danger"
                         cancel-text="取消"
                         @confirm="handleDeleteAccount"
                       >
                          <a-button type="primary" danger>注销账户</a-button>
                       </a-popconfirm>
                     </template>
                 </a-list-item>
              </a-list>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>

    <a-modal 
      v-model:open="isAddressModalVisible" 
      :title="isEditingAddress ? '编辑收货地址' : '添加新收货地址'" 
      @ok="handleAddressSubmit" 
      :confirm-loading="addressSubmitting"
      width="600px"
      ok-text="保存"
      cancel-text="取消"
    >
      <a-form :model="addressForm" ref="addressFormRef" layout="vertical" name="addressForm">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item 
              label="收件人姓名" 
              name="recipient_name" 
              :rules="[{ required: true, message: '请输入收件人姓名' }]"
            >
              <a-input v-model:value="addressForm.recipient_name" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item 
              label="手机号码" 
              name="recipient_phone" 
              :rules="[{ required: true, message: '请输入手机号码' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号码格式不正确' }]"
            >
              <a-input v-model:value="addressForm.recipient_phone" placeholder="请输入手机号码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
             <a-form-item label="省份" name="province" :rules="[{ required: true, message: '请输入省份' }]">
               <a-input v-model:value="addressForm.province" placeholder="例如：北京市" />
             </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="城市" name="city" :rules="[{ required: true, message: '请输入城市' }]">
               <a-input v-model:value="addressForm.city" placeholder="例如：北京市" />
             </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="区/县" name="district" :rules="[{ required: true, message: '请输入区/县' }]">
               <a-input v-model:value="addressForm.district" placeholder="例如：朝阳区" />
             </a-form-item>
          </a-col>
        </a-row>
        <a-form-item 
          label="详细地址" 
          name="detailed_address" 
          :rules="[{ required: true, message: '请输入详细地址' }]"
        >
          <a-textarea v-model:value="addressForm.detailed_address" placeholder="请输入街道、楼牌号等详细信息" :rows="3" />
        </a-form-item>
        <a-form-item label="邮政编码" name="postal_code">
           <a-input v-model:value="addressForm.postal_code" placeholder="请输入邮政编码 (可选)" />
        </a-form-item>
        <a-form-item name="is_default">
          <a-checkbox v-model:checked="addressForm.is_default">设为默认地址</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'; 
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { 
    UploadOutlined, 
    LoadingOutlined, 
    ShoppingCartOutlined, 
    OrderedListOutlined,
    PlusOutlined
} from '@ant-design/icons-vue';

const router = useRouter();

const avatarPreview = ref('');
const avatarUploading = ref(false);

const userForm = reactive({
  user_id: null, 
  username: '', 
  avatar: '', 
  email: '', 
});

const isAddressModalVisible = ref(false);
const addressSubmitting = ref(false);
const addressLoading = ref(false);
const isEditingAddress = ref(false);
const editingAddressId = ref(null);
const addressFormRef = ref();

const userAddresses = reactive([]);

const addressForm = reactive({
  id: null,
  recipient_name: '',
  recipient_phone: '',
  province: '',
  city: '',
  district: '',
  detailed_address: '',
  postal_code: '',
  is_default: false,
});

const fetchUserProfile = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    userForm.user_id = 10001;
    userForm.username = '张三';
    userForm.avatar = 'https://placehold.co/200x200?text=User'; 
    userForm.email = 'example@mail.com';
};

const fetchUserAddresses = async () => {
    addressLoading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const mockAddresses = [
      { id: 1, recipient_name: '张三', recipient_phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', detailed_address: 'xxx街道xxx号', postal_code: '100010', is_default: true },
      { id: 2, recipient_name: '李四', recipient_phone: '13900139000', province: '上海市', city: '上海市', district: '浦东新区', detailed_address: 'yyy路yyy弄yyy号', postal_code: '200120', is_default: false },
    ];
    userAddresses.splice(0, userAddresses.length, ...mockAddresses);
    addressLoading.value = false;
};

onMounted(async () => {
    await fetchUserProfile();
    await fetchUserAddresses();
});

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};

const beforeAvatarUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!');
  }
  if (isJpgOrPng && isLt2M) {
      getBase64(file, base64Url => {
         avatarPreview.value = base64Url;
      });
  }
  return isJpgOrPng && isLt2M;
};

const handleAvatarChange = (info) => {
  if (info.file.status === 'uploading') {
    avatarUploading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    avatarUploading.value = false;
    userForm.avatar = avatarPreview.value;
    message.success(`${info.file.name} 上传成功`);
  }
  if (info.file.status === 'error') {
    avatarUploading.value = false;
    message.error(`${info.file.name} 上传失败.`);
  }
};

const saveUserInfo = () => {
  console.log('Saving user info:', JSON.parse(JSON.stringify(userForm)));
  message.success('基本资料保存成功');
};

const resetAddressForm = () => {
  if (addressFormRef.value) {
    addressFormRef.value.resetFields();
  }
  Object.assign(addressForm, {
    id: null, recipient_name: '', recipient_phone: '', province: '', 
    city: '', district: '', detailed_address: '', postal_code: '', is_default: false 
  });
  isEditingAddress.value = false;
  editingAddressId.value = null;
};

const showAddAddressModal = () => {
  resetAddressForm();
  isAddressModalVisible.value = true;
};

const editAddress = (address) => {
  resetAddressForm();
  Object.assign(addressForm, address);
  isEditingAddress.value = true;
  editingAddressId.value = address.id;
  isAddressModalVisible.value = true;
};

const handleAddressSubmit = async () => {
  try {
    await addressFormRef.value.validate();
    addressSubmitting.value = true;
    console.log('Submitting address form:', JSON.parse(JSON.stringify(addressForm)));
    
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    if (isEditingAddress.value) {
      const index = userAddresses.findIndex(addr => addr.id === editingAddressId.value);
      if (index !== -1) {
        if (addressForm.is_default) {
          userAddresses.forEach(addr => { if (addr.id !== editingAddressId.value) addr.is_default = false; });
        }
        userAddresses[index] = { ...addressForm };
      }
      message.success('地址更新成功');
    } else {
      const newId = Math.max(0, ...userAddresses.map(addr => addr.id)) + 1;
      const newAddress = { ...addressForm, id: newId };
      if (newAddress.is_default) {
         userAddresses.forEach(addr => addr.is_default = false);
      }
      userAddresses.push(newAddress);
      message.success('新地址添加成功');
    }

    isAddressModalVisible.value = false;

  } catch (errorInfo) {
    console.log('Failed:', errorInfo);
    message.error('请检查表单信息是否完整且正确');
  } finally {
    addressSubmitting.value = false;
  }
};

const deleteAddress = async (id) => {
  console.log('Attempting to delete address:', id);
  await new Promise(resolve => setTimeout(resolve, 300)); 
  const index = userAddresses.findIndex(addr => addr.id === id);
  if (index !== -1) {
    userAddresses.splice(index, 1);
    message.success('地址删除成功');
  } else {
    message.error('删除失败，未找到地址');
  }
};

const goToChangePassword = () => {
  router.push('/change-password');
};

const handleLogout = () => {
  localStorage.removeItem('mockUserToken'); 
  message.success('已退出登录');
  router.push('/'); // Redirect to home/shop page after logout
};

const handleDeleteAccount = async () => {
  console.log('Attempting to delete account for user:', userForm.user_id);
  // --- Add actual API call to delete account here --- 
  try {
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('账户已注销');
      localStorage.removeItem('mockUserToken');
      router.push('/register'); 
  } catch (error) {
      message.error('注销账户失败，请稍后重试');
  }
};

</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
}

.user-card {
  margin-bottom: 24px;
  text-align: center; 
}

.user-avatar-container {
  width: 100px; 
  height: 100px;
  margin: 0 auto 10px; 
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.avatar-uploader-button {
  margin-top: 10px;
  text-align: center;
}

.user-basic-info {
  margin-top: 16px;
  text-align: center;
}

.user-name {
  margin-bottom: 5px; 
}

.user-id {
  margin: 5px 0;
  color: #666;
}

.quick-links {
    margin-top: 16px;
    display: flex;
    flex-direction: column; 
    align-items: center; 
    gap: 8px;
}
.quick-links .ant-btn {
    padding: 0; 
}

:deep(.ant-form-item-label) {
  text-align: left;
}

:deep(.ant-tabs-tabpane) {
    padding-top: 16px;
}

@media (max-width: 768px) {
  .user-card {
    margin-bottom: 16px;
  }
}

.address-management {
  margin-top: 20px;
}
.address-management h3 {
  margin-bottom: 16px;
}
.add-address-btn {
  margin-bottom: 16px;
}
</style>
  