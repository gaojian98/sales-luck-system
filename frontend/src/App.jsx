import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import LotteryWheel from './components/common/LotteryWheel';
import { chickenSoup } from './data/chickenSoup';
import bgImage from './a_digital_2d_illustration_features_a_mystical_fort.png';
import "./styles/cosmic-v42.css";
import bgSunny from './assets/energy/sunny.jpg';
import bgSunrise from './assets/energy/sunrise.jpg';
import bgSunset from './assets/energy/sunset.jpg';
import bgCliff from './assets/energy/cliff.jpg';
import bgFlower from './assets/energy/flower.jpg';
import bgSword from './assets/energy/sword.jpg';
import bgAxe from './assets/energy/axe.jpg';


/** 开发环境走 Vite 代理（见 vite.config.js），避免跨域；生产构建仍直连后端端口 */
const API = import.meta.env.DEV ? '/api' : 'http://127.0.0.1:3001/api';
/** 首屏可见：用于确认已加载当前前端构建（若看不到请重启 vite 并强制刷新浏览器） */
const APP_RELEASE_TAG = '信念系统版 UI · 2026-05-11';
const DEFAULT_RECHARGE_PACKAGES = [
  { id: 1, name: '7天能量重启包', amount: '9.9', energy_value: 12 },
  { id: 2, name: '21天信念重塑包', amount: '59.9', energy_value: 88 },
  { id: 3, name: '90天身份升级包', amount: '199', energy_value: 320 }
];
const DEFAULT_LIVE_QA_URL = 'https://www.tiktok.com/live';
const COURSE_SUBJECTS = ['销售学', '性格学', '沟通学', '客户关系管理', '成交策略'];

function generateRandomScore() {
  return Math.floor(Math.random() * 81) + 20;
}

