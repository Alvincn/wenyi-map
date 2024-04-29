<script setup>
import {onMounted, onUnmounted, ref, reactive} from "vue";
import {ElLoading} from 'element-plus'
import AMapLoader from "@amap/amap-jsapi-loader";
import {getMapData} from "@/api/getData.js";
import {HERITAGE_TYPE} from "@/config/constant.js";
// 数据
let allData = ref([])
let originData = ref([])
let loading = ref(null)
let map = null;
const selectLayer = ref('all');
/**
 * 获取定位
 */
const getLocation = (AMap) => {
  return new Promise((resolve, reject) => {
    AMap.plugin('AMap.CitySearch', function () {
      var citySearch = new AMap.CitySearch()
      citySearch.getLocalCity(function (status, result) {
        if (status === 'complete' && result.info === 'OK') {
          // 查询成功，result即为当前所在城市信息
          resolve(result)
        }else {
          reject(null)
        }
      })
    })
  })
}
/**
 * 获取天气
 * @param value
 */
const getWeather = (AMap, location) => {
  return new Promise((resolve, reject) => {
    //加载天气查询插件
    AMap.plugin("AMap.Weather", function () {
      //创建天气查询实例
      var weather = new AMap.Weather();
      //执行实时天气信息查询
      weather.getLive(location.city, function (err, data) {
        if(err) reject(null)
        resolve(data)
      });
    });
  })

}
const valueChange = (value) => {
  if(value === 'all'){
    allData.value.features = JSON.parse(JSON.stringify(originData.value.features));
    drawMap()
    return;
  }
  let result = originData.value.features.filter(item => {
    return item.properties.CategoryEN === value;
  }) || [];
  allData.value.features = JSON.parse(JSON.stringify(result)) ;
  drawMap()
}
/**
 * 获取地图数据
 */
const reqGetMapData = async () => {
  openFullScreen()
  let result = await getMapData();
  allData.value = result;
  originData.value = JSON.parse(JSON.stringify(result));
  closeFullScreen()
}
const openFullScreen = () => {
  loading.value = ElLoading.service({
    lock: true,
    text: '数据量较大，首次加载需要几秒时间，请耐心等待~',
    background: 'rgba(0, 0, 0, 0.7)',
  })
}
const closeFullScreen = () => {
  loading.value && loading.value.close()
}
/**
 * 绘制地图
 */
const drawMap = async () => {
  window._AMapSecurityConfig = {
    securityJsCode: '8c8a8e15aa87f8c931541590319a8f6b',
  };
  AMapLoader.load({
    key: "78d0372338522f6807f299af862bc570",
    version: "2.0",
    plugins: [
      "AMap.Scale",
      "AMap.CitySearch",
      "AMap.HawkEye",
      "AMap.ToolBar",
    ],
    Loca: {
      "version": '2.0.0'
    },
  }).then(async (AMap) => {
    // 获取用户地址
    const location = await getLocation(AMap)
    const weather = await getWeather(AMap, location)
    if(weather !== null) sendMessage("weather", JSON.stringify(weather))
    if(location !== null) sendMessage("location", JSON.stringify(location))
    const center = location?.rectangle?.split(';')[1].split(',') || [116.397428, 39.90923]
    const layer = new AMap.createDefaultLayer({
      zooms: [10, 20],
      visible: true,
      opacity: 1,
      zIndex: 0,
    });
    // 创建地图
    const map = new AMap.Map("container", {
      mapStyle: "amap://styles/whitesmoke",
      zoom: 9,
      center: center,
      layer: layer,
    });
    // 预览图
    map.addControl(new AMap.HawkEye({ isOpen: false, position: "LB" }));
    // 地图控件
    map.addControl(new AMap.ToolBar({
      position: 'RB',
      offset: [20, 30]
    }));
    // 获取地图数据
    let markerList = []
    const labelsLayer = new AMap.LabelsLayer({
      zooms: [3, 20],
      zIndex: 1000,
      collision: true, //该层内标注是否避让
      allowCollision: true, //不同标注层之间是否避让
    });
    let newMap = new Map()
    allData.value.features.forEach((item, index) => {
      let stringText = item.properties.X + ' ' + item.properties.Y;
      if (newMap.get(stringText) === undefined) {
        newMap.set(stringText, 1)
      } else {
        return
      }
      const labelMarker = new AMap.LabelMarker({
        name: item.properties.Proj_num, //此属性非绘制文字内容，仅为标识使用
        position: item.geometry.coordinates,
        zIndex: 1000,
        rank: 1, //避让优先级
        icon: {
          type: "image", //图标类型，现阶段只支持 image 类型
          image: "https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png", //图片地址
          size: [20, 25], //图片尺寸
          anchor: "center", //图片相对 position 的锚点，默认为 bottom-center
        }, //标注图标，将 icon 对象传给 icon 属性
        text: {
          content: item.properties.Name_CN.trim() || '', //要展示的文字内容
          direction: "bottom", //文字方向，有 icon 时为围绕文字的方向，没有 icon 时，则为相对 position 的位置
          //文字样式
          style: {
            fontSize: 16, //字体大小
            fillColor: "#fff", //字体颜色
            strokeColor: "#fff", //字体边框颜色
            strokeWidth: 1, //字体边框宽度
          },
        }, //标注文本，将 text 对象传给 text 属性
        extData: {
          heritage: item.properties
        }
      });
      //信息窗体的内容
      var content = `
    <div style="width: 250px">
      <div style="font-weight: bold">${item.properties.Name_CN.trim()}</div>
      <div style="font-size: 1rem">省份：${item.properties.ProvinceCN.trim()}</div>
      <div style="font-size: 1rem">地址：${item.properties.Place_CN.trim()}</div>
    </div>
  `
      //创建 infoWindow 实例
      var infoWindow = new AMap.InfoWindow({
        content: content, //传入字符串拼接的 DOM 元素
        autoMove: false
      });
      labelMarker.on('touchstart', function (e) {
        labelMarker.setOpacity(0.5)
        infoWindow.open(map, labelMarker.getPosition());
      })
      labelMarker.on('touchend', function (e) {
        infoWindow.close();
        labelMarker.setOpacity(1)
      })
      labelMarker.on('touchmove', function (e) {
        infoWindow.close();
        labelMarker.setOpacity(1)
      })
      labelMarker.on('click', function (e) {
        let content = labelMarker.getExtData()
        labelMarker.setOpacity(0.5)
        setTimeout(() => {
          labelMarker.setOpacity(1)
        }, 50)
        sendMessage('clickHeritage',JSON.stringify(content))

      });
      markerList.push(labelMarker);
    })
    labelsLayer.add(markerList);
    map.add(labelsLayer);
  }).catch((e) => {
    console.log(e);
  });
}
onMounted(async () => {
  await reqGetMapData()
  drawMap()
});
onUnmounted(() => {
  map?.destroy();
});
// 发送消息
const sendMessage = (action, message) => {
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
    action,
    message
  }));
}
// 接收消息
const receiveMessage = (e) => {
  window.addEventListener("message", (e) => {
    console.log('Received message from React Native:', event.data);
  })
}
</script>

<template>
  <div v-loading.fullscreen.lock="loading" class="relative">
    <div id="container"></div>
    <div class="absolute top-10 z-10 right-2">
      <el-select
        v-model="selectLayer"
        placeholder="选择图层"
        style="width: 100px"
        popper-class="my-down"
        :append-to-body="false"
        @change="valueChange"
      >
        <el-option
          v-for="item in HERITAGE_TYPE"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          size="small"
          style="font-size: 1rem"
        />
      </el-select>
    </div>
  </div>
</template>


<style lang="less">

</style>
<style scoped lang="less">
#container {
  width: 100%;
  height: 100vh;
}
</style>