<template>
  <div class="profile-container">
    <h1 class="page-title">个人资料</h1>
    
    <a-row :gutter="24">
      <a-col :xs="24" :sm="24" :md="8">
        <a-card class="user-card">
          <div class="user-avatar-container" v-if="profileLoading">
              <a-spin />
          </div>
          <div v-else class="user-avatar-container">
              <a-avatar :size="100" :src="avatarPreview || getFullImageUrl(userForm.avatar) || 'https://placehold.co/200x200?text=No+Avatar'" />
          </div>
           <a-upload
              name="avatar"
              list-type="picture"
              class="avatar-uploader-button"
              :show-upload-list="false"
              :customRequest="handleCustomAvatarUpload"
              :before-upload="beforeAvatarUpload"
              :disabled="profileLoading || avatarUploading"
            >
              <a-button :loading="avatarUploading" :disabled="profileLoading">
                 <UploadOutlined /> {{ avatarUploading ? '上传中...' : '更换头像' }}
              </a-button>
            </a-upload>
          
          <div class="user-basic-info" v-if="!profileLoading">
            <h2 class="user-name">{{ userForm.username || userForm.email }}</h2>
            <p class="user-id">用户ID: {{ userForm.user_id }}</p>
          </div>
          <div v-else>
              <a-skeleton :paragraph="{ rows: 1 }" active />
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
              <a-skeleton :paragraph="{ rows: 4 }" active v-if="profileLoading" />
              <a-form
                v-else
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
                  <a-button type="primary" @click="saveUserInfo" :loading="isSavingUserInfo">保存基本资料</a-button>
                </a-form-item>
              </a-form>
              
              <a-divider />
              
              <div class="address-management">
                 <h3>收货地址</h3>
                  <a-skeleton :paragraph="{ rows: 2 }" active v-if="addressLoading" />
                 <a-card v-else-if="userAddress" class="address-card">
                   <a-descriptions :column="1">
                     <a-descriptions-item label="地址信息">{{ userAddress }}</a-descriptions-item> 
                   </a-descriptions>
                   <div class="address-card-actions">
                      <a-button type="primary" @click="showEditAddressModal">修改地址</a-button>
                      <a-button danger @click="deleteAddress" style="margin-left: 8px;">删除地址</a-button>
                   </div>
                 </a-card>
                 <a-empty v-else description="暂无收货地址">
                   <a-button type="primary" @click="showAddAddressModal">
                     <plus-outlined /> 添加地址
                   </a-button>
                 </a-empty>
              </div>
            </a-tab-pane>
            
            <a-tab-pane key="security" tab="账号安全">
               <a-skeleton :paragraph="{ rows: 3 }" active v-if="profileLoading" />
              <a-list v-else>
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
                         :disabled="isDeletingAccount"
                       >
                          <a-button type="primary" danger :loading="isDeletingAccount">注销账户</a-button>
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
import { reactive, onMounted, ref } from 'vue'; 
import { message, Modal, Skeleton as ASkeleton, Spin as ASpin, Popconfirm as APopconfirm } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { 
    UploadOutlined, 
    LoadingOutlined, 
    ShoppingCartOutlined, 
    OrderedListOutlined,
    PlusOutlined
} from '@ant-design/icons-vue';
import { 
    apiFindUserById, 
    apiUpdateUsername, 
    apiUpdateAvatar, 
    apiAddAddress, 
    apiUpdateAddress, 
    apiDeleteAddress,
    apiDeleteUser 
} from '@/api/user'; 
import apiConfig from '@/config/api';
import { Cascader as ACascader } from 'ant-design-vue';
import { Upload } from 'ant-design-vue';

const router = useRouter();

const profileLoading = ref(true);
const avatarPreview = ref('');
const avatarUploading = ref(false);
const currentAvatarFile = ref(null);
const isSavingUserInfo = ref(false);
const isDeletingAccount = ref(false);

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
const addressFormRef = ref();
const userAddress = ref(null); 
const addressForm = reactive({
  recipient_name: '', 
  recipient_email: '', 
  area: [], 
  detailed_address: '' 
});
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

const getUserIdFromStorage = () => {
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
     console.error(`Error getting user ID from localStorage ('${storageKey}' -> '${userIdProperty}'):`, e);
   } 
   console.warn('Failed to get user ID from localStorage.');
   return null;
};

const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
  const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return baseUrl + imagePath;
};

const fetchUserProfile = async () => {
    profileLoading.value = true;
    addressLoading.value = true;
    const userId = getUserIdFromStorage();
    if (!userId) {
        message.error('无法获取用户信息，请重新登录。');
        router.push('/login');
        profileLoading.value = false;
        addressLoading.value = false;
        return;
    }

    try {
        const res = await apiFindUserById(userId);
        if (res && res.code === 200 && res.user) {
            userForm.user_id = res.user.user_id;
            userForm.username = res.user.username || '';
            userForm.avatar = res.user.avatar || '';
            userForm.email = res.user.email;
            userAddress.value = res.user.address || null;
            avatarPreview.value = '';
            currentAvatarFile.value = null;
        } else {
            throw new Error(res?.message || '获取用户信息失败');
        }
    } catch (error) {
        console.error("获取用户信息失败:", error);
        message.error(error.message || '获取用户信息时发生错误');
    } finally {
        profileLoading.value = false;
        addressLoading.value = false;
    }
};

onMounted(async () => {
    await fetchUserProfile();
});

const beforeAvatarUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) message.error('只能上传 JPG/PNG 格式!');
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) message.error('图片需小于 2MB!');
  
  if (isJpgOrPng && isLt2M) {
      // Generate preview
      getBase64(file, base64Url => {
         avatarPreview.value = base64Url;
      });
      // Return the file object for customRequest
      return file; 
  } else {
      avatarPreview.value = '';
      // Prevent upload and listing
      return Upload.LIST_IGNORE; 
  }
};

const handleCustomAvatarUpload = async ({ file, onSuccess, onError }) => {
    console.log("Custom upload triggered with file:", file);
    const userId = getUserIdFromStorage();
    if (!userId) {
         message.error('无法获取用户ID，请重新登录');
         onError(new Error('User ID not found')); 
         return;
    }

    avatarUploading.value = true;
    try {
        const res = await apiUpdateAvatar(userId, file); // Pass the file from handler
        if (res && res.code === 200) {
            message.success('头像更新成功！');
            if (res.data && res.data.avatar) {
                userForm.avatar = res.data.avatar; 
                console.log("New avatar relative path:", userForm.avatar);
            } else {
                console.warn("Backend did not return new avatar path, refetching profile.");
                await fetchUserProfile();
            }
            avatarPreview.value = ''; 
            onSuccess(res.data, file); // Notify success
        } else {
             message.error(res?.message || '头像上传失败');
             onError(new Error(res?.message || 'Upload failed'), file); 
        }
    } catch (error) {
        console.error("上传头像失败:", error);
        message.error(error.message || '上传头像时发生错误');
        onError(error, file); 
    } finally {
        avatarUploading.value = false;
    }
};

const saveUserInfo = async () => {
  if (!userForm.user_id) {
      message.error("无法获取用户ID");
      return;
  }
  isSavingUserInfo.value = true;
  try {
      await apiUpdateUsername(userForm.user_id, userForm.username);
  } catch (error) {
      console.error("保存用户信息失败 (MyProfile catch block):", error);
  } finally {
      isSavingUserInfo.value = false;
  }
};

const resetAddressForm = () => {
  if (addressFormRef.value) {
    addressFormRef.value.resetFields();
  }
  addressForm.recipient_name = '';
  addressForm.recipient_email = '';
  addressForm.area = [];
  addressForm.detailed_address = '';
};

const showAddAddressModal = () => {
  isEditingAddress.value = false;
  resetAddressForm();
  isAddressModalVisible.value = true;
};

const showEditAddressModal = () => {
  isEditingAddress.value = true;
  resetAddressForm();
  isAddressModalVisible.value = true;
};

const handleAddressSubmit = async () => {
  const userId = getUserIdFromStorage();
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
        
    console.log("准备提交的组合地址字符串:", combinedAddressString);

    let res;
    if (isEditingAddress.value) {
      res = await apiUpdateAddress(userId, combinedAddressString);
      if (res && res.code === 200) {
        userAddress.value = combinedAddressString; 
        isAddressModalVisible.value = false;
      } else {
        console.error("地址更新失败 (API Response in MyProfile):", res);
      }
    } else {
      res = await apiAddAddress(userId, combinedAddressString);
      if (res && res.code === 200) {
        userAddress.value = combinedAddressString; 
        isAddressModalVisible.value = false;
      } else {
        console.error("地址添加失败 (API Response in MyProfile):", res);
      }
    }
  } catch (validationError) {
    console.error('Address form validation failed:', validationError);
  } finally {
    addressSubmitting.value = false;
  }
};

const deleteAddress = async () => {
    const userId = getUserIdFromStorage();
    if (!userId || !userAddress.value) {
        message.warning('没有可删除的地址或无法获取用户ID');
        return;
    }
    Modal.confirm({
        title: '确定要删除收货地址吗？',
        content: '删除后需要重新添加。',
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
            try {
                console.log(`Attempting to delete address for user: ${userId}`);
                const res = await apiDeleteAddress(userId);
                if (res && res.code === 200) {
                    userAddress.value = null;
                    message.success("地址删除成功");
                } else {
                    console.error("API Error deleting address:", res?.message);
                }
            } catch (error) {
                console.error("Error calling deleteAddress API:", error);
            }
        },
        onCancel() {
            console.log('地址删除已取消');
        },
    });
};

const goToChangePassword = () => { router.push('/change-password'); };

const handleLogout = () => {
  localStorage.removeItem('userInfo'); 
  message.success('已退出登录');
  router.push('/login');
};

const handleDeleteAccount = async () => {
  const userId = getUserIdFromStorage();
  if (!userId) {
      message.error('无法获取用户ID，无法注销账户');
      return;
  }
  isDeletingAccount.value = true;
  console.log('Attempting to delete account for user:', userId);
  try {
      const res = await apiDeleteUser(userId);
      if (res && res.code === 200) {
         message.success('账户已成功注销');
         localStorage.removeItem('userInfo');
         router.push('/login');
      } else {
         message.error(res?.message || '注销账户失败');
      }
  } catch (error) {
      console.error("注销账户失败:", error);
      message.error(error.message || '注销账户时发生错误');
  } finally {
      isDeletingAccount.value = false;
  }
};

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};

</script>

<style scoped>
.profile-container {
  padding: 24px;
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
.address-card {
  margin-bottom: 16px;
}

:deep(.ant-cascader-picker) {
    width: 100%;
}

.address-card-actions {
    margin-top: 16px;
    text-align: right; 
}
</style>
  