function getChickenSoup(score) {
  if (!score) return '';

  let pool = chickenSoup.mid;

  if (score >= 80) {
    pool = chickenSoup.high;
  } else if (score >= 60) {
    pool = chickenSoup.midHigh;
  } else if (score < 40) {
    pool = chickenSoup.low;
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function getPlanOutcomeText(pkg, idx) {
  const text = String(pkg?.name || '');
  if (text.includes('7天') || idx === 0) return '快速止损内耗，重建行动节奏';
  if (text.includes('21天') || idx === 1) return '稳定自信系统，建立可持续改变';
  return '完成身份跃迁，从想改变到已改变';
}

function DashboardCornerCut({
  width,
  height,
  wheelDiameter,
  cardSize,
  offset = 10,
  radius = 24
}) {
  const cx = width / 2;
  const cy = height / 2;
  const r = wheelDiameter / 2;

  const maskId = `dashboard-corner-mask-${Math.round(width)}-${Math.round(height)}-${Math.round(wheelDiameter)}`;
  const glowId = `dashboard-corner-glow-${Math.round(width)}-${Math.round(height)}-${Math.round(wheelDiameter)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none'
      }}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width={width} height={height} fill="black" />

          <rect
            x={offset}
            y={offset}
            width={cardSize}
            height={cardSize}
            rx={radius}
            ry={radius}
            fill="white"
          />
          <rect
            x={width - offset - cardSize}
            y={offset}
            width={cardSize}
            height={cardSize}
            rx={radius}
            ry={radius}
            fill="white"
          />
          <rect
            x={offset}
            y={height - offset - cardSize}
            width={cardSize}
            height={cardSize}
            rx={radius}
            ry={radius}
            fill="white"
          />
          <rect
            x={width - offset - cardSize}
            y={height - offset - cardSize}
            width={cardSize}
            height={cardSize}
            rx={radius}
            ry={radius}
            fill="white"
          />

          <circle cx={cx} cy={cy} r={r} fill="black" />
        </mask>

        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="rgba(255,255,255,0)" />
          <stop offset="88%" stopColor="rgba(226,190,255,0.10)" />
          <stop offset="94%" stopColor="rgba(210,150,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="rgba(255,255,255,0.24)"
        mask={`url(#${maskId})`}
      />

      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="rgba(255,255,255,0.08)"
        mask={`url(#${maskId})`}
      />

      <circle
        cx={cx}
        cy={cy}
        r={r + 10}
        fill="none"
        stroke="rgba(236, 201, 255, 0.36)"
        strokeWidth="14"
      />

      <circle
        cx={cx}
        cy={cy}
        r={r + 2}
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="2"
      />

      <circle
        cx={cx}
        cy={cy}
        r={r + 18}
        fill={`url(#${glowId})`}
      />
    </svg>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('member_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('member_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);

  const dashboardRef = useRef(null);

  const [dashboardRect, setDashboardRect] = useState({
    width: 0,
    height: 0
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    account: '',
    password: '',
    contact: '',
    age: '',
    luckyNumber: '',
    luckyColor: '',
    wishType: '求财'
  });

  const [form, setForm] = useState({
    account: '',
    password: ''
  });

  const [checkedToday, setCheckedToday] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [spinRecords, setSpinRecords] = useState([]);
  const [rechargeRecords, setRechargeRecords] = useState([]);
  const [energyRecords, setEnergyRecords] = useState([]);
  const [rechargePackages, setRechargePackages] = useState(DEFAULT_RECHARGE_PACKAGES);
  const [showCourseCatalog, setShowCourseCatalog] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [liveQaUrl, setLiveQaUrl] = useState(DEFAULT_LIVE_QA_URL);
  const [shareInput, setShareInput] = useState('');
  const [sharePosts, setSharePosts] = useState(() => {
    const raw = localStorage.getItem('academy_share_posts');
    return raw ? JSON.parse(raw) : [];
  });
  const [shareProfiles, setShareProfiles] = useState(() => {
    const raw = localStorage.getItem('academy_share_profiles');
    return raw ? JSON.parse(raw) : {};
  });
  const [loading, setLoading] = useState(false);
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [wheelResult, setWheelResult] = useState(null);
  const [combo, setCombo] = useState(0);
  const [todaySpinCount, setTodaySpinCount] = useState(0);
  const [maxSpinCount] = useState(20);
  const [dailyScore, setDailyScore] = useState(null);
  const [todayPractice, setTodayPractice] = useState(null);
  const [mindsetMetrics, setMindsetMetrics] = useState(null);
const energyBgMap = {
  sunny: bgSunny,
  sunrise: bgSunrise,
  sunset: bgSunset,
  cliff: bgCliff,
  flower: bgFlower,
  sword: bgSword,
  axe: bgAxe
};
function getEnergyScene(score) {
  if (!score) return 'sunny';

  if (score >= 80) return 'sunny';
  if (score >= 65) return 'sunrise';
  if (score >= 50) return 'sword';
  if (score >= 40) return 'cliff';
  if (score >= 30) return 'axe';
  return 'sunset';
}

const currentEnergyScene = getEnergyScene(dailyScore);
const energyBgImage = energyBgMap[currentEnergyScene] || bgSunny;

  const [error, setError] = useState('');
  const [currentSpinId, setCurrentSpinId] = useState(0);
  const [pendingRewardSpinId, setPendingRewardSpinId] = useState(null);

  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function updateDashboardRect() {
      if (!dashboardRef.current) return;

      const rect = dashboardRef.current.getBoundingClientRect();
      setDashboardRect({
        width: rect.width,
        height: rect.height
      });
    }

    updateDashboardRect();
    window.addEventListener('resize', updateDashboardRect);

    const timer = setTimeout(updateDashboardRect, 50);

    return () => {
      window.removeEventListener('resize', updateDashboardRect);
      clearTimeout(timer);
    };
  }, [windowWidth]);

  function isTodayChecked() {
    const last = localStorage.getItem('last_check_date');
    const today = new Date().toISOString().slice(0, 10);
    return last === today;
  }

  async function fetchWallet(currentToken = token) {
    try {
      const res = await axios.get(`${API}/wallet`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (!res.data.success) {
        setError(res.data.message || '获取钱包失败');
        return;
      }

      setWallet(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || '获取钱包失败');
    }
  }

  async function fetchSpinRecords(currentToken = token) {
    if (!currentToken) return;

    try {
      const res = await axios.get(`${API}/lottery/records`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (!res.data.success) return;
      setSpinRecords(Array.isArray(res.data.data) ? res.data.data.slice(0, 5) : []);
    } catch (err) {
      setSpinRecords([]);
    }
  }

  async function fetchSharePosts(currentToken = token) {
    if (!currentToken) return;

    try {
      const res = await axios.get(`${API}/community/posts?limit=50`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (!res.data.success) return;
      const posts = Array.isArray(res.data.data)
        ? res.data.data.map((item) => ({
            id: item.id,
            account: item.username ? `share_${item.username}` : 'share_member',
            content: item.content,
            createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : '--'
          }))
        : [];
      setSharePosts(posts);
    } catch (err) {
      setSharePosts([]);
    }
  }

  async function fetchRechargePackages(currentToken = token) {
    if (!currentToken) return;

    try {
      const res = await axios.get(`${API}/recharge/packages`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (!res.data.success) return;
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) return;
      setRechargePackages(res.data.data);
    } catch (err) {
      setRechargePackages(DEFAULT_RECHARGE_PACKAGES);
    }
  }

  async function fetchRechargeRecords(currentToken = token) {
    if (!currentToken) return;

    try {
      const res = await axios.get(`${API}/recharge/records`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (!res.data.success) return;
      setRechargeRecords(Array.isArray(res.data.data) ? res.data.data.slice(0, 20) : []);
    } catch (err) {
      setRechargeRecords([]);
    }
  }

  async function fetchGrowthTrajectory(currentToken = token) {
    if (!currentToken) return;

    try {
      const res = await axios.get(`${API}/growth/trajectory`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (!res.data.success) return;
      const growth = res.data.data || {};
      setEnergyRecords(Array.isArray(growth.energy) ? growth.energy : []);
      setSpinRecords(Array.isArray(growth.tests) ? growth.tests : []);
      setRechargeRecords(Array.isArray(growth.recharges) ? growth.recharges : []);
    } catch (err) {
      setEnergyRecords([]);
    }
  }

  async function fetchPublicConfig() {
    try {
      const res = await axios.get(`${API}/public/config`);
      const nextLiveQaUrl = res?.data?.data?.liveQaUrl;
      if (typeof nextLiveQaUrl === 'string' && nextLiveQaUrl.trim()) {
        setLiveQaUrl(nextLiveQaUrl.trim());
      }
    } catch (err) {
      setLiveQaUrl(DEFAULT_LIVE_QA_URL);
    }
  }

  async function fetchMindsetToday(currentToken = token) {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API}/mindset/today`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return;
      setTodayPractice(res.data.data?.practice || null);
    } catch (err) {
      setTodayPractice(null);
    }
  }

  async function fetchMindsetMetrics(currentToken = token) {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API}/mindset/metrics?days=14`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return;
      setMindsetMetrics(res.data.data || null);
    } catch (err) {
      setMindsetMetrics(null);
    }
  }

  useEffect(() => {
    setCheckedToday(isTodayChecked());
  }, []);

  useEffect(() => {
    fetchPublicConfig();
  }, []);

  useEffect(() => {
    if (token) {
      fetchWallet(token);
      fetchSpinRecords(token);
      fetchRechargePackages(token);
      fetchRechargeRecords(token);
      fetchSharePosts(token);
      fetchGrowthTrajectory(token);
      fetchMindsetToday(token);
      fetchMindsetMetrics(token);
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('academy_share_profiles', JSON.stringify(shareProfiles));
  }, [shareProfiles]);

  async function handleLogin() {
    if (!form.account || !form.password) {
      alert('请输入账号和密码');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await axios.post(`${API}/auth/login`, {
        account: form.account,
        password: form.password
      });

      if (!res.data.success) {
        alert(res.data.message || '登录失败');
        return;
      }

      const nextToken = res.data.data.token;
      const nextUser = res.data.data.user;

      localStorage.setItem('member_token', nextToken);
      localStorage.setItem('member_user', JSON.stringify(nextUser));

      setToken(nextToken);
      setUser(nextUser);
      setShowLoginModal(false);
      ensureShareProfile(nextUser.username);

      await fetchWallet(nextToken);
      alert('登录成功 🚀');
    } catch (err) {
      alert(err?.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('member_token');
    localStorage.removeItem('member_user');
    setToken('');
    setUser(null);
    setWallet(null);
    setSpinResult(null);
    setWheelResult(null);
    setDailyScore(null);
    setCheckedToday(false);
    setError('');
    setSpinRecords([]);
    setEnergyRecords([]);
    setRechargeRecords([]);
    setRechargePackages(DEFAULT_RECHARGE_PACKAGES);
    setSharePosts([]);
    setTodayPractice(null);
    setMindsetMetrics(null);
  }

  async function handleRegisterSubmit() {
    if (
      !registerForm.name ||
      !registerForm.account ||
      !registerForm.password ||
      !registerForm.contact
    ) {
      alert('请先填写姓名、登录账号、登录密码、联系方式');
      return;
    }

    const contact = registerForm.contact.trim();
    const isEmail = contact.includes('@');

    try {
      setError('');
      const res = await axios.post(`${API}/auth/register`, {
        username: registerForm.account.trim(),
        password: registerForm.password,
        phone: isEmail ? null : contact,
        email: isEmail ? contact : null
      });

      if (!res.data.success) {
        alert(res.data.message || '注册失败');
        return;
      }

      alert('注册成功，请登录');
      ensureShareProfile(registerForm.account.trim());
      setForm({
        account: registerForm.account,
        password: registerForm.password
      });
      setShowRegisterModal(false);
      setShowLoginModal(true);

      setRegisterForm({
        name: '',
        account: '',
        password: '',
        contact: '',
        age: '',
        luckyNumber: '',
        luckyColor: '',
        wishType: '求财'
      });
    } catch (err) {
      alert(err?.response?.data?.message || '注册失败');
    }
  }

  async function handleSpin() {
    if (!token) {
      alert('请先登录');
      setShowLoginModal(true);
      return;
    }

    if (todaySpinCount >= maxSpinCount) {
      alert('今日抽奖次数已用完，请明天再来或先提升运势。');
      return;
    }

    const nextSpinId = currentSpinId + 1;
    setCurrentSpinId(nextSpinId);

    setSpinLoading(true);
    setShowRewardModal(false);
    setError('');

    try {
      const res = await axios.post(
        `${API}/lottery/spin`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.data.success) {
        alert(res.data.message || '抽奖失败');
        setSpinLoading(false);
        return;
      }

      const score = generateRandomScore();
      const spinData = res.data.data;

      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('last_check_date', today);
      setCheckedToday(true);

      setSpinResult(spinData);
      setDailyScore(score);
      setWallet((prev) => ({
        points_balance: spinData.pointsAfter,
        energy_balance: spinData.energyAfter,
        updated_at: prev?.updated_at
      }));

      setWheelResult({
        score,
        label: `${score}分`,
        spinId: nextSpinId
      });

      setCombo((prev) => prev + 1);
      setTodaySpinCount((prev) => prev + 1);

      setPendingRewardSpinId(nextSpinId);
      await fetchSpinRecords(token);
      await fetchRechargeRecords(token);
    } catch (err) {
      alert(err?.response?.data?.message || '抽奖失败');
      setSpinLoading(false);
    }
  }

  async function handleRecharge(packageId) {
    try {
      setError('');

      const res = await axios.post(
        `${API}/recharge/create`,
        { packageId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.data.success) {
        alert(res.data.message || '充值失败');
        return;
      }

      alert(
        `充值成功：${res.data.data.package.name}\n能量值：${res.data.data.energyBefore} → ${res.data.data.energyAfter}`
      );

      await fetchWallet(token);
      await fetchRechargeRecords(token);
      setShowRechargeModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || '充值失败');
    }
  }

  function startSpin() {
    handleSpin();
  }

  function ensureShareProfile(account) {
    if (!account) return;
    const key = account.trim();
    setShareProfiles((prev) => {
      if (prev[key]) return prev;
      return {
        ...prev,
        [key]: `share_${key}`
      };
    });
  }

  async function handleSharePost() {
    if (!token || !user?.username) {
      alert('请先登录后再发布分享');
      setShowLoginModal(true);
      return;
    }

    const content = shareInput.trim();
    if (!content) {
      alert('请输入分享内容');
      return;
    }

    try {
      const res = await axios.post(
        `${API}/community/posts`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.data.success) {
        alert(res.data.message || '发布失败');
        return;
      }

      await fetchSharePosts(token);
      setShareInput('');
    } catch (err) {
      alert(err?.response?.data?.message || '发布失败');
    }
  }

  function openLiveQA() {
    window.open(liveQaUrl, '_blank', 'noopener,noreferrer');
  }

  function openRechargeModal() {
    if (!token) {
      alert('请先登录');
      setShowLoginModal(true);
      return;
    }

    setShowRechargeModal(true);
  }

  function openGrowthModal() {
    if (!token) {
      alert('请先登录');
      setShowLoginModal(true);
      return;
    }
    fetchGrowthTrajectory(token);
    fetchMindsetMetrics(token);
    setShowGrowthModal(true);
  }

  async function completePracticeStep(step) {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    const textByStep = {
      affirmation: '我选择相信自己',
      action: '我完成了今天的最小行动',
      reflection: '我完成了今天的复盘'
    };
    try {
      const res = await axios.post(
        `${API}/mindset/practice/complete`,
        {
          step,
          text: textByStep[step] || ''
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '操作失败');
        return;
      }
      setTodayPractice(res.data.data?.practice || null);
      await fetchMindsetMetrics(token);
    } catch (err) {
      alert(err?.response?.data?.message || '操作失败');
    }
  }

  function handleWheelSpinEnd(spinId) {
    setSpinLoading(false);

    if (pendingRewardSpinId === spinId) {
      setShowRewardModal(true);
      setPendingRewardSpinId(null);
    }
  }

  const isLowScore = (dailyScore || 0) < 60;
  const isVeryLowScore = (dailyScore || 0) < 40;
  const affirmationDone = Number(todayPractice?.affirmation_done || 0) === 1;
  const actionDone = Number(todayPractice?.action_done || 0) === 1;
  const reflectionDone = Number(todayPractice?.reflection_done || 0) === 1;
  const currentStreakDays = Number(mindsetMetrics?.currentStreak || 0);

  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 480;

  const outerCorner = isMobile ? 18 : 24;
  const cornerSize = 240;
  const cornerOffset = 10;
  const wheelVisualSize = isMobile ? Math.min(windowWidth - 24, 340) : 720;
  const desktopPanelWidth = 216;
  const desktopEdgeOffset = 0;

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr',
    gap: 10,
    alignItems: 'stretch'
  };
  const displayedRechargePackages =
    rechargePackages.length > 0 ? rechargePackages.slice(0, 3) : DEFAULT_RECHARGE_PACKAGES;
  const energyCurveRows = energyRecords.slice(0, 20).map((record, idx) => ({
    id: record.id || idx,
    time: record.created_at ? new Date(record.created_at).toLocaleString() : '--',
    energy: `${record.change_amount > 0 ? '+' : ''}${record.change_amount}`,
    source: record.remark || record.source || record.type || '--'
  }));

  function formatRechargeAmount(amount) {
    const n = Number(amount);
    return Number.isFinite(n) ? n : amount;
  }
const centerWheelWrap = {
  position: isMobile ? 'relative' : 'absolute',
  top: isMobile ? 'auto' : '50%',
  left: isMobile ? 'auto' : '50%',
  transform: isMobile ? 'none' : 'translate(-50%, -50%)',
  zIndex: 1,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none',
  padding: isMobile ? '6px 0' : '0',
  boxSizing: 'border-box'
};
  
    

  const glassCard = {
    border: '1px solid rgba(255,255,255,0.28)',
    borderRadius: isMobile ? 14 : 18,
    padding: isMobile ? 12 : 16,
    background: 'rgba(255,255,255,0.22)',
    color: '#2f1b45',
    boxShadow: '0 10px 24px rgba(80, 42, 120, 0.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  };

  const primaryBtn = {
    padding: isMobile ? '8px 12px' : '8px 14px',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(191,137,255,0.96), rgba(123,44,191,0.92))',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: isMobile ? 13 : 14,
    boxShadow: '0 8px 20px rgba(123,44,191,0.20)'
  };

  const ghostBtn = {
    padding: isMobile ? '8px 12px' : '8px 14px',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.20)',
    color: '#4b2a67',
    cursor: 'pointer',
    fontSize: isMobile ? 13 : 14
  };

  const inputStyle = {
    padding: 10,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.32)',
    background: 'rgba(255,255,255,0.72)',
    color: '#2f1b45',
    outline: 'none'
  };

  const pageShell = {
    minHeight: '100vh',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: isMobile ? '40px 8px 8px 8px' : '44px 10px 10px 10px'
  };

  const pageFrame = {
    maxWidth: 1400,
    margin: '0 auto',
    padding: isMobile ? 8 : 12,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.26)',
    borderRadius: isMobile ? 18 : 24,
    boxShadow: '0 20px 60px rgba(80, 42, 120, 0.14)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  };

  const dashboardCard = {
  position: 'relative',
  height: isMobile ? 'auto' : 'calc(100vh - 24px)',
  minHeight: isMobile ? 'auto' : 820,
  maxHeight: isMobile ? 'none' : 980,
  border: '1px solid rgba(255,255,255,0.26)',
  borderRadius: isMobile ? 18 : 28,
  background: 'rgba(255,255,255,0.16)',
  boxShadow: '0 20px 60px rgba(80, 42, 120, 0.14)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  overflow: 'hidden',
  padding: isMobile ? 10 : 0
};
  const cornerCard = {
  ...glassCard,
  position: isMobile ? 'relative' : 'absolute',
  zIndex: 10,
  pointerEvents: 'auto',
  width: isMobile ? '100%' : 220,
  height: isMobile ? 'auto' : 220,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: outerCorner,
  padding: isMobile ? 12 : 12
};

  const titleCard = {
    ...cornerCard,
    top: 10,
    left: desktopEdgeOffset
  };

  const actionCard = {
    ...cornerCard,
    top: 10,
    right: desktopEdgeOffset
  };

  const walletCard = {
    ...cornerCard,
    left: desktopEdgeOffset,
    bottom: 10
  };

  const rechargeCard = {
    ...cornerCard,
    right: desktopEdgeOffset,
    bottom: 10
  };

  return (
    <div className="cosmic-ui">
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'linear-gradient(90deg, #3b0764, #6d28d9)',
          color: '#ede9fe',
          fontSize: 11,
          textAlign: 'center',
          padding: '5px 10px',
          letterSpacing: 0.3
        }}
      >
        {APP_RELEASE_TAG}
        <span style={{ opacity: 0.85 }}> · 首屏左上角「空中加油站」含晨间确认三步；充值区有套餐结果说明。无此行请强制刷新或重启 npm run dev</span>
      </div>
      <div className="star-layer"></div>
      <div className="cosmic-orbit-bg"></div>

      <div style={pageShell}>
        <div className="cosmic-layout" style={pageFrame}>
          <div ref={dashboardRef} style={dashboardCard}>
            {!isMobile && dashboardRect.width > 0 && dashboardRect.height > 0 && (
              <DashboardCornerCut
                width={dashboardRect.width}
                height={dashboardRect.height}
                wheelDiameter={wheelVisualSize}
                cardSize={cornerSize}
                offset={cornerOffset}
                radius={outerCorner}
              />
            )}

      {isMobile ? (
  <>
    <div style={mobileGrid}>
      <div className="glass-panel panel-top-left" style={{ ...titleCard, textAlign: 'left' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10
              }}
            >
              <div style={{ fontSize: 22, lineHeight: 1 }}>📡</div>
              <h2
                className="panel-title"
                style={{
                  margin: 0,
                  color: '#2f1b45',
                  fontSize: 20,
                  fontWeight: 'bold',
                  lineHeight: 1.2
                }}
              >
                空中加油站
              </h2>
            </div>

            <div
              className="panel-text"
              style={{
                color: 'rgba(47,27,69,0.78)',
                fontSize: 13,
                lineHeight: 1.7,
                paddingLeft: 2,
                textAlign: 'left'
              }}
            >
              <div style={{ marginBottom: 6, fontWeight: 'bold', color: '#7b2cbf' }}>
                连续行动天数：{currentStreakDays}
              </div>
              <button
                onClick={() => completePracticeStep('affirmation')}
                className="cosmic-btn"
                style={{ ...ghostBtn, width: '100%', marginBottom: 6, textAlign: 'left', fontSize: 12 }}
              >
                {affirmationDone ? '✅ 晨间确认已完成' : '⭕ 完成晨间确认'}
              </button>
              <button
                onClick={() => completePracticeStep('action')}
                className="cosmic-btn"
                style={{ ...ghostBtn, width: '100%', marginBottom: 6, textAlign: 'left', fontSize: 12 }}
              >
                {actionDone ? '✅ 今日行动已完成' : '⭕ 完成今日最小行动'}
              </button>
              <button
                onClick={() => completePracticeStep('reflection')}
                className="cosmic-btn"
                style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontSize: 12 }}
              >
                {reflectionDone ? '✅ 晚间复盘已完成' : '⭕ 完成晚间复盘'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="glass-panel panel-top-right"
        style={{
          ...actionCard,
          height: 'auto',
          minHeight: 0,
          padding: 12,
          width: isMobile ? '100%' : 240,
          lineHeight: 1.6,
          textAlign: 'right'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 12
          }}
        >
          <button
            onClick={() => setShowRegisterModal(true)}
            className="cosmic-btn"
            style={{
              ...primaryBtn,
              padding: '8px 10px',
              fontSize: 13
            }}
          >
            注册
          </button>

          <button
            onClick={() => setShowLoginModal(true)}
            className="cosmic-btn"
            style={{
              ...primaryBtn,
              padding: '8px 10px',
              fontSize: 13
            }}
          >
            登录
          </button>

          <button
            onClick={handleLogout}
            className="cosmic-btn"
            style={{
              ...ghostBtn,
              gridColumn: '1 / span 2'
            }}
          >
            退出
          </button>
        </div>

        <div
          className="user-info"
          style={{
            textAlign: 'right',
            color: '#4b2a67',
            fontSize: 13,
            lineHeight: 1.8
          }}
        >
          <div style={{ marginBottom: 8 }}>
            当前用户：
            <span className="status-highlight" style={{ fontWeight: 'bold', marginLeft: 6 }}>
              {user?.username || '未登录'}
            </span>
          </div>

          <div
            className="status-highlight"
            style={{
              marginBottom: 12,
              color: '#7b2cbf',
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            连续测试次数：{combo} / 连续行动：{currentStreakDays} 天
          </div>

          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 14,
              color: '#4b2a67'
            }}
          >
            <div>
              积分余额：
              <span style={{ fontWeight: 'bold', marginLeft: 6 }}>
                {wallet ? wallet.points_balance : '--'}
              </span>
            </div>

            <div>
              能量值余额：
              <span style={{ fontWeight: 'bold', marginLeft: 6 }}>
                {wallet ? wallet.energy_balance : '--'}
              </span>
            </div>

            <button
              onClick={openGrowthModal}
              className="cosmic-btn"
              style={{ ...primaryBtn, width: '100%', marginTop: 10 }}
            >
              成长轨迹
            </button>
          </div>
        </div>
      </div>
    </div>

    {error ? (
      <div
        style={{
          background: 'rgba(255, 77, 79, 0.14)',
          border: '1px solid rgba(255, 163, 158, 0.26)',
          color: '#a8071a',
          padding: '8px 12px',
          borderRadius: 10,
          fontSize: 12,
          marginTop: 10
        }}
      >
        {error}
      </div>
    ) : null}

    <div className="wheel-zone" style={centerWheelWrap}>
      <div className="wheel-wrapper" style={{ pointerEvents: 'auto' }}>
        <div className="wheel-inner-glow"></div>
        <div className="wheel-core">
          <LotteryWheel
            onSpin={handleSpin}
            spinning={spinLoading}
            result={wheelResult}
            onSpinEnd={handleWheelSpinEnd}
          />
        </div>
      </div>
    </div>

    <div style={mobileGrid}>
      <div
        className="glass-panel panel-bottom-left"
        style={{
          ...walletCard,
          width: 240,
          height: 'auto',
          minHeight: 0,
          padding: 14,
          textAlign: 'left'
        }}
      >
        <div>
          <h3
            className="panel-title"
            style={{
              marginTop: 0,
              marginBottom: 12,
              color: '#2f1b45',
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            飞轮学院
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <button
            onClick={() => setShowCourseCatalog((prev) => !prev)}
            className="cosmic-btn"
            style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
          >
            课程目录 {showCourseCatalog ? '▲' : '▼'}
          </button>
          {showCourseCatalog && (
            <div
              style={{
                background: 'rgba(255,255,255,0.30)',
                borderRadius: 12,
                padding: 10,
                border: '1px solid rgba(255,255,255,0.28)',
                fontSize: 12,
                color: '#4b2a67',
                textAlign: 'left',
                lineHeight: 1.7
              }}
            >
              {COURSE_SUBJECTS.map((subject) => (
                <div key={subject}>- {subject}</div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSharePanel((prev) => !prev)}
            className="cosmic-btn"
            style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
          >
            学习分享 {showSharePanel ? '▲' : '▼'}
          </button>
          {showSharePanel && (
            <div
              style={{
                background: 'rgba(255,255,255,0.30)',
                borderRadius: 12,
                padding: 10,
                border: '1px solid rgba(255,255,255,0.28)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: 12, color: '#4b2a67', marginBottom: 8 }}>
                我的分享账号：{user?.username ? (shareProfiles[user.username] || `share_${user.username}`) : '请先注册/登录'}
              </div>
              <textarea
                value={shareInput}
                onChange={(e) => setShareInput(e.target.value)}
                placeholder="自由言论，分享你的学习心得..."
                style={{ ...inputStyle, width: '100%', minHeight: 58, resize: 'vertical', marginBottom: 8 }}
              />
              <button onClick={handleSharePost} className="cosmic-btn" style={{ ...primaryBtn, width: '100%' }}>
                发布分享
              </button>
              <div style={{ marginTop: 8, maxHeight: 110, overflowY: 'auto' }}>
                {sharePosts.slice(0, 4).map((post) => (
                  <div key={post.id} style={{ fontSize: 12, color: '#4b2a67', marginBottom: 6 }}>
                    <strong>{post.account}</strong>：{post.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={openLiveQA}
            className="cosmic-btn"
            style={{ ...primaryBtn, width: '100%', textAlign: 'left' }}
          >
            在线答疑（进入 TikTok 直播）
          </button>
        </div>
      </div>

      <div className="glass-panel panel-bottom-right" style={{ ...rechargeCard, textAlign: 'right' }}>
        <div>
          <h3
            className="panel-title"
            style={{
              marginTop: 0,
              marginBottom: 12,
              color: '#2f1b45',
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'right'
            }}
          >
            快速充值
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'flex-end'
          }}
        >
          {displayedRechargePackages.map((pkg, idx) => (
            <div key={pkg.id} style={{ width: '100%' }}>
              <button
                onClick={openRechargeModal}
                className={`cosmic-btn${idx === 1 ? ' recharge-hot' : ''}`}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.22)',
                  fontWeight: 'bold',
                  fontSize: 13,
                  cursor: 'pointer',
                  background:
                    idx === 0
                      ? 'rgba(255,255,255,0.36)'
                      : idx === 1
                        ? 'linear-gradient(135deg, rgba(250,173,20,0.92), rgba(183,110,255,0.88))'
                        : 'linear-gradient(135deg, rgba(191,137,255,0.96), rgba(123,44,191,0.92))',
                  color: idx === 0 ? '#4b2a67' : '#fff',
                  boxShadow: idx === 1 ? '0 0 20px rgba(212, 175, 55, 0.18)' : undefined
                }}
              >
                {pkg.name} {formatRechargeAmount(pkg.amount)}
              </button>
              <div
                style={{
                  fontSize: 11,
                  color: idx === 0 ? '#6b4b8b' : 'rgba(255,255,255,0.90)',
                  width: '100%',
                  textAlign: 'right',
                  marginTop: 4
                }}
              >
                {getPlanOutcomeText(pkg, idx)}
              </div>
            </div>
          ))}

          <div
            className="panel-text"
            style={{
              marginTop: 2,
              fontSize: 11,
              lineHeight: 1.6,
              color: '#6b4b8b',
              textAlign: 'right'
            }}
          >
                      选择你的能量升级周期：7天重启 / 21天重塑 / 90天升级。
          </div>
        </div>
      </div>
    </div>
  </>
) : (
          
              <>
                <div
  className="glass-panel panel-top-left"
  style={{
    ...titleCard,
    width: desktopPanelWidth,
    height: 'auto',
    minHeight: 0,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 10,
    paddingRight: 18,
    textAlign: 'left'
  }}
>
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12
      }}
    >
      <div style={{ fontSize: 24, lineHeight: 1 }}>📡</div>
      <h2
        className="panel-title"
        style={{
          margin: 0,
          color: '#2f1b45',
          fontSize: 16,
          fontWeight: 'bold',
          lineHeight: 1.2
        }}
      >
        空中加油站
      </h2>
    </div>

    <div
      className="panel-text"
      style={{
        color: 'rgba(47,27,69,0.78)',
        fontSize: 14,
        lineHeight: 1.8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textAlign: 'left',
        alignItems: 'flex-start'
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 'bold', color: '#7b2cbf' }}>
        连续行动天数：{currentStreakDays}
      </div>

      <button
        onClick={() => completePracticeStep('affirmation')}
        className="cosmic-btn"
        style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
      >
        {affirmationDone ? '✅ 晨间确认已完成' : '⭕ 完成晨间确认'}
      </button>

      <button
        onClick={() => completePracticeStep('action')}
        className="cosmic-btn"
        style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
      >
        {actionDone ? '✅ 今日行动已完成' : '⭕ 完成今日最小行动'}
      </button>

      <button
        onClick={() => completePracticeStep('reflection')}
        className="cosmic-btn"
        style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
      >
        {reflectionDone ? '✅ 晚间复盘已完成' : '⭕ 完成晚间复盘'}
      </button>
    </div>
  </div>
</div>

<div
  className="glass-panel panel-bottom-left"
  style={{
    ...walletCard,
    width: desktopPanelWidth,
    height: 'auto',
    minHeight: 0,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 10,
    paddingRight: 18,
    textAlign: 'left'
  }}
>
  <div>
    <h3
      className="panel-title"
      style={{
        marginTop: 0,
        marginBottom: 12,
        color: '#2f1b45',
        fontSize: 16,
        fontWeight: 'bold'
      }}
    >
      飞轮学院
    </h3>
  </div>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-start'
    }}
  >
    <button
      onClick={() => setShowCourseCatalog((prev) => !prev)}
      className="cosmic-btn"
      style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
    >
      课程目录 {showCourseCatalog ? '▲' : '▼'}
    </button>
    {showCourseCatalog && (
      <div
        style={{
          background: 'rgba(255,255,255,0.26)',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.24)',
          fontSize: 13,
          lineHeight: 1.7,
          color: '#4b2a67',
          width: '100%',
          textAlign: 'left'
        }}
      >
        {COURSE_SUBJECTS.map((subject) => (
          <div key={subject}>- {subject}</div>
        ))}
      </div>
    )}

    <button
      onClick={() => setShowSharePanel((prev) => !prev)}
      className="cosmic-btn"
      style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
    >
      学习分享 {showSharePanel ? '▲' : '▼'}
    </button>
    {showSharePanel && (
      <div
        style={{
          background: 'rgba(255,255,255,0.26)',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.24)',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <div style={{ fontSize: 12, color: '#4b2a67', marginBottom: 8 }}>
          我的分享账号：{user?.username ? (shareProfiles[user.username] || `share_${user.username}`) : '请先注册/登录'}
        </div>
        <textarea
          value={shareInput}
          onChange={(e) => setShareInput(e.target.value)}
          placeholder="自由言论，分享你的学习心得..."
          style={{ ...inputStyle, width: '100%', minHeight: 62, resize: 'vertical', marginBottom: 8 }}
        />
        <button onClick={handleSharePost} className="cosmic-btn" style={{ ...primaryBtn, width: '100%' }}>
          发布分享
        </button>
        <div style={{ marginTop: 8, maxHeight: 120, overflowY: 'auto' }}>
          {sharePosts.slice(0, 4).map((post) => (
            <div key={post.id} style={{ fontSize: 12, color: '#4b2a67', marginBottom: 6 }}>
              <strong>{post.account}</strong>：{post.content}
            </div>
          ))}
        </div>
      </div>
    )}

    <button
      onClick={openLiveQA}
      className="cosmic-btn"
      style={{ ...primaryBtn, width: '100%', textAlign: 'left' }}
    >
      在线答疑（进入 TikTok 直播）
    </button>
  </div>
</div>  

  <div
  className="glass-panel panel-top-right"
  style={{
    ...actionCard,
    height: 'auto',
    minHeight: 0,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 18,
    paddingRight: 10,
    width: isMobile ? '100%' : desktopPanelWidth,
    lineHeight: 1.6
  }}
>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginBottom: 12
    }}
  >
    <button
      onClick={() => setShowRegisterModal(true)}
      className="cosmic-btn"
      style={{
        ...primaryBtn,
        padding: '8px 10px',
        fontSize: 13
      }}
    >
      注册
    </button>

    <button
      onClick={() => setShowLoginModal(true)}
      className="cosmic-btn"
      style={{
        ...primaryBtn,
        padding: '8px 10px',
        fontSize: 13
      }}
    >
      登录
    </button>
  </div>

  <div
    className="user-info"
    style={{
      textAlign: 'right',
      color: '#4b2a67',
      fontSize: 13,
      lineHeight: 1.8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}
  >
    <div style={{ marginBottom: 8 }}>
      当前用户：
      <span className="status-highlight" style={{ fontWeight: 'bold', marginLeft: 6 }}>
        {user?.username || '未登录'}
      </span>
    </div>

    <div
      className="status-highlight"
      style={{
        marginBottom: 12,
        color: '#7b2cbf',
        fontWeight: 'bold',
        fontSize: 14
      }}
    >
      连续测试次数：{combo} / 连续行动：{currentStreakDays} 天
    </div>

    <div
  style={{
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    color: '#4b2a67',
    alignItems: 'flex-end'
  }}
>
  <div>
    积分余额：
    <span style={{ fontWeight: 'bold', marginLeft: 6 }}>
      {wallet ? wallet.points_balance : '--'}
    </span>
  </div>

  <div>
    能量值余额：
    <span style={{ fontWeight: 'bold', marginLeft: 6 }}>
      {wallet ? wallet.energy_balance : '--'}
    </span>
  </div>

  <button
    onClick={openGrowthModal}
    className="cosmic-btn"
    style={{ ...primaryBtn, width: '100%', marginTop: 10 }}
  >
    成长轨迹
  </button>
</div>                
</div>
</div>

                <div className="glass-panel panel-bottom-right" style={{ ...rechargeCard, textAlign: 'right' }}>
                  <div>
                    <h3
                      className="panel-title"
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        color: '#2f1b45',
                        fontSize: 18,
                        fontWeight: 'bold',
                        textAlign: 'right'
                      }}
                    >
                      快速充值
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      flex: 1,
                      alignItems: 'flex-end'
                    }}
                  >
                    {displayedRechargePackages.map((pkg, idx) => (
                      <div key={pkg.id} style={{ width: '100%' }}>
                        <button
                          onClick={openRechargeModal}
                          className={`cosmic-btn${idx === 1 ? ' recharge-hot' : ''}`}
                          style={{
                            width: '100%',
                            padding: '13px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.22)',
                            fontWeight: 'bold',
                            fontSize: 14,
                            cursor: 'pointer',
                            background:
                              idx === 0
                                ? 'rgba(255,255,255,0.36)'
                                : idx === 1
                                  ? 'linear-gradient(135deg, rgba(250,173,20,0.92), rgba(183,110,255,0.88))'
                                  : 'linear-gradient(135deg, rgba(191,137,255,0.96), rgba(123,44,191,0.92))',
                            color: idx === 0 ? '#4b2a67' : '#fff',
                            boxShadow: idx === 1 ? '0 0 20px rgba(212, 175, 55, 0.18)' : undefined
                          }}
                        >
                          {pkg.name} {formatRechargeAmount(pkg.amount)}
                        </button>
                        <div
                          style={{
                            fontSize: 12,
                            color: idx === 0 ? '#6b4b8b' : 'rgba(255,255,255,0.90)',
                            width: '100%',
                            textAlign: 'right',
                            marginTop: 4
                          }}
                        >
                          {getPlanOutcomeText(pkg, idx)}
                        </div>
                      </div>
                    ))}

                    <div
                      className="panel-text"
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: '#6b4b8b',
                        textAlign: 'right'
                      }}
                    >
                      选择你的能量升级周期：7天重启 / 21天重塑 / 90天升级。
                    </div>
                  </div>
                </div>



                {error ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: 126,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 5,
                      background: 'rgba(255, 77, 79, 0.14)',
                      border: '1px solid rgba(255, 163, 158, 0.26)',
                      color: '#a8071a',
                      padding: '8px 14px',
                      borderRadius: 10,
                      fontSize: 13
                    }}
                  >
                    {error}
                  </div>
                
                ) : null}

                <div className="wheel-zone" style={centerWheelWrap}>
                  <div className="wheel-wrapper" style={{ pointerEvents: 'auto' }}>
                    <div className="wheel-inner-glow"></div>
                    <div className="wheel-core">
                      <LotteryWheel
                        onSpin={handleSpin}
                        spinning={spinLoading}
                        result={wheelResult}
                        onSpinEnd={handleWheelSpinEnd}
                      />
                    </div>
                  </div>
                </div>
                
              </>
            )}
        


          {showLoginModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999
              }}
              onClick={() => setShowLoginModal(false)}
            >
              <div
                className="glass-panel"
                style={{
                  width: 420,
                  maxWidth: '92vw',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,236,255,0.82))',
                  color: '#2f1b45',
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 20px 50px rgba(80,42,120,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="panel-title" style={{ marginTop: 0 }}>登录</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    placeholder="用户名 / 手机 / 邮箱"
                    value={form.account}
                    onChange={(e) => setForm({ ...form, account: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="密码"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                    marginTop: 20
                  }}
                >
                  <button onClick={() => setShowLoginModal(false)} className="cosmic-btn" style={ghostBtn}>
                    取消
                  </button>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="cosmic-btn"
                    style={primaryBtn}
                  >
                    {loading ? '登录中...' : '确认登录'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRegisterModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999
              }}
              onClick={() => setShowRegisterModal(false)}
            >
              <div
                className="glass-panel"
                style={{
                  width: 460,
                  maxWidth: '92vw',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,236,255,0.82))',
                  color: '#2f1b45',
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 20px 50px rgba(80,42,120,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="panel-title" style={{ marginTop: 0 }}>注册</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    placeholder="姓名"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="登录账号"
                    value={registerForm.account}
                    onChange={(e) => setRegisterForm({ ...registerForm, account: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="登录密码"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="联系方式"
                    value={registerForm.contact}
                    onChange={(e) => setRegisterForm({ ...registerForm, contact: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="年龄"
                    value={registerForm.age}
                    onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="幸运数字"
                    value={registerForm.luckyNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, luckyNumber: e.target.value })}
                    style={inputStyle}
                  />

                  <input
                    placeholder="幸运色"
                    value={registerForm.luckyColor}
                    onChange={(e) => setRegisterForm({ ...registerForm, luckyColor: e.target.value })}
                    style={inputStyle}
                  />

                  <select
                    value={registerForm.wishType}
                    onChange={(e) => setRegisterForm({ ...registerForm, wishType: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="求财">求财</option>
                    <option value="求爱情">求爱情</option>
                    <option value="求健康">求健康</option>
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                    marginTop: 20
                  }}
                >
                  <button onClick={() => setShowRegisterModal(false)} className="cosmic-btn" style={ghostBtn}>
                    取消
                  </button>

                  <button onClick={handleRegisterSubmit} className="cosmic-btn" style={primaryBtn}>
                    提交注册
                  </button>
                </div>
              </div>
            </div>
          )}


          {showRewardModal && spinResult && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999
    }}
    onClick={() => setShowRewardModal(false)}
  >
    <div
      style={{
  width: 420,
  maxWidth: '92vw',
  color: '#2f1b45',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 24px 60px rgba(80,42,120,0.18)',
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.38)',

  // ✅ 关键：使用背景图
  backgroundImage: `url(${energyBgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}}
      onClick={(e) => e.stopPropagation()}
    >
      <p
        className="panel-text"
        style={{
          color: 'rgba(47,27,69,0.70)',
          marginTop: 0,
          marginBottom: 12
        }}
      >
        今日状态值
      </p>

      <div
        className="big-number"
        style={{
          fontSize: 36,
          fontWeight: 'bold',
          color: '#7b2cbf',
          marginBottom: 10,
          textShadow: '0 0 18px rgba(215,130,255,0.20)'
        }}
      >
        {dailyScore ?? 20} 分
      </div>

      <p
        className="panel-text"
        style={{
          color: 'rgba(47,27,69,0.70)',
          marginTop: 0,
          marginBottom: 16
        }}
      >
        当前行动能量评估
      </p>

      {combo >= 3 && (
        <div
          style={{
            background: 'rgba(255,229,143,0.16)',
            border: '1px solid rgba(255,229,143,0.24)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            color: '#9c6500',
            fontWeight: 'bold'
          }}
        >
          连续检测已进入强化状态，再冲一次更容易出高分。
        </div>
      )}

      <div
        style={{
          background: 'rgba(255,255,255,0.45)',
          padding: 14,
          borderRadius: 12,
          marginBottom: 16,
          fontStyle: 'italic',
          color: '#4b2a67',
          lineHeight: 1.7
        }}
      >
        💬 {getChickenSoup(dailyScore)}
      </div>

      {(dailyScore || 0) < 60 ? (
        <>
          <p
            style={{
              color: '#cf1322',
              fontWeight: 'bold',
              marginBottom: 12
            }}
          >
            ⚠️ 当前状态偏低，建议先补充能量再行动
          </p>

          <div
            style={{
              background: 'rgba(255,229,143,0.16)',
              border: '1px solid rgba(255,229,143,0.24)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: '#9c6500',
              lineHeight: 1.7
            }}
          >
            当前状态值较低，先补充能量后再检测，更适合冲击高状态表现。
          </div>

          {isLowScore && (
            <div
              style={{
                background: isVeryLowScore ? 'rgba(255,77,79,0.12)' : 'rgba(255,229,143,0.16)',
                border: isVeryLowScore
                  ? '1px solid rgba(255,163,158,0.22)'
                  : '1px solid rgba(255,229,143,0.24)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                textAlign: 'left'
              }}
            >
              <p
                style={{
                  margin: '0 0 8px 0',
                  color: isVeryLowScore ? '#cf1322' : '#9c6500',
                  fontWeight: 'bold'
                }}
              >
                {isVeryLowScore
                  ? '⚠️ 当前状态偏低，建议优先补能量'
                  : '⚡ 当前状态一般，补能量后更适合继续检测'}
              </p>

              <p
                style={{
                  margin: 0,
                  color: isVeryLowScore ? '#a8071a' : '#9c6500',
                  lineHeight: 1.7
                }}
              >
                推荐先使用“21天信念重塑包”，再继续检测，更容易冲击高状态结果。
              </p>
            </div>
          )}
        </>
      ) : (
        <p
          style={{
            color: '#389e0d',
            fontWeight: 'bold',
            marginBottom: 16
          }}
        >
          🔥 当前状态极佳，适合冲刺更高目标
        </p>
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        {isLowScore ? (
          <>
            <button
              className="primary-btn"
              onClick={() => {
                setShowRewardModal(false);
                setShowRechargeModal(true);
              }}
            >
              🔥 继续加持
            </button>

            <button
              className="ghost-btn"
              onClick={() => setShowRewardModal(false)}
            >
              休息片刻
            </button>
          </>
        ) : (
          <>
            <button
              className="primary-btn"
              onClick={() => {
                setShowRewardModal(false);
                startSpin();
              }}
            >
              🔥 继续加持
            </button>

            <button
              className="ghost-btn"
              onClick={() => setShowRewardModal(false)}
            >
              休息片刻
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}

          {showGrowthModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999
              }}
              onClick={() => setShowGrowthModal(false)}
            >
              <div
                className="glass-panel"
                style={{
                  width: 860,
                  maxWidth: '96vw',
                  maxHeight: '88vh',
                  overflowY: 'auto',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,236,255,0.88))',
                  color: '#2f1b45',
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 20px 50px rgba(80,42,120,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="panel-title" style={{ marginTop: 0, marginBottom: 16 }}>成长轨迹</h2>
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid rgba(123,44,191,0.16)',
                    background: 'rgba(255,255,255,0.45)',
                    color: '#4b2a67',
                    fontSize: 13,
                    lineHeight: 1.8
                  }}
                >
                  <div>连续行动天数：<strong>{currentStreakDays}</strong></div>
                  <div>自我确认指数：<strong>{mindsetMetrics?.latest?.self_confirmation_score ?? '--'}</strong></div>
                  <div>行动稳定指数：<strong>{mindsetMetrics?.latest?.action_consistency_index ?? '--'}</strong></div>
                  <div>恐惧干扰指数：<strong>{mindsetMetrics?.latest?.fear_interference_index ?? '--'}</strong></div>
                </div>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>能量曲线条</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>时间</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>能量变化</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {energyCurveRows.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无数据</td></tr>
                    ) : energyCurveRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '6px 4px' }}>{row.time}</td>
                        <td style={{ padding: '6px 4px' }}>{row.energy}</td>
                        <td style={{ padding: '6px 4px' }}>{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>测试记录</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>时间</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>结果</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>积分变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spinRecords.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无数据</td></tr>
                    ) : spinRecords.slice(0, 20).map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 4px' }}>{item.created_at ? new Date(item.created_at).toLocaleString() : '--'}</td>
                        <td style={{ padding: '6px 4px' }}>
                          {item.reward_type === 'points' ? `积分 +${item.reward_value}` : item.reward_type === 'retry' ? '再来一次' : '未中奖'}
                        </td>
                        <td style={{ padding: '6px 4px' }}>{item.points_before} → {item.points_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>充值记录</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>时间</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>充值包</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>金额</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>能量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechargeRecords.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无数据</td></tr>
                    ) : rechargeRecords.slice(0, 20).map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 4px' }}>{item.created_at ? new Date(item.created_at).toLocaleString() : '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{item.package_name || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{item.pay_amount}</td>
                        <td style={{ padding: '6px 4px' }}>+{item.energy_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => setShowGrowthModal(false)} className="cosmic-btn" style={ghostBtn}>
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRechargeModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999
              }}
              onClick={() => setShowRechargeModal(false)}
            >
              <div
                className="glass-panel"
                style={{
                  width: 420,
                  maxWidth: '92vw',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,236,255,0.82))',
                  color: '#2f1b45',
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 20px 50px rgba(80,42,120,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="panel-title" style={{ marginTop: 0 }}>快速补能量</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {displayedRechargePackages.map((pkg, idx) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleRecharge(pkg.id)}
                      className={`cosmic-btn${idx === 1 ? ' recharge-hot' : ''}`}
                      style={primaryBtn}
                    >
                      {pkg.name} {formatRechargeAmount(pkg.amount)}（+{pkg.energy_value} 能量）
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                    marginTop: 20
                  }}
                >
                  <button onClick={() => setShowRechargeModal(false)} className="cosmic-btn" style={ghostBtn}>
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}