
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 引入ElementUI样式文件
import 'element-plus/dist/index.css'
// 引入tailwindcss
import "@/assets/style/tailwind.css"
const app = createApp(App)

app.use(router)

app.mount('#app')
