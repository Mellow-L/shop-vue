<template>
  <div class="register-container">
    <a-card class="register-card" :bordered="false">
      <h1 class="system-title">在线购物系统</h1>
      <h2 class="page-title">用户注册</h2>
      <a-form
        :model="formState"
        name="registerForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        autocomplete="off"
        @finish="onRegister"
      >
        <a-form-item
          label="电子邮箱"
          name="email"
          :rules="[
            { required: true, message: '请输入电子邮箱!' },
            { type: 'email', message: '请输入有效的电子邮箱格式!' }
          ]"
        >
          <a-input v-model:value="formState.email" placeholder="请输入电子邮箱" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[
            { required: true, message: '请输入密码!' },
            { min: 6, message: '密码长度不能小于6个字符!' }
          ]"
          has-feedback
        >
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item
          label="确认密码"
          name="confirmPassword"
          :rules="[
            { required: true, message: '请确认密码!' },
            { validator: validateConfirmPassword }
          ]"
          has-feedback
        >
          <a-input-password v-model:value="formState.confirmPassword" placeholder="请确认密码" />
        </a-form-item>

        <a-form-item name="agreement" :wrapper-col="{ offset: 6, span: 18 }">
          <a-checkbox v-model:checked="formState.agreement">
            我已阅读并同意 <a href="">服务条款</a> 和 <a href="">隐私政策</a>
          </a-checkbox>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
          <a-button 
            type="primary" 
            html-type="submit" 
            class="register-form-button"
            :disabled="!formState.agreement"
            :loading="submitting" 
          >
             {{ submitting ? '注册中...' : '注册' }}
          </a-button>
          <div class="login-link">
            已有账号? <router-link to="/login">立即登录!</router-link>
          </div>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { gotoLogin } from '../../router';
import { apiRegisterUser } from '../../api/user';

const router = useRouter();
const submitting = ref(false);
const formState = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false,
});

const validateConfirmPassword = async (rule, value) => {
  if (!value) {
    return Promise.reject('请确认密码!');
  }
  if (value !== formState.password) {
    return Promise.reject('两次输入的密码不一致!');
  }
  return Promise.resolve();
};

const onRegister = async formData => {
  submitting.value = true;
  try {
    const loginData = {
      email: formState.email,
      password: formState.password
    };
    let data = await apiRegisterUser(loginData);
    if(data){
      message.success('注册成功,请登录');
    } 
    gotoLogin()
  } catch (error) {
    console.error("注册失败:", error);
    message.error('注册失败，请重试');
  } finally {
    submitting.value = false;
  }
};

</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px 0;
}

.register-card {
  width: 450px;
}

.system-title {
  text-align: center;
  color: #1890ff;
  font-size: 24px;
  margin-bottom: 10px;
}

.page-title {
  text-align: center;
  font-size: 18px;
  margin-bottom: 20px;
}

.register-form-button {
  width: 100%;
  margin-bottom: 10px;
}

.login-link {
  text-align: center;
  margin-top: 10px;
}
</style>
  