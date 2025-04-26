<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">
      <h1 class="system-title">在线购物系统</h1>
      <h2 class="page-title">用户登录</h2>
      <a-form
        :model="formState"
        name="loginForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        autocomplete="off"
        @finish="onLogin"
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
          :rules="[{ required: true, message: '请输入密码!' }]"
        >
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
          <div class="login-options">
            <a-checkbox v-model:checked="formState.remember">记住密码</a-checkbox>
            <a-checkbox v-model:checked="formState.isManager">我是管理员</a-checkbox>
          </div>
          <a class="login-form-forgot" href="">忘记密码</a>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
          <a-button type="primary" html-type="submit" class="login-form-button">登录</a-button>
          或 <router-link to="/register">立即注册!</router-link>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { apiLogin } from '../../api/user';

const router = useRouter();
const rememberMeKey = 'rememberedEmail';

const formState = reactive({
  email: '',
  password: '',
  remember: true,
  isManager: false,
});

onMounted(() => {
    const rememberedEmail = localStorage.getItem(rememberMeKey);
    if (rememberedEmail) {
        formState.email = rememberedEmail;
        formState.remember = true;
        console.log('Remembered email loaded:', rememberedEmail);
    }
});

const onLogin = async () => { 
    const loginPayload = {
      email: formState.email,
      password: formState.password,
      isManager: formState.isManager, 
    };

    try {
        const res = await apiLogin(loginPayload); 

        if (res && res.code === 200 && res.user) {
            if (formState.remember) {
                localStorage.setItem(rememberMeKey, formState.email);
                console.log('Email remembered:', formState.email);
            } else {
                localStorage.removeItem(rememberMeKey);
                console.log('Remembered email cleared.');
            }

            try {
                localStorage.setItem('userInfo', JSON.stringify(res.user));
                localStorage.setItem('isLoggedIn', 'true'); 
                localStorage.setItem('isManager', loginPayload.isManager ? 'true' : 'false');
                console.log('Login successful, userInfo saved:', res.user);

                if (loginPayload.isManager) {
                    router.push('/admin/products');
                } else {
                    router.push('/');
                }
            } catch (storageError) {
                console.error("Failed to save user info to localStorage:", storageError);
                message.error('无法保存登录状态，请稍后重试'); 
            }
        } else {
            console.log("Login API call returned non-200 or missing user data:", res);
        }
    } catch (error) {
        console.error("Error during login process (network or other):", error);
    }
};

</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
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

.login-options {
  display: flex;
  gap: 20px;
}

.login-form-forgot {
  float: right;
}

.login-form-button {
  width: 100%;
  margin-bottom: 10px;
}
</style>
  