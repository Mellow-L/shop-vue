<template>
  <div class="change-password-container">
    <a-card title="修改密码" class="change-password-card">
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        name="changePasswordForm"
        layout="vertical"
        @finish="onFinish"
      >
        <a-form-item label="当前密码" name="currentPassword">
          <a-input-password v-model:value="formState.currentPassword" placeholder="请输入当前使用的密码" />
        </a-form-item>

        <a-form-item label="新密码" name="newPassword">
          <a-input-password v-model:value="formState.newPassword" placeholder="请输入新密码（至少6位）" />
        </a-form-item>

        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password v-model:value="formState.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="submitting">确认修改</a-button>
          <a-button style="margin-left: 10px;" @click="goBack">取消</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
// Import the API function
import { apiUpdatePassword } from '../../api/user'; 

const router = useRouter();
const formRef = ref();
const submitting = ref(false);

const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// --- Helper: Get User ID --- 
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

// --- Validation Rules --- 
const validatePass = async (_rule, value) => {
  if (value === '') {
    return Promise.reject('请输入新密码');
  } else if (value.length < 6) {
     return Promise.reject('密码长度不能少于6位');
  }
  if (formState.confirmPassword !== '') {
    formRef.value.validateFields('confirmPassword');
  }
  return Promise.resolve();
};

const validatePass2 = async (_rule, value) => {
  if (value === '') {
    return Promise.reject('请再次输入新密码');
  } else if (value !== formState.newPassword) {
    return Promise.reject('两次输入的新密码不一致!');
  } else {
    return Promise.resolve();
  }
};

const rules = {
  currentPassword: [{ required: true, message: '请输入当前密码!', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
};
// --- End Validation Rules ---

const onFinish = async values => {
  console.log('修改密码表单提交的值: ', values);
  submitting.value = true;

  const userId = getUserIdFromStorage();
  if (!userId) {
      message.error("无法获取用户信息，请重新登录后尝试修改密码。");
      submitting.value = false;
      return;
  }

  // --- Actual API Call --- 
  try {
      // Pass userId, currentPassword, and newPassword to the updated API function
      const res = await apiUpdatePassword(
          userId, 
          formState.currentPassword, // Pass current password
          formState.newPassword
      );
      
      if (res && res.code === 200) {
          message.info('密码已更新，请重新登录以使更改生效（如果需要）。'); 
          formRef.value.resetFields();
          router.go(-1); 
      } else {
           console.error("修改密码失败，响应:", res);
           // Failure message is handled by apiUpdatePassword
      }
  } catch (error) {
      console.error("调用修改密码 API 时出错:", error);
      // Failure message is handled by apiUpdatePassword
  } finally {
      submitting.value = false;
  }
  // --- End Actual API Call ---
};

const goBack = () => {
  router.go(-1); // Navigate back
};
</script>

<style scoped>
.change-password-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px; /* Add padding */
}

.change-password-card {
  width: 100%;
  max-width: 500px; /* Limit width */
}
</style> 