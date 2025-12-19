/**
 * DÍA API Service
 * Smart API with offline fallback - works everywhere
 */

import axios from 'axios';
import { Platform } from 'react-native';

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOCAL_IP = '192.168.31.8';
const PORT = '5001';

// Public tunnel URL (works from anywhere - Cloudflare)
const TUNNEL_URL = 'https://cuts-miller-exterior-tobacco.trycloudflare.com';

// Try multiple URLs in order - tunnel first for mobile
const API_URLS = Platform.OS === 'web'
  ? [`http://localhost:${PORT}`, `http://${LOCAL_IP}:${PORT}`, TUNNEL_URL]
  : [TUNNEL_URL, `http://${LOCAL_IP}:${PORT}`, `http://localhost:${PORT}`];

let currentApiUrl = API_URLS[0];
let isOfflineMode = false;

// =============================================================================
// MOCK DATA (Offline Mode)
// =============================================================================

const MOCK_USER = {
  user_id: 'mock_user_001',
  username: 'demo_user',
  token: 'mock_token_' + Date.now()
};

const MOCK_PORTFOLIO = {
  total_value: 2450.75,
  invested_amount: 2200.00,
  last_24hr_change_percent: 3.45,
  invested_fund: {
    id: 'fund_002',
    name: 'Balanced Green Fund',
    sector: 'Mixed (Green + ICT)'
  }
};

const MOCK_FUNDS = [
  {
    fund_id: 'fund_001',
    name: 'Energy Transition Fund',
    ticker: 'XANF-ETF',
    description: 'Conservative renewable energy infrastructure fund',
    risk_level: 'Conservative',
    annual_return: 6.5,
    price: 124.56,
    sector: 'Green Energy',
    aum: '45.2M AZN'
  },
  {
    fund_id: 'fund_002',
    name: 'Balanced Green Fund',
    ticker: 'XANF-BGF',
    description: 'Diversified green energy and ICT portfolio',
    risk_level: 'Moderate',
    annual_return: 9.2,
    price: 187.34,
    sector: 'Mixed (Green + ICT)',
    aum: '128.7M AZN'
  },
  {
    fund_id: 'fund_003',
    name: 'ICT Innovation Fund',
    ticker: 'XANF-IIF',
    description: 'Aggressive tech and digital infrastructure growth',
    risk_level: 'Aggressive',
    annual_return: 14.8,
    price: 256.78,
    sector: 'ICT & Technology',
    aum: '89.4M AZN'
  }
];

// =============================================================================
// API CLIENT
// =============================================================================

const api = axios.create({
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor - auto switch to offline mode on failure
api.interceptors.response.use(
  (response) => {
    isOfflineMode = false;
    return response;
  },
  async (error) => {
    console.log('API Error:', error.message);

    // Try next URL if available
    const currentIndex = API_URLS.indexOf(currentApiUrl);
    if (currentIndex < API_URLS.length - 1) {
      currentApiUrl = API_URLS[currentIndex + 1];
      api.defaults.baseURL = currentApiUrl;
      console.log('Switching to:', currentApiUrl);
      return api.request(error.config);
    }

    // Switch to offline mode
    console.log('Switching to offline mode');
    isOfflineMode = true;
    return Promise.reject(error);
  }
);

// Set initial base URL
api.defaults.baseURL = currentApiUrl;

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// =============================================================================
// AUTH APIs
// =============================================================================

export const register = async (username, password, riskProfile) => {
  try {
    const response = await api.post('/api/register', {
      username,
      password,
      risk_profile: riskProfile,
    });
    return response.data;
  } catch (error) {
    // Offline mode - simulate registration
    console.log('Using offline registration');
    return {
      success: true,
      data: {
        user_id: 'user_' + Date.now(),
        token: 'token_' + Date.now()
      }
    };
  }
};

export const login = async (username, password) => {
  try {
    const response = await api.post('/api/login', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    // Offline mode - accept any credentials
    console.log('Using offline login');
    return {
      success: true,
      data: {
        user_id: MOCK_USER.user_id,
        token: MOCK_USER.token
      }
    };
  }
};

// =============================================================================
// PORTFOLIO API
// =============================================================================

export const getPortfolio = async (userId) => {
  try {
    const response = await api.get(`/api/user/${userId}/portfolio`);
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: { portfolio: MOCK_PORTFOLIO }
    };
  }
};

// =============================================================================
// FUNDS APIs
// =============================================================================

export const getFunds = async () => {
  try {
    const response = await api.get('/api/funds');
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: { funds: MOCK_FUNDS }
    };
  }
};

export const getRecommendedFund = async () => {
  try {
    const response = await api.get('/api/funds/recommend');
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: {
        fund: MOCK_FUNDS[1],
        reason: 'AI-powered recommendation based on your profile'
      }
    };
  }
};

// =============================================================================
// TRANSACTION APIs
// =============================================================================

export const processRoundup = async (transactionAmount, fundId) => {
  try {
    const response = await api.post('/api/transactions/roundup', {
      transaction_amount: transactionAmount,
      fund_id: fundId,
    });
    return response.data;
  } catch (error) {
    const roundup = Math.round((1 - (transactionAmount % 1)) * 100) / 100;
    return {
      success: true,
      data: {
        roundup_amount: roundup || 0.50,
        fund_id: fundId,
        message: `Invested ${roundup || 0.50} AZN via round-up (offline mode)`
      }
    };
  }
};

export const processDeposit = async (amount, fundId) => {
  try {
    const response = await api.post('/api/transactions/deposit', {
      amount: amount,
      fund_id: fundId,
    });
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: {
        amount: amount,
        fund_id: fundId,
        message: `Deposited ${amount} AZN (offline mode)`
      }
    };
  }
};

export const processWithdraw = async (amount) => {
  try {
    const response = await api.post('/api/transactions/withdraw', {
      amount: amount,
    });
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: {
        amount: amount,
        message: `Withdrawn ${amount} AZN (offline mode)`
      }
    };
  }
};

// =============================================================================
// LEADERBOARD API
// =============================================================================

export const getLeaderboard = async () => {
  try {
    const response = await api.get('/api/leaderboard');
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: {
        leaderboard: [
          { username: 'GreenInvestor', total_invested: 15420, returns: 12.5 },
          { username: 'EcoWarrior', total_invested: 12300, returns: 9.8 },
          { username: 'TechSaver', total_invested: 9870, returns: 15.2 },
          { username: 'demo_user', total_invested: 2200, returns: 3.45 },
          { username: 'NewInvestor', total_invested: 500, returns: 1.2 },
        ]
      }
    };
  }
};

// =============================================================================
// B2B STATUS API
// =============================================================================

export const getB2BStatus = async () => {
  try {
    const response = await api.get('/api/b2b-status');
    return response.data;
  } catch (error) {
    return {
      success: true,
      data: {
        partner_banks: ['Kapital Bank', 'PASHA Bank', 'ABB'],
        total_users: 1250,
        total_invested: 2450000
      }
    };
  }
};

// =============================================================================
// HEALTH CHECK
// =============================================================================

export const healthCheck = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    return {
      success: true,
      status: 'offline',
      mode: 'offline'
    };
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const isOnline = () => !isOfflineMode;
export const getCurrentApiUrl = () => currentApiUrl;

export default api;
