import axios from "axios";
import request from "@/utils/request.js";

export const getMapData = () => {
  return request.get('/IhChina_2006-2021.json')
}