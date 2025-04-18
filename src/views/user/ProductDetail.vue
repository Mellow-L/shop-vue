<template>
  <div class="product-detail-container">
    <a-breadcrumb class="breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <a @click="$router.push('/?category=' + product.product_class)">{{ product.product_class }}</a>
      </a-breadcrumb-item>
      <a-breadcrumb-item>{{ product.product_name }}</a-breadcrumb-item>
    </a-breadcrumb>
    
    <a-row :gutter="32">
      <a-col :span="24" :md="12" :lg="10">
        <div class="product-image-container">
          <img :src="product.product_picture || 'https://placehold.co/600x600?text=No+Image'" :alt="product.product_name" class="product-image" />
        </div>
      </a-col>
      
      <a-col :span="24" :md="12" :lg="14">
        <div class="product-info">
          <h1 class="product-name">{{ product.product_name }}</h1>
          
          <div class="product-likes">
            <like-outlined /> {{ product.like_number || 0 }} 人赞过
          </div>
          
          <div class="product-price-container">
            <div class="product-price">
              <span class="price-label">价格</span>
              <span class="price-value">¥{{ product.product_price }}</span>
            </div>
            <div class="product-tags">
              <a-tag v-if="product.product_stock && product.product_stock > 0" color="green">有货</a-tag>
              <a-tag v-else color="red">无货</a-tag>
            </div>
          </div>
          
          <div class="product-specs">
            <div class="spec-item">
              <span class="spec-label">销量</span>
              <span class="spec-value">{{ product.sale_amount || 0 }}件</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">库存</span>
              <span class="spec-value">{{ product.product_stock === null ? 'N/A' : product.product_stock + '件' }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">商品编号</span>
              <span class="spec-value">{{ product.product_id }}</span>
            </div>
          </div>
          
          <a-divider />
          
          <div class="product-options">
            <div class="option-group">
              <div class="option-label">数量</div>
              <div class="option-values">
                <a-input-number 
                  v-model:value="quantity" 
                  :min="1" 
                  :max="product.product_stock"
                  :disabled="!product.product_stock || product.product_stock <= 0"
                />
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <a-button 
              type="primary" 
              size="large" 
              class="buy-now-btn"
              :disabled="!product.product_stock || product.product_stock <= 0"
              @click="buyNow"
            >
              立即购买
            </a-button>
            <a-button 
              size="large" 
              class="add-to-cart-btn"
              :disabled="!product.product_stock || product.product_stock <= 0"
              @click="addToCart"
            >
              加入购物车
            </a-button>
            <a-button 
              size="large" 
              class="like-btn"
              @click="toggleLike"
            >
              <like-outlined v-if="!isLiked" />
              <like-filled v-else style="color: #1890ff"/>
              {{ isLiked ? '已赞' : '点赞' }} ({{ product.like_number || 0 }})
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { LikeOutlined, LikeFilled } from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();

const product = reactive({
  product_id: 1,
  product_name: 'iPhone 15 Pro Max',
  product_class: '电子产品',
  product_price: 9999,
  like_number: 1588,
  product_stock: 50,
  sale_amount: 1200,
  product_picture: 'https://placehold.co/600x600?text=iPhone',
});

const quantity = ref(1);
const isLiked = ref(false);

onMounted(() => {
  const productId = route.params.id;
  console.log('Fetching product detail for ID:', productId);
});

const addToCart = () => {
  message.success(`已将 ${product.product_name} × ${quantity.value} 加入购物车`);
};

const buyNow = () => {
  message.success(`正在跳转到结算页面...`);
};

const toggleLike = () => {
  isLiked.value = !isLiked.value;
  if (isLiked.value) {
    product.like_number = (product.like_number || 0) + 1;
    message.success(`已点赞 ${product.product_name}`);
  } else {
    product.like_number = Math.max(0, (product.like_number || 0) - 1);
    message.success(`已取消点赞 ${product.product_name}`);
  }
};
</script>

<style scoped>
.product-detail-container {
  padding: 20px;
}

.breadcrumb {
  margin-bottom: 24px;
}

.product-image-container {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #f0f0f0;
  height: 400px;
}

.product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: none;
}

.product-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.product-likes {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #666;
}

.product-price-container {
  background-color: #f5f5f5;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.price-label {
  margin-right: 12px;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #f5222d;
  margin-right: 8px;
}

.product-tags {
  margin-top: 8px;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 16px 0;
}

.spec-item {
  display: flex;
  align-items: center;
}

.spec-label {
  color: #999;
  margin-right: 8px;
}

.option-group {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
}

.option-label {
  width: 60px;
  color: #666;
}

.option-values {
  flex: 1;
}

.product-actions {
  display: flex;
  gap: 16px;
  margin: 24px 0;
}

.buy-now-btn {
  background-color: #f5222d;
  border-color: #f5222d;
}

.buy-now-btn:hover {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .product-actions {
    flex-direction: column;
  }
}
</style>
  