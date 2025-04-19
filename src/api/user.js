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
        console.error("注册失败:", error);
    }
}
export async function apiLogin(formData) {
    let res =  axios.post('/api/user/login', formData);
    if(res?.data){
        return Promise.resolve(res.data)
    }else{
        alertFail(apiLogin.name,"Fail to login")
    }
}
