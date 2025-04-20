import { message } from 'ant-design-vue';

export function showFail(apiName, msg) {
    console.error(`API调用失败 [${apiName}]:`, msg);
    message.error(msg, 3);
}

export function alertFail(apiName, msg) {
    console.error(`API错误 [${apiName}]:`, msg);
    message.error(msg, 3);
}

export function showSuccess(apiName, msg) {
    console.log(`API调用成功 [${apiName}]:`, msg);
    message.success(msg, 3);
}

export function alertSuccess(apiName, msg) {
    message.success(msg, {
        content: `API操作成功 [${apiName}]`,
        duration: 3
    });
} 