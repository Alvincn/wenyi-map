<script setup>
import { onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import {getMapData} from "@/api/getData.js";

let map = null;
onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: '8c8a8e15aa87f8c931541590319a8f6b',
  };
  AMapLoader.load({
    key: "78d0372338522f6807f299af862bc570",
    version: "2.0",
    plugins: ["AMap.Scale"],
    Loca: {
      "version": '2.0.0'
    },
  })
  .then(async (AMap) => {
    const layer = new AMap.createDefaultLayer({
      zooms: [10, 20],
      visible: true,
      opacity: 1,
      zIndex: 0,
    });

    // 创建地图
    const map = new AMap.Map("container", {
      mapStyle: "amap://styles/darkblue",
      zoom: 12,
      center: [116.397428, 39.90923],
      layer: layer,
    });

    // 获取地图数据
    let mapData = await getMapData();
    let markerList = []
    // 创建新的渲染函数，显示标记并附带地址名称
    mapData.features.forEach((item) => {
      const marker = new AMap.Marker({
        position: new AMap.LngLat(...item.geometry.coordinates),
        title: "北京",
        label: {
          content: item.properties.Name_CN,
          offset: new AMap.Pixel(0, 0), // 标题相对于Marker图标的偏移量
          direction: 'auto', // 文本方向
        },
        extData: {
          id: item.properties.Name_CN,
        },
      });
      marker.on("click", (e) => {
        console.log(e.getExtData())
        // const clickedMarker = e.target;
        // 通过Marker实例的extData属性获取附加的参数
        // const { id } = clickedMarker.extData;
      })
      markerList.push(marker);
    })
    map.add(markerList);


  })
  .catch((e) => {
    console.log(e);
  });
});
onUnmounted(() => {
  map?.destroy();
});
</script>

<template>
  <div id="container"></div>
</template>

<style scoped>
#container {
  width: 100%;
  height: 100vh;
}
</style>