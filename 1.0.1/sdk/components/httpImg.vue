<template>
  <div class="smart-image-wrapper" :style="wrapperStyle">
    <picture v-show="!loading && !error">
      <source :srcset="getImageUrl('avif')" type="image/avif" />
      <source :srcset="getImageUrl('webp')" type="image/webp" />
      <source :srcset="getImageUrl('jpg')" type="image/jpeg" />
      <img
        :src="getImageUrl('png')"
        :alt="alt"
        loading="lazy"
        @load="onLoad"
        @error="onError"
        class="smart-image"
        :style="imageStyle"
        ref="imgRef"
      />
    </picture>
    <div v-if="loading" class="smart-image-loading smart-image-placeholder">
      <slot name="loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
      </slot>
    </div>
    <div v-if="error" class="smart-image-error smart-image-placeholder">
      <slot name="error">
        <div class="error-placeholder">
          <span class="error-icon">!</span>
          <span>加载失败</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"

const props = defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down"
}>()

const loading = ref(true)
const error = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

// 计算样式
const wrapperStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}))

const imageStyle = computed(() => ({
  width: "100%",
  height: "100%",
  objectFit: props.objectFit || "cover",
}))

// 缓存正则表达式
const URL_REGEX = /^(https?:)?\/\//

// 获取图片URL
function getImageUrl(format: string): string {
  if (!props.src) return ""

  // 如果是完整的URL，直接添加格式后缀
  if (props.src.match(URL_REGEX)) {
    const urlObj = new URL(props.src)
    const pathParts = urlObj.pathname.split(".")
    // 如果URL已经包含后缀，则返回原URL
    if (pathParts.length > 1) {
      return props.src
    }
    // 否则添加格式后缀
    urlObj.pathname = `${pathParts[0]}.${format}`
    return urlObj.toString()
  }

  // 如果不是完整URL，返回原始src
  return props.src
}

function onLoad() {
  loading.value = false
  error.value = false
}

function onError() {
  loading.value = false
  error.value = true
}

onMounted(() => {
  if (imgRef.value?.complete) {
    loading.value = false
    error.value = imgRef.value.naturalWidth === 0
  }
})
</script>

<style scoped>
.smart-image-wrapper {
  position: relative;
  overflow: hidden;
}

.smart-image {
  display: block;
}

.smart-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  position: relative;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 8px;
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
