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
                
                <a-form-item label="收货地址" name="address">
                  <a-textarea 
                    v-model:value="userForm.address" 
                    placeholder="请输入详细收货地址" 
                    :rows="3"
                  />
                </a-form-item>
                
                <a-form-item>
                  <a-button type="primary" @click="saveUserInfo">保存资料</a-button>
                </a-form-item>
              </a-form>
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
                    <a-button @click="showChangePasswordModal">修改密码</a-button>
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
    OrderedListOutlined 
} from '@ant-design/icons-vue';

const router = useRouter();

const avatarPreview = ref('');
const avatarUploading = ref(false);

const userForm = reactive({
  user_id: null, 
  username: '', 
  avatar: '', 
  email: '', 
  address: '', 
});

const fetchUserProfile = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    userForm.user_id = 10001;
    userForm.username = '张三';
    userForm.avatar = 'https://placehold.co/200x200?text=User'; 
    userForm.email = 'example@mail.com';
    userForm.address = '北京市朝阳区xxx街道xxx号 100010'; 
};

onMounted(() => {
    fetchUserProfile();
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
  message.success('用户信息保存成功');
};

const showChangePasswordModal = () => {
  message.info('修改密码功能待实现');
};

const handleLogout = () => {
  localStorage.removeItem('mockUserToken'); 
  message.success('已退出登录');
  router.push('/login');
};

const handleDeleteAccount = () => {
  console.log('Attempting to delete account for user:', userForm.user_id);
  // --- Add actual API call to delete account here --- 
  // On success:
  message.success('账户已注销');
  localStorage.removeItem('mockUserToken'); // Also clear session
  router.push('/register'); // Redirect to register or login
  // On failure:
  // message.error('注销账户失败，请稍后重试');
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
  display: flex; /* Center avatar inside */
  justify-content: center;
  align-items: center;
  position: relative; /* Needed if you want to absolute position anything inside */
}

/* Style the upload button placed below */
.avatar-uploader-button {
  margin-top: 10px; /* Space between avatar and button */
  text-align: center; /* Center the button itself */
}

.user-basic-info {
  margin-top: 16px; /* Add space above username */
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
</style>
  