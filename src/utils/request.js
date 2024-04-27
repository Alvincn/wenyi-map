import axios from 'axios'
const request = axios.create({
    baseURL: '/server',
    timeout: 50000
})
request.interceptors.response.use(response => {
    return response.data;
})
export default request;