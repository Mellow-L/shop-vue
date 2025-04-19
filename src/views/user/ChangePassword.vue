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

const router = useRouter();
const formRef = ref();
const submitting = ref(false);

const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// --- Validation Rules ---
const validatePass = async (_rule, value) => {
  if (value === '') {
    return Promise.reject('请输入新密码');
  } else if (value.length < 6) {
     return Promise.reject('密码长度不能少于6位');
  }
  // Check confirm password if it's already entered
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
  console.log('修改密码表单提交的值:', values);
  submitting.value = true;
  
  // --- Simulate API Call ---
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  // In a real app, you'd call your backend API here to verify the current password 
  // and update it with the new password.
  
  // Example: Simulate success based on a simple check (replace with actual API logic)
  const mockCurrentPasswordCorrect = formState.currentPassword === '123456'; // Replace with real check

  if (mockCurrentPasswordCorrect) {
      message.success('密码修改成功!');
      // Optionally clear login state and redirect to login, or just go back
      router.go(-1); // Go back to the previous page (Profile)
  } else {
      message.error('当前密码错误!');
  }
  // --- End Simulate API Call ---

  submitting.value = false;
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