import axios from "axios";
import apiConfig from '../config/api';
import qs from "qs";

export const axiosClient = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT || 5000
});

export async function apiRegisterUser(formData) {
    let res =  axios.post('/api/user/register', qs.stringify(formData));
    if(res?.data){
        //let loginData = {username:formData.email, password:formData.password}
        //await apiLogin(loginData)
        console.log("注册成功",res.data);
        return Promise.resolve(res.data)
    }else{
        console.error("注册失败:");
    }
}

export async function apiLogin(formData) {
  try {
    const form = new FormData();
    form.append('email', formData.email);
    form.append('password', formData.password);
    form.append('isManager', formData.isManager); // 字符串或布尔都可
    const res = await axios.post('/api/user/login', form); // 不加 headers，axios 会自动设置 multipart/form-data
    if (res?.data) {
      return res.data;
    } else {
      throw new Error("登录失败：无响应数据");
    }
  } catch (error) {
    console.error("apiLogin 错误：", error);
    if (error.response) {
      console.error("后端响应:", error.response.data);
    }
    throw error;
  }
}
