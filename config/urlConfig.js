// Backend Provider: 'lambda' | 'render'
// Switch this to change where your API calls go
const BACKEND_PROVIDER = 'lambda';

const BACKENDS = {
  render: {
    API_URL: 'https://pingoo-backend.onrender.com/api',
    SOCKET_URL: 'https://pingoo-backend.onrender.com',
  },
  lambda: {
    API_URL: 'https://lof3c8bpic.execute-api.ap-south-1.amazonaws.com/api',
    SOCKET_URL: 'https://pingoo-backend.onrender.com', // Socket always on Render
  },
  local: {
    API_URL: 'http://localhost:3000/api',
    SOCKET_URL: 'http://localhost:3000',
  },
};

export const API_URL = BACKENDS[BACKEND_PROVIDER].API_URL;
export const SOCKET_URL = BACKENDS[BACKEND_PROVIDER].SOCKET_URL;
export const CURRENT_BACKEND = BACKEND_PROVIDER;
