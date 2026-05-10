import { useEffect, useMemo, useRef, useState } from 'react';
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
const APP_RELEASE_TAG = '信念系统版 UI · 2026-05-12 · 经济参数可配置';
const DEFAULT_RECHARGE_PACKAGES = [
  { id: 1, name: '7天能量重启包', amount: '9.9', energy_value: 12 },
  { id: 2, name: '21天信念重塑包', amount: '59.9', energy_value: 88 },
  { id: 3, name: '90天身份升级包', amount: '199', energy_value: 320 }
];
const DEFAULT_LIVE_QA_URL = 'https://www.tiktok.com/live';
const DEFAULT_PAY_BIND_CHANNELS = [
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'bank_card', label: '银行卡' },
  { value: 'cold_wallet', label: '冷钱包' }
];
const COURSE_SUBJECTS = ['销售学', '性格学', '沟通学', '客户关系管理', '成交策略'];

function payChannelLabel(code, options) {
  const list = options && options.length > 0 ? options : DEFAULT_PAY_BIND_CHANNELS;
  const row = list.find((x) => String(x.value) === String(code));
  return row?.label || code || '--';
}

/** 空中加油站三步：弹窗文案与引导 */
const PRACTICE_STEP_UI = {
  affirmation: {
    title: '晨间确认',
    placeholder: '例：今天我选择相信自己的能力，先把一件事做到底。',
    hint: '用一句话定下今天的自我立场，不必长。'
  },
  action: {
    title: '今日最小行动',
    placeholder: '例：给一位客户发了跟进消息 / 整理了明天要用的清单。',
    hint: '写下你今天真正完成的一件小事即可。'
  },
  reflection: {
    title: '晚间复盘',
    placeholder: '例：今天最有收获的是…… 明天可以微调的一点：……',
    hint: '一两句收尾，帮大脑「闭合」今天。'
  }
};

/** 与后端 identity 等级门槛一致（mindset.service getIdentityProfile） */
const IDENTITY_LEVEL_TIERS = [
  { level: 1, name: '萌芽者', minScore: 0, standard: '起步：完成每日三步与最小行动，先让能量与打卡节奏跑起来。' },
  { level: 2, name: '觉醒者', minScore: 80, standard: '觉察：自我确认提升、恐惧干扰下降，开始稳定留痕成长证据。' },
  { level: 3, name: '践行者', minScore: 140, standard: '执行：行动稳定指数与证据数量明显上升，可拆解更大周目标。' },
  { level: 4, name: '进化者', minScore: 200, standard: '跃迁：多维指标均衡，适合挑战高难任务并复盘沉淀方法。' },
  { level: 5, name: '引领者', minScore: 280, standard: '引领：身份分维持高位，以示范行为带动团队或客户信任。' }
];

/** 成长轨迹弹窗内：能量余额折线（按时间正序） */
function EnergyBalanceChart({ series }) {
  const vbW = 640;
  const vbH = 172;
  const padL = 40;
  const padR = 16;
  const padT = 20;
  const padB = 36;
  const innerW = vbW - padL - padR;
  const innerH = vbH - padT - padB;

  if (!series || series.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: 'center',
          fontSize: 13,
          color: '#6b4b8b',
          background: 'rgba(255,255,255,0.5)',
          borderRadius: 12,
          border: '1px dashed rgba(123,44,191,0.25)'
        }}
      >
        暂无能量流水，完成充值、抽奖或任务后将在此绘制能量曲线。
      </div>
    );
  }

  const balances = series.map((s) => s.balance);
  const minB = Math.min(...balances);
  const maxB = Math.max(...balances);
  const span = maxB - minB || 1;

  const pts = series.map((s, i) => {
    const x = padL + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const yNorm = (s.balance - minB) / span;
    const y = padT + innerH - yNorm * innerH;
    return { x, y, balance: s.balance, at: s.at };
  });

  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const first = pts[0];
  const last = pts[pts.length - 1];
  const areaD = `${lineD} L${last.x},${padT + innerH} L${first.x},${padT + innerH} Z`;

  return (
    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(123,44,191,0.18)' }}>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="能量值曲线"
        style={{ width: '100%', height: 160, display: 'block', background: 'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(245,236,255,0.5))' }}
      >
        <defs>
          <linearGradient id="growthEnergyArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,58,237,0.28)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.02)" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#growthEnergyArea)" stroke="none" />
        <path
          d={lineD}
          fill="none"
          stroke="#5b21b6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#7c3aed" strokeWidth="1.6" />
        ))}
        <text x={padL} y={vbH - 10} fontSize="11" fill="#6b4b8b" fontFamily="system-ui, sans-serif">
          横轴：从早到晚 · 纵轴：能量余额（{minB} → {maxB}）
        </text>
      </svg>
    </div>
  );
}

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
  const [showPaymentBindModal, setShowPaymentBindModal] = useState(false);
  const [paymentBindings, setPaymentBindings] = useState([]);
  const [payChannelOptions, setPayChannelOptions] = useState(DEFAULT_PAY_BIND_CHANNELS);
  const [bindChannelType, setBindChannelType] = useState('wechat');
  const [bindLabel, setBindLabel] = useState('');
  const [bindAccountMask, setBindAccountMask] = useState('');
  const [bindAccountRef, setBindAccountRef] = useState('');
  const [bindExtraNote, setBindExtraNote] = useState('');
  const [bindSetDefault, setBindSetDefault] = useState(true);
  const [rechargePayChannel, setRechargePayChannel] = useState('wechat');
  const [giftToUsername, setGiftToUsername] = useState('');
  const [giftEnergyAmount, setGiftEnergyAmount] = useState('');
  const [redeemEnergyAmount, setRedeemEnergyAmount] = useState('');
  const [redeemBindingId, setRedeemBindingId] = useState('');
  const [practiceStepModal, setPracticeStepModal] = useState(null);
  const [practiceStepDraft, setPracticeStepDraft] = useState('');

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
  const [publicEconomy, setPublicEconomy] = useState({
    dailyMaxSpin: 20,
    lotterySpinPointsCost: 22,
    lotteryEnergyBoostCost: 1
  });
  const [dailyScore, setDailyScore] = useState(null);
  const [todayPractice, setTodayPractice] = useState(null);
  const [mindsetMetrics, setMindsetMetrics] = useState(null);
  const [mindsetSuggestions, setMindsetSuggestions] = useState(null);
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [weeklyGoalTitle, setWeeklyGoalTitle] = useState('');
  const [weeklyGoalDescription, setWeeklyGoalDescription] = useState('');
  const [weeklyGoalTasksText, setWeeklyGoalTasksText] = useState('');
  const [weeklyGoalEvidence, setWeeklyGoalEvidence] = useState('');
  const [weeklyGoalCompletionRate, setWeeklyGoalCompletionRate] = useState(0);
  const [fearText, setFearText] = useState('');
  const [fearTriggerText, setFearTriggerText] = useState('');
  const [negativeBelief, setNegativeBelief] = useState('');
  const [distressScore, setDistressScore] = useState(65);
  const [distressScenario, setDistressScenario] = useState('');
  const [psychToolResult, setPsychToolResult] = useState(null);
  const [psychHistory, setPsychHistory] = useState([]);
  const [identityProfile, setIdentityProfile] = useState(null);
  const [identityEvidenceRows, setIdentityEvidenceRows] = useState([]);
  const [identityEvidenceTitle, setIdentityEvidenceTitle] = useState('');
  const [identityEvidenceContent, setIdentityEvidenceContent] = useState('');
  const [dailySelfEvalScore, setDailySelfEvalScore] = useState(70);
  const [dailySelfEvalNote, setDailySelfEvalNote] = useState('');
  const [weeklyFearScore, setWeeklyFearScore] = useState(60);
  const [weeklyInferiorityScore, setWeeklyInferiorityScore] = useState(60);
  const [weeklyAssessmentNote, setWeeklyAssessmentNote] = useState('');
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
      const d = res?.data?.data;
      const nextLiveQaUrl = d?.liveQaUrl;
      if (typeof nextLiveQaUrl === 'string' && nextLiveQaUrl.trim()) {
        setLiveQaUrl(nextLiveQaUrl.trim());
      }
      const opts = d?.payChannelOptions;
      if (Array.isArray(opts) && opts.length > 0) {
        setPayChannelOptions(opts);
      }
      if (d && typeof d === 'object') {
        setPublicEconomy({
          dailyMaxSpin: Math.max(1, Math.floor(Number(d.dailyMaxSpin)) || 20),
          lotterySpinPointsCost: Math.max(1, Math.floor(Number(d.lotterySpinPointsCost)) || 22),
          lotteryEnergyBoostCost: Math.max(1, Math.floor(Number(d.lotteryEnergyBoostCost)) || 1)
        });
      }
    } catch (err) {
      setLiveQaUrl(DEFAULT_LIVE_QA_URL);
    }
  }

  async function fetchPaymentBindings(currentToken = token) {
    if (!currentToken) return [];
    try {
      const res = await axios.get(`${API}/payment-bindings`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return [];
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setPaymentBindings(list);
      return list;
    } catch (err) {
      setPaymentBindings([]);
      return [];
    }
  }

  async function submitPaymentBinding() {
    if (!token) return;
    try {
      const res = await axios.post(
        `${API}/payment-bindings`,
        {
          channelType: bindChannelType,
          label: bindLabel,
          accountMask: bindAccountMask,
          accountRef: bindAccountRef,
          extraNote: bindExtraNote,
          setDefault: bindSetDefault
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '保存失败');
        return;
      }
      setPaymentBindings(Array.isArray(res.data.data) ? res.data.data : []);
      setBindLabel('');
      setBindAccountMask('');
      setBindAccountRef('');
      setBindExtraNote('');
      setBindSetDefault(true);
    } catch (err) {
      alert(err?.response?.data?.message || '保存失败');
    }
  }

  async function handleSetDefaultBinding(bindingId) {
    if (!token) return;
    try {
      const res = await axios.patch(
        `${API}/payment-bindings/${bindingId}/default`,
        {},
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
      setPaymentBindings(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      alert(err?.response?.data?.message || '操作失败');
    }
  }

  async function handleDeletePaymentBinding(bindingId) {
    if (!token) return;
    if (!window.confirm('确定移除该支付方式？')) return;
    try {
      const res = await axios.delete(`${API}/payment-bindings/${bindingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.data.success) {
        alert(res.data.message || '删除失败');
        return;
      }
      setPaymentBindings(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      alert(err?.response?.data?.message || '删除失败');
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
      const nextPractice = res.data.data?.practice || null;
      setTodayPractice(nextPractice);
      setMindsetSuggestions(res.data.data?.suggestions || null);
      if (Number(nextPractice?.self_eval_score || 0) > 0) {
        setDailySelfEvalScore(Number(nextPractice.self_eval_score));
      }
      if (typeof nextPractice?.self_eval_note === 'string') {
        setDailySelfEvalNote(nextPractice.self_eval_note);
      }
      if (Number(nextPractice?.weekly_fear_score || 0) > 0) {
        setWeeklyFearScore(Number(nextPractice.weekly_fear_score));
      }
      if (Number(nextPractice?.weekly_inferiority_score || 0) > 0) {
        setWeeklyInferiorityScore(Number(nextPractice.weekly_inferiority_score));
      }
      if (typeof nextPractice?.weekly_assessment_note === 'string') {
        setWeeklyAssessmentNote(nextPractice.weekly_assessment_note);
      }
    } catch (err) {
      setTodayPractice(null);
      setMindsetSuggestions(null);
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

  async function fetchWeeklyGoal(currentToken = token) {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API}/mindset/weekly-goal`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return;
      const row = res.data.data || null;
      setWeeklyGoal(row);
      setWeeklyGoalTitle(row?.goal_title || '');
      setWeeklyGoalDescription(row?.goal_description || '');
      setWeeklyGoalTasksText(Array.isArray(row?.split_tasks) ? row.split_tasks.join('\n') : '');
      setWeeklyGoalEvidence(row?.evidence_note || '');
      setWeeklyGoalCompletionRate(Number(row?.completion_rate || 0));
    } catch (err) {
      setWeeklyGoal(null);
    }
  }

  async function fetchPsychHistory(currentToken = token) {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API}/mindset/psych/history?limit=20`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return;
      setPsychHistory(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setPsychHistory([]);
    }
  }

  async function fetchIdentityProfile(currentToken = token) {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API}/mindset/identity/profile`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return;
      setIdentityProfile(res.data.data || null);
    } catch (err) {
      setIdentityProfile(null);
    }
  }

  async function fetchIdentityEvidence(currentToken = token) {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API}/mindset/identity/evidence?limit=30`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (!res.data.success) return;
      setIdentityEvidenceRows(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setIdentityEvidenceRows([]);
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
      fetchWeeklyGoal(token);
      fetchPsychHistory(token);
      fetchIdentityProfile(token);
      fetchIdentityEvidence(token);
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
    setMindsetSuggestions(null);
    setWeeklyGoal(null);
    setWeeklyGoalTitle('');
    setWeeklyGoalDescription('');
    setWeeklyGoalTasksText('');
    setWeeklyGoalEvidence('');
    setWeeklyGoalCompletionRate(0);
    setFearText('');
    setFearTriggerText('');
    setNegativeBelief('');
    setDistressScore(65);
    setDistressScenario('');
    setPsychToolResult(null);
    setPsychHistory([]);
    setIdentityProfile(null);
    setIdentityEvidenceRows([]);
    setIdentityEvidenceTitle('');
    setIdentityEvidenceContent('');
    setDailySelfEvalScore(70);
    setDailySelfEvalNote('');
    setWeeklyFearScore(60);
    setWeeklyInferiorityScore(60);
    setWeeklyAssessmentNote('');
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

    if (todaySpinCount >= publicEconomy.dailyMaxSpin) {
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
        { packageId, payChannel: rechargePayChannel },
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

  async function openRechargeModal() {
    if (!token) {
      alert('请先登录');
      setShowLoginModal(true);
      return;
    }

    const list = await fetchPaymentBindings(token);
    const def = list.find((b) => Number(b.is_default) === 1);
    if (def?.channel_type) {
      setRechargePayChannel(String(def.channel_type));
    }
    setShowRechargeModal(true);
  }

  async function openPaymentBindModal() {
    if (!token) {
      alert('请先登录');
      setShowLoginModal(true);
      return;
    }
    await fetchPaymentBindings(token);
    await fetchWallet(token);
    setShowPaymentBindModal(true);
  }

  async function submitGiftEnergy() {
    if (!token) return;
    const amt = Math.floor(Number(giftEnergyAmount));
    if (!giftToUsername.trim()) {
      alert('请输入对方登录用户名');
      return;
    }
    if (!Number.isFinite(amt) || amt < 1) {
      alert('请输入有效的能量数量');
      return;
    }
    if (!window.confirm(`确认向 @${giftToUsername.trim()} 赠送 ${amt} 点能量？`)) return;
    try {
      const res = await axios.post(
        `${API}/wallet/energy/gift`,
        { toUsername: giftToUsername.trim(), amount: amt },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '赠送失败');
        return;
      }
      if (res.data.data?.wallet) setWallet(res.data.data.wallet);
      setGiftEnergyAmount('');
      alert('赠送成功');
    } catch (err) {
      alert(err?.response?.data?.message || '赠送失败');
    }
  }

  async function submitRedeemEnergyCash() {
    if (!token) return;
    const amt = Math.floor(Number(redeemEnergyAmount));
    if (!Number.isFinite(amt) || amt < 1) {
      alert('请输入要兑换的能量数量');
      return;
    }
    if (!redeemBindingId) {
      alert('请先选择用于收款的已保存方式，便于运营打款');
      return;
    }
    const epy = Number(wallet?.energyPolicies?.energyPerYuan) || 100;
    const minE = Number(wallet?.energyPolicies?.minRedeemEnergy) || 100;
    if (amt < minE) {
      alert(`单次兑换至少 ${minE} 点能量`);
      return;
    }
    const cash = Math.floor((amt * 100) / epy) / 100;
    if (!window.confirm(`将扣除 ${amt} 点能量，申请兑换约 ¥${cash.toFixed(2)}（按 ${epy} 能量 = ¥1 折算，以实际审核为准）。提交后请等待人工打款。`)) {
      return;
    }
    try {
      const res = await axios.post(
        `${API}/wallet/energy/redeem-cash`,
        { energyAmount: amt, paymentBindingId: Number(redeemBindingId) },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '提交失败');
        return;
      }
      if (res.data.data?.wallet) setWallet(res.data.data.wallet);
      setRedeemEnergyAmount('');
      alert(`已提交申请，单号 #${res.data.data?.redemptionId || '--'}，请等待打款。`);
    } catch (err) {
      alert(err?.response?.data?.message || '提交失败');
    }
  }

  function openGrowthModal() {
    if (!token) {
      alert('请先登录');
      setShowLoginModal(true);
      return;
    }
    fetchGrowthTrajectory(token);
    fetchMindsetMetrics(token);
    fetchWeeklyGoal(token);
    fetchPsychHistory(token);
    fetchIdentityProfile(token);
    fetchIdentityEvidence(token);
    setShowGrowthModal(true);
  }

  async function submitIdentityEvidence() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    const title = identityEvidenceTitle.trim();
    const content = identityEvidenceContent.trim();
    if (!title || !content) {
      alert('请填写证据标题和证据内容');
      return;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/identity/evidence`,
        {
          title,
          content,
          sourceType: 'manual'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '保存失败');
        return;
      }
      setIdentityEvidenceTitle('');
      setIdentityEvidenceContent('');
      await fetchIdentityEvidence(token);
      await fetchIdentityProfile(token);
      alert('成长证据已保存');
    } catch (err) {
      alert(err?.response?.data?.message || '保存失败');
    }
  }

  function openPracticeStepModal(step) {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    const keyByStep = {
      affirmation: 'affirmation_text',
      action: 'action_text',
      reflection: 'reflection_text'
    };
    const col = keyByStep[step];
    const existing = col && todayPractice ? todayPractice[col] : '';
    setPracticeStepDraft(typeof existing === 'string' ? existing : '');
    setPracticeStepModal(step);
  }

  function closePracticeStepModal() {
    setPracticeStepModal(null);
    setPracticeStepDraft('');
  }

  async function completePracticeStep(step, text) {
    if (!token) {
      setShowLoginModal(true);
      return false;
    }
    const body = String(text || '').trim().slice(0, 255);
    if (body.length < 2) {
      alert('请至少写两个字，记录今天真实的一句话即可。');
      return false;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/practice/complete`,
        {
          step,
          text: body
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '操作失败');
        return false;
      }
      setTodayPractice(res.data.data?.practice || null);
      setMindsetSuggestions(res.data.data?.suggestions || null);
      await fetchMindsetMetrics(token);
      return true;
    } catch (err) {
      alert(err?.response?.data?.message || '操作失败');
      return false;
    }
  }

  async function submitPracticeStepModal() {
    if (!practiceStepModal) return;
    const ok = await completePracticeStep(practiceStepModal, practiceStepDraft);
    if (ok) closePracticeStepModal();
  }

  async function submitDailySelfEval() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/self-eval`,
        {
          score: Number(dailySelfEvalScore || 0),
          note: dailySelfEvalNote
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '提交每日自评失败');
        return;
      }
      setTodayPractice(res.data.data?.practice || null);
      setMindsetSuggestions(res.data.data?.suggestions || null);
      await fetchMindsetMetrics(token);
      alert('每日自评已更新');
    } catch (err) {
      alert(err?.response?.data?.message || '提交每日自评失败');
    }
  }

  async function submitWeeklyAssessment() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/weekly-assessment`,
        {
          fearScore: Number(weeklyFearScore || 0),
          inferiorityScore: Number(weeklyInferiorityScore || 0),
          note: weeklyAssessmentNote
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '提交每周测评失败');
        return;
      }
      setTodayPractice(res.data.data?.practice || null);
      setMindsetSuggestions(res.data.data?.suggestions || null);
      await fetchMindsetMetrics(token);
      alert('每周测评已更新');
    } catch (err) {
      alert(err?.response?.data?.message || '提交每周测评失败');
    }
  }

  async function submitWeeklyGoal() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const splitTasks = weeklyGoalTasksText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const status =
        Number(weeklyGoalCompletionRate || 0) >= 100
          ? 'done'
          : Number(weeklyGoalCompletionRate || 0) > 0
            ? 'in_progress'
            : 'pending';
      const res = await axios.post(
        `${API}/mindset/weekly-goal`,
        {
          goalTitle: weeklyGoalTitle,
          goalDescription: weeklyGoalDescription,
          splitTasks,
          completionRate: Number(weeklyGoalCompletionRate || 0),
          status,
          evidenceNote: weeklyGoalEvidence
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '保存周目标失败');
        return;
      }
      const row = res.data.data || null;
      setWeeklyGoal(row);
      setWeeklyGoalTitle(row?.goal_title || '');
      setWeeklyGoalDescription(row?.goal_description || '');
      setWeeklyGoalTasksText(Array.isArray(row?.split_tasks) ? row.split_tasks.join('\n') : '');
      setWeeklyGoalEvidence(row?.evidence_note || '');
      setWeeklyGoalCompletionRate(Number(row?.completion_rate || 0));
      await fetchMindsetMetrics(token);
      alert('周目标拆解已保存');
    } catch (err) {
      alert(err?.response?.data?.message || '保存周目标失败');
    }
  }

  async function runFearIdentify() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/psych/fear-identify`,
        {
          fearText,
          triggerText: fearTriggerText
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '恐惧识别失败');
        return;
      }
      setPsychToolResult({ type: 'fear', data: res.data.data });
      await fetchPsychHistory(token);
    } catch (err) {
      alert(err?.response?.data?.message || '恐惧识别失败');
    }
  }

  async function runInferiorityRewrite() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/psych/inferiority-rewrite`,
        { negativeBelief },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '自卑重构失败');
        return;
      }
      setPsychToolResult({ type: 'rewrite', data: res.data.data });
      await fetchPsychHistory(token);
    } catch (err) {
      alert(err?.response?.data?.message || '自卑重构失败');
    }
  }

  async function runEmotionalFirstAid() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await axios.post(
        `${API}/mindset/psych/first-aid`,
        {
          distressScore: Number(distressScore || 0),
          scenario: distressScenario
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!res.data.success) {
        alert(res.data.message || '情绪急救失败');
        return;
      }
      setPsychToolResult({ type: 'aid', data: res.data.data });
      await fetchPsychHistory(token);
    } catch (err) {
      alert(err?.response?.data?.message || '情绪急救失败');
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
  const mindsetCurveRows = Array.isArray(mindsetMetrics?.curve)
    ? mindsetMetrics.curve.slice(-30)
    : [];
  const weeklyAssessmentRows = Array.isArray(mindsetMetrics?.weeklyAssessments)
    ? mindsetMetrics.weeklyAssessments.slice(-12)
    : [];

  const energyBalanceChartSeries = useMemo(() => {
    const slice = energyRecords.slice(0, 56);
    return [...slice]
      .reverse()
      .map((r) => ({
        balance: Number(r.balance_after),
        at: r.created_at
      }))
      .filter((p) => Number.isFinite(p.balance));
  }, [energyRecords]);

  const spinPointsCostDisplay =
    wallet?.lotteryEconomy?.spinPointsCost ?? publicEconomy.lotterySpinPointsCost;
  const energyBoostCostDisplay =
    wallet?.lotteryEconomy?.energyBoostCost ?? publicEconomy.lotteryEnergyBoostCost;

  function formatRechargeAmount(amount) {
    const n = Number(amount);
    return Number.isFinite(n) ? n : amount;
  }
const centerWheelWrap = {
  position: isMobile ? 'relative' : 'absolute',
  top: isMobile ? 'auto' : '50%',
  left: isMobile ? 'auto' : '50%',
  transform: isMobile ? 'none' : 'translate(-50%, -50%)',
  zIndex: 2,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'auto',
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
  const textInputStyle = inputStyle;

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
    bottom: 10,
    // 桌面端原为 220px 固定高，三档套餐+副文案会溢出并被 dashboard 裁切；改为自适应 + 上限滚动
    ...(isMobile
      ? {}
      : {
          height: 'auto',
          maxHeight: 'min(480px, calc(100dvh - 88px))',
          overflowY: 'auto',
          overflowX: 'hidden',
          justifyContent: 'flex-start',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        })
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
        <span style={{ opacity: 0.85 }}> · 评估与心理工具：已并入「成长轨迹」弹窗。首屏左上角仅保留三步练习。无此行请重启 npm run dev</span>
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
              <div style={{ marginBottom: 6, color: '#6b21a8', fontSize: 12 }}>
                今日能量关键词：<strong>{mindsetSuggestions?.energyKeyword || '稳住节奏'}</strong>
              </div>
              <div style={{ marginBottom: 8, color: '#6b4b8b', fontSize: 12 }}>
                {mindsetSuggestions?.cosmicMicroContent || '先完成一个最小行动，你会更相信自己。'}
              </div>
              <button
                onClick={() => openPracticeStepModal('affirmation')}
                className="cosmic-btn"
                style={{ ...ghostBtn, width: '100%', marginBottom: 6, textAlign: 'left', fontSize: 12 }}
              >
                {affirmationDone ? '✅ 晨间确认已完成 · 点按可改' : '⭕ 晨间确认 — 写一句话'}
              </button>
              <button
                onClick={() => openPracticeStepModal('action')}
                className="cosmic-btn"
                style={{ ...ghostBtn, width: '100%', marginBottom: 6, textAlign: 'left', fontSize: 12 }}
              >
                {actionDone ? '✅ 今日行动已完成 · 点按可改' : '⭕ 今日最小行动 — 写一件小事'}
              </button>
              <button
                onClick={() => openPracticeStepModal('reflection')}
                className="cosmic-btn"
                style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontSize: 12 }}
              >
                {reflectionDone ? '✅ 晚间复盘已完成 · 点按可改' : '⭕ 晚间复盘 — 一两句收尾'}
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
        <div style={{ textAlign: 'right', marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2f1b45' }}>账户中心</div>
          <div style={{ fontSize: 11, color: '#6b4b8b', marginTop: 2, lineHeight: 1.5 }}>
            成长轨迹（含评估与记录）入口
          </div>
        </div>
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
              ...ghostBtn,
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
            <button
              onClick={openPaymentBindModal}
              className="cosmic-btn"
              style={{ ...ghostBtn, width: '100%', marginTop: 6, textAlign: 'right' }}
            >
              支付 / 收款与能量（绑定、转赠、兑换）
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

    <div
      style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#6b4b8b',
        marginBottom: 6,
        lineHeight: 1.55,
        maxWidth: 420,
        marginLeft: 'auto',
        marginRight: 'auto'
      }}
    >
      每次转动消耗 <strong>{spinPointsCostDisplay}</strong> 积分；若有足够能量，另扣{' '}
      <strong>{energyBoostCostDisplay}</strong> 点能量参与加权奖池。每日最多{' '}
      <strong>{publicEconomy.dailyMaxSpin}</strong> 次（均由后台 business_params 配置）。
    </div>

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
      <div style={{ marginBottom: 6, color: '#6b21a8', fontSize: 13 }}>
        今日能量关键词：<strong>{mindsetSuggestions?.energyKeyword || '稳住节奏'}</strong>
      </div>
      <div style={{ marginBottom: 8, color: '#6b4b8b', fontSize: 12 }}>
        {mindsetSuggestions?.cosmicMicroContent || '先完成一个最小行动，你会更相信自己。'}
      </div>

      <button
        onClick={() => openPracticeStepModal('affirmation')}
        className="cosmic-btn"
        style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
      >
        {affirmationDone ? '✅ 晨间确认已完成 · 点按可改' : '⭕ 晨间确认 — 写一句话'}
      </button>

      <button
        onClick={() => openPracticeStepModal('action')}
        className="cosmic-btn"
        style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
      >
        {actionDone ? '✅ 今日行动已完成 · 点按可改' : '⭕ 今日最小行动 — 写一件小事'}
      </button>

      <button
        onClick={() => openPracticeStepModal('reflection')}
        className="cosmic-btn"
        style={{ ...ghostBtn, width: '100%', textAlign: 'left', fontWeight: 'bold' }}
      >
        {reflectionDone ? '✅ 晚间复盘已完成 · 点按可改' : '⭕ 晚间复盘 — 一两句收尾'}
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
  <div style={{ textAlign: 'right', marginBottom: 10 }}>
    <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2f1b45' }}>账户中心</div>
    <div style={{ fontSize: 11, color: '#6b4b8b', marginTop: 2, lineHeight: 1.5 }}>
      能量余额 · 成长轨迹（含评估、记录与工具）
    </div>
  </div>

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
        ...ghostBtn,
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
  <button
    onClick={openPaymentBindModal}
    className="cosmic-btn"
    style={{ ...ghostBtn, width: '100%', marginTop: 6, textAlign: 'right' }}
  >
    支付 / 收款与能量（绑定、转赠、兑换）
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

                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: '#6b4b8b',
                    marginBottom: 8,
                    lineHeight: 1.55,
                    maxWidth: 520,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                >
                  每次转动消耗 <strong>{spinPointsCostDisplay}</strong> 积分；若有足够能量，另扣{' '}
                  <strong>{energyBoostCostDisplay}</strong> 点能量参与加权奖池。每日最多{' '}
                  <strong>{publicEconomy.dailyMaxSpin}</strong> 次（均由后台 business_params 配置）。
                </div>

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
                  width: 920,
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
                <h2 className="panel-title" style={{ marginTop: 0, marginBottom: 6 }}>成长轨迹</h2>
                <p style={{ fontSize: 12, color: '#6b4b8b', lineHeight: 1.65, marginTop: 0, marginBottom: 18 }}>
                  成长记录（能量曲线、徽章、进阶标准）与成长评估、心理工具均在本页完成；下方仍可查看明细数据与证据墙。
                </p>

                <h3 style={{ margin: '0 0 10px', color: '#4b2a67', fontSize: 16 }}>成长记录</h3>
                <div
                  style={{
                    marginBottom: 20,
                    padding: 14,
                    borderRadius: 14,
                    border: '1px solid rgba(123,44,191,0.2)',
                    background: 'rgba(255,255,255,0.55)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#5b21b6', marginBottom: 8, fontSize: 13 }}>能量值曲线</div>
                  <EnergyBalanceChart series={energyBalanceChartSeries} />
                  <div style={{ fontSize: 12, color: '#4b2a67', marginTop: 10, marginBottom: 14 }}>
                    当前能量余额：
                    <strong>{wallet != null ? wallet.energy_balance : '--'}</strong>
                    <span style={{ opacity: 0.75, marginLeft: 8 }}>（曲线按流水时间正序）</span>
                  </div>

                  <div style={{ fontWeight: 'bold', color: '#5b21b6', marginBottom: 10, fontSize: 13 }}>进阶徽章</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    {(identityProfile?.badges || []).length === 0 ? (
                      <span style={{ fontSize: 12, color: '#6b4b8b' }}>暂无徽章数据，完成周目标与练习后将逐步解锁。</span>
                    ) : (
                      (identityProfile?.badges || []).map((b) => (
                        <div
                          key={b.key || b.title}
                          style={{
                            width: 86,
                            minHeight: 86,
                            borderRadius: 999,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '8px 6px',
                            boxSizing: 'border-box',
                            border: b.unlocked ? '2px solid rgba(212,175,55,0.65)' : '2px solid rgba(107,75,139,0.25)',
                            background: b.unlocked
                              ? 'linear-gradient(145deg, rgba(254,243,199,0.95), rgba(196,181,253,0.88), rgba(123,44,191,0.85))'
                              : 'linear-gradient(180deg, rgba(245,245,250,0.9), rgba(220,220,230,0.55))',
                            boxShadow: b.unlocked ? '0 6px 18px rgba(123,44,191,0.22)' : 'none',
                            color: b.unlocked ? '#3b0764' : '#8878a8'
                          }}
                        >
                          <span style={{ fontSize: 20, lineHeight: 1 }}>{b.unlocked ? '✦' : '◇'}</span>
                          <span style={{ fontSize: 10, fontWeight: 'bold', marginTop: 4, lineHeight: 1.25 }}>{b.title}</span>
                          {b.unlocked && b.unlockedAt ? (
                            <span style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>
                              {new Date(b.unlockedAt).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ fontWeight: 'bold', color: '#5b21b6', marginBottom: 8, fontSize: 13 }}>进阶标准（身份等级）</div>
                  <div style={{ fontSize: 11, color: '#6b4b8b', marginBottom: 8, lineHeight: 1.55 }}>
                    身份分由连续行动、心理指标与成长证据等综合计算；达到对应分数进入下一阶。
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>等级</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>门槛分</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>进阶标准</th>
                      </tr>
                    </thead>
                    <tbody>
                      {IDENTITY_LEVEL_TIERS.map((tier) => {
                        const active = Number(identityProfile?.level ?? 1) === tier.level;
                        return (
                          <tr
                            key={tier.level}
                            style={{
                              background: active ? 'rgba(124,58,237,0.12)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '8px 4px', fontWeight: active ? 'bold' : 'normal' }}>
                              Lv.{tier.level} {tier.name}
                              {active ? ' · 当前' : ''}
                            </td>
                            <td style={{ padding: '8px 4px' }}>≥ {tier.minScore}</td>
                            <td style={{ padding: '8px 4px', color: '#4b2a67', lineHeight: 1.5 }}>{tier.standard}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div style={{ fontWeight: 'bold', color: '#5b21b6', marginBottom: 6, fontSize: 13 }}>最近能量变动</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '4px' }}>时间</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '4px' }}>变动</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '4px' }}>来源</th>
                      </tr>
                    </thead>
                    <tbody>
                      {energyCurveRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '6px 4px', opacity: 0.7 }}>
                            暂无
                          </td>
                        </tr>
                      ) : (
                        energyCurveRows.slice(0, 5).map((row) => (
                          <tr key={row.id}>
                            <td style={{ padding: '4px' }}>{row.time}</td>
                            <td style={{ padding: '4px' }}>{row.energy}</td>
                            <td style={{ padding: '4px' }}>{row.source}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ margin: '0 0 10px', color: '#4b2a67', fontSize: 16 }}>成长评估与心理工具</h3>
                <div
                  style={{
                    marginBottom: 20,
                    padding: 14,
                    borderRadius: 14,
                    border: '1px solid rgba(123,44,191,0.2)',
                    background: 'rgba(255,255,255,0.5)'
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b4b8b', marginBottom: 14, lineHeight: 1.6 }}>
                    每日自评、每周测评、周目标拆解与心理赋能工具；首屏「空中加油站」仍保留晨间三步轻打卡。
                  </div>

                  <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: 8 }}>每日自评（1-100）</div>
                  <input
                    value={dailySelfEvalScore}
                    onChange={(e) => setDailySelfEvalScore(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    placeholder="例如 78"
                  />
                  <textarea
                    value={dailySelfEvalNote}
                    onChange={(e) => setDailySelfEvalNote(e.target.value)}
                    style={{ ...inputStyle, width: '100%', minHeight: 56, marginBottom: 8, resize: 'vertical' }}
                    placeholder="可选：今天最值得肯定的一点"
                  />
                  <button onClick={submitDailySelfEval} className="cosmic-btn" style={{ ...primaryBtn, width: '100%', marginBottom: 16 }}>
                    提交每日自评
                  </button>

                  <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: 8 }}>每周测评（恐惧 / 自卑）</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={weeklyFearScore}
                      onChange={(e) => setWeeklyFearScore(e.target.value)}
                      style={{ ...inputStyle, width: '50%' }}
                      placeholder="恐惧分"
                    />
                    <input
                      value={weeklyInferiorityScore}
                      onChange={(e) => setWeeklyInferiorityScore(e.target.value)}
                      style={{ ...inputStyle, width: '50%' }}
                      placeholder="自卑分"
                    />
                  </div>
                  <textarea
                    value={weeklyAssessmentNote}
                    onChange={(e) => setWeeklyAssessmentNote(e.target.value)}
                    style={{ ...inputStyle, width: '100%', minHeight: 56, marginBottom: 8, resize: 'vertical' }}
                    placeholder="可选：本周内耗主要来自哪里"
                  />
                  <button onClick={submitWeeklyAssessment} className="cosmic-btn" style={{ ...primaryBtn, width: '100%', marginBottom: 16 }}>
                    提交每周测评
                  </button>

                  <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: 8 }}>周目标拆解</div>
                  <input
                    value={weeklyGoalTitle}
                    onChange={(e) => setWeeklyGoalTitle(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    placeholder="本周目标标题"
                  />
                  <textarea
                    value={weeklyGoalDescription}
                    onChange={(e) => setWeeklyGoalDescription(e.target.value)}
                    style={{ ...inputStyle, width: '100%', minHeight: 48, marginBottom: 8, resize: 'vertical' }}
                    placeholder="目标说明（可选）"
                  />
                  <textarea
                    value={weeklyGoalTasksText}
                    onChange={(e) => setWeeklyGoalTasksText(e.target.value)}
                    style={{ ...inputStyle, width: '100%', minHeight: 80, marginBottom: 8, resize: 'vertical' }}
                    placeholder={'任务拆解（每行一条）'}
                  />
                  <input
                    value={weeklyGoalCompletionRate}
                    onChange={(e) => setWeeklyGoalCompletionRate(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    placeholder="完成率 0-100"
                  />
                  <input
                    value={weeklyGoalEvidence}
                    onChange={(e) => setWeeklyGoalEvidence(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
                    placeholder="成长证据（可选）"
                  />
                  <button onClick={submitWeeklyGoal} className="cosmic-btn" style={{ ...primaryBtn, width: '100%', marginBottom: 8 }}>
                    保存周目标拆解
                  </button>

                  <div
                    style={{
                      marginTop: 8,
                      marginBottom: 4,
                      borderTop: '1px dashed rgba(123,44,191,0.22)',
                      paddingTop: 14
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: 8 }}>心理赋能工具</div>
                    <input
                      value={fearText}
                      onChange={(e) => setFearText(e.target.value)}
                      style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                      placeholder="我在怕什么？"
                    />
                    <input
                      value={fearTriggerText}
                      onChange={(e) => setFearTriggerText(e.target.value)}
                      style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                      placeholder="触发场景（可空）"
                    />
                    <button onClick={runFearIdentify} className="cosmic-btn" style={{ ...ghostBtn, width: '100%', textAlign: 'left', marginBottom: 8 }}>
                      恐惧识别问答
                    </button>
                    <input
                      value={negativeBelief}
                      onChange={(e) => setNegativeBelief(e.target.value)}
                      style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                      placeholder="输入自我否定信念（例如：我不配成功）"
                    />
                    <button onClick={runInferiorityRewrite} className="cosmic-btn" style={{ ...ghostBtn, width: '100%', textAlign: 'left', marginBottom: 8 }}>
                      自卑重构脚本
                    </button>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        value={distressScore}
                        onChange={(e) => setDistressScore(e.target.value)}
                        style={{ ...inputStyle, width: '35%' }}
                        placeholder="情绪强度"
                      />
                      <input
                        value={distressScenario}
                        onChange={(e) => setDistressScenario(e.target.value)}
                        style={{ ...inputStyle, width: '65%' }}
                        placeholder="当前场景"
                      />
                    </div>
                    <button onClick={runEmotionalFirstAid} className="cosmic-btn" style={{ ...ghostBtn, width: '100%', textAlign: 'left', marginBottom: 8 }}>
                      情绪急救（3分钟）
                    </button>
                    {psychToolResult && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#4b2a67', lineHeight: 1.6 }}>
                        <strong>工具输出：</strong>
                        <div>{JSON.stringify(psychToolResult.data)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    margin: '18px 0 14px',
                    paddingTop: 12,
                    borderTop: '2px solid rgba(123,44,191,0.15)',
                    fontWeight: 'bold',
                    color: '#5b21b6',
                    fontSize: 14
                  }}
                >
                  数据与明细
                </div>

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
                  <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#5b21b6' }}>今日心理指标快照</div>
                  <div>连续行动天数：<strong>{currentStreakDays}</strong></div>
                  <div>自我确认指数：<strong>{mindsetMetrics?.latest?.self_confirmation_score ?? '--'}</strong></div>
                  <div>行动稳定指数：<strong>{mindsetMetrics?.latest?.action_consistency_index ?? '--'}</strong></div>
                  <div>恐惧干扰指数：<strong>{mindsetMetrics?.latest?.fear_interference_index ?? '--'}</strong></div>
                  <div>每日自评均值：<strong>{mindsetMetrics?.selfEvalAvg ?? '--'}</strong></div>
                </div>
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
                  <div style={{ fontWeight: 'bold' }}>本周目标：{weeklyGoal?.goal_title || '--'}</div>
                  <div>完成率：<strong>{weeklyGoal?.completion_rate ?? 0}%</strong></div>
                  <div>状态：{weeklyGoal?.status || 'pending'}</div>
                  {Array.isArray(weeklyGoal?.split_tasks) && weeklyGoal.split_tasks.length > 0 && (
                    <div>拆解任务：{weeklyGoal.split_tasks.join(' / ')}</div>
                  )}
                  {weeklyGoal?.evidence_note && <div>成长证据：{weeklyGoal.evidence_note}</div>}
                </div>

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
                  <div style={{ fontWeight: 'bold' }}>
                    身份等级：Lv.{identityProfile?.level ?? 1} {identityProfile?.levelName || '萌芽者'}
                  </div>
                  <div>身份分：<strong>{identityProfile?.levelScore ?? '--'}</strong></div>
                  <div>
                    下一等级：{identityProfile?.nextLevel
                      ? `Lv.${identityProfile.nextLevel.level} ${identityProfile.nextLevel.name}（需 ${identityProfile.nextLevel.needScore} 分）`
                      : '已达到最高等级'}
                  </div>
                  <div>
                    徽章进度：
                    {(identityProfile?.badges || []).map((b) => `${b.unlocked ? '✅' : '⬜'}${b.title}`).join(' / ') || '--'}
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.86 }}>
                    徽章领取记录：
                    {(identityProfile?.badges || [])
                      .filter((b) => b.unlocked && b.unlockedAt)
                      .map((b) => `${b.title}（${new Date(b.unlockedAt).toLocaleDateString()} / ${b.sourceType || 'system'}）`)
                      .join(' / ') || '暂无'}
                  </div>
                  <div>证据墙条目：<strong>{identityProfile?.evidenceCount ?? 0}</strong></div>
                </div>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>成长证据墙</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: windowWidth <= 760 ? '1fr' : '1fr 1fr',
                    gap: 10,
                    marginBottom: 12
                  }}
                >
                  <input
                    value={identityEvidenceTitle}
                    onChange={(e) => setIdentityEvidenceTitle(e.target.value)}
                    placeholder="证据标题（例如：我主动完成一次关键沟通）"
                    style={{ ...textInputStyle, minHeight: 40 }}
                  />
                  <input
                    value={identityEvidenceContent}
                    onChange={(e) => setIdentityEvidenceContent(e.target.value)}
                    placeholder="证据内容（发生了什么变化）"
                    style={{ ...textInputStyle, minHeight: 40 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button className="cosmic-btn" style={primaryBtn} onClick={submitIdentityEvidence}>
                    新增成长证据
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>时间</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>标题</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>内容</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>阶段</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {identityEvidenceRows.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无成长证据</td></tr>
                    ) : identityEvidenceRows.slice(0, 30).map((row) => (
                      <tr key={String(row.id)}>
                        <td style={{ padding: '6px 4px' }}>
                          {row.created_at ? new Date(row.created_at).toLocaleString() : (row.evidence_date || '--')}
                        </td>
                        <td style={{ padding: '6px 4px' }}>{row.title || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.content || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.phase_label || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.source_type || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>成长核心曲线（确认感 / 行动稳定 / 恐惧干扰）</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>日期</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>自我确认</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>行动稳定</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>恐惧干扰</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>当日自评</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mindsetCurveRows.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无曲线数据</td></tr>
                    ) : mindsetCurveRows.map((row) => (
                      <tr key={String(row.practice_date)}>
                        <td style={{ padding: '6px 4px' }}>{row.practice_date || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.self_confirmation_score ?? '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.action_consistency_index ?? '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.fear_interference_index ?? '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{Number(row.self_eval_score || 0) > 0 ? row.self_eval_score : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>每周测评（恐惧/自卑）</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>日期</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>恐惧分</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>自卑分</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>干扰均值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyAssessmentRows.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无每周测评数据</td></tr>
                    ) : weeklyAssessmentRows.map((row) => (
                      <tr key={String(row.practice_date) + '-weekly'}>
                        <td style={{ padding: '6px 4px' }}>{row.practice_date || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.fearScore ?? '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.inferiorityScore ?? '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.interferenceAvg ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>心理赋能记录</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>时间</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>工具</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>输入</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid rgba(75,42,103,0.2)', padding: '6px 4px' }}>强度变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psychHistory.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '8px 4px', opacity: 0.7 }}>暂无心理赋能记录</td></tr>
                    ) : psychHistory.slice(0, 20).map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '6px 4px' }}>{row.created_at ? new Date(row.created_at).toLocaleString() : '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.tool_type || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>{row.input_text || '--'}</td>
                        <td style={{ padding: '6px 4px' }}>
                          {row.distress_before != null && row.distress_after != null
                            ? `${row.distress_before} → ${row.distress_after}`
                            : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ margin: '10px 0', color: '#4b2a67' }}>能量流水（明细）</h3>
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

          {practiceStepModal && PRACTICE_STEP_UI[practiceStepModal] && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={closePracticeStepModal}
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
                <h2 className="panel-title" style={{ marginTop: 0 }}>
                  {PRACTICE_STEP_UI[practiceStepModal].title}
                </h2>
                <p style={{ fontSize: 12, color: '#6b4b8b', lineHeight: 1.6, marginTop: 0 }}>
                  {PRACTICE_STEP_UI[practiceStepModal].hint}
                </p>
                <textarea
                  value={practiceStepDraft}
                  onChange={(e) => setPracticeStepDraft(e.target.value.slice(0, 255))}
                  placeholder={PRACTICE_STEP_UI[practiceStepModal].placeholder}
                  style={{
                    ...inputStyle,
                    width: '100%',
                    minHeight: 96,
                    resize: 'vertical',
                    marginTop: 8,
                    marginBottom: 6,
                    fontFamily: 'inherit'
                  }}
                  maxLength={255}
                  rows={4}
                />
                <div style={{ fontSize: 11, color: '#6b4b8b', textAlign: 'right', marginBottom: 14 }}>
                  {practiceStepDraft.length} / 255
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={closePracticeStepModal} className="cosmic-btn" style={ghostBtn}>
                    取消
                  </button>
                  <button type="button" onClick={submitPracticeStepModal} className="cosmic-btn" style={primaryBtn}>
                    保存并完成
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

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#6b4b8b', marginBottom: 6, lineHeight: 1.5 }}>
                    本次充值记账通道（与后台对账一致；实际付款仍走您线下约定流程）
                  </div>
                  <select
                    value={rechargePayChannel}
                    onChange={(e) => setRechargePayChannel(e.target.value)}
                    style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                  >
                    {payChannelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

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

          {showPaymentBindModal && (
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
              onClick={() => setShowPaymentBindModal(false)}
            >
              <div
                className="glass-panel"
                style={{
                  width: 460,
                  maxWidth: '94vw',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,236,255,0.82))',
                  color: '#2f1b45',
                  borderRadius: 18,
                  padding: 24,
                  boxShadow: '0 20px 50px rgba(80,42,120,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="panel-title" style={{ marginTop: 0 }}>支付方式与能量</h2>
                <p style={{ fontSize: 12, color: '#6b4b8b', lineHeight: 1.6, marginTop: 0 }}>
                  用于记录您常用的付款渠道（脱敏即可：如微信昵称尾字、卡号后四位、钱包地址前后片段）。请勿填写完整卡号、支付密码或助记词。
                </p>

                <div
                  style={{
                    marginBottom: 18,
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid rgba(123,44,191,0.2)',
                    background: 'rgba(255,255,255,0.52)'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#5b21b6', marginBottom: 6 }}>能量转赠 · 兑换现金</div>
                  <p style={{ fontSize: 11, color: '#6b4b8b', lineHeight: 1.55, marginTop: 0, marginBottom: 10 }}>
                    当前能量：<strong>{wallet != null ? wallet.energy_balance : '--'}</strong>。转赠与兑换都会消耗能量并记入流水。
                    <span style={{ display: 'block', marginTop: 6 }}>
                      为何默认「送能量」而非送积分：能量对应付费与成长加成，转赠更有「礼物感」且不易造成免费积分通胀；积分仍建议通过任务/转盘闭环获取。
                    </span>
                  </p>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#4b2a67', marginBottom: 6 }}>赠送给朋友（对方登录用户名）</div>
                  <input
                    value={giftToUsername}
                    onChange={(e) => setGiftToUsername(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    placeholder="对方用户名（与登录账号一致）"
                  />
                  <input
                    value={giftEnergyAmount}
                    onChange={(e) => setGiftEnergyAmount(e.target.value.replace(/[^\d]/g, ''))}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    placeholder={`能量数量（单次最多 ${wallet?.energyPolicies?.maxGiftPerTx ?? 5000}）`}
                  />
                  <button type="button" onClick={submitGiftEnergy} className="cosmic-btn" style={{ ...primaryBtn, width: '100%', marginBottom: 14 }}>
                    确认赠送能量
                  </button>

                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#4b2a67', marginBottom: 6 }}>能量兑换现金（人工打款）</div>
                  <p style={{ fontSize: 11, color: '#6b4b8b', marginTop: 0, marginBottom: 8, lineHeight: 1.5 }}>
                    汇率（可后台调整）：约 <strong>{wallet?.energyPolicies?.energyPerYuan ?? 100}</strong> 点能量 = ¥1；单次至少{' '}
                    <strong>{wallet?.energyPolicies?.minRedeemEnergy ?? 100}</strong> 点。提交后为「待打款」状态，运营按下方所选收款方式线下转账。
                  </p>
                  <input
                    value={redeemEnergyAmount}
                    onChange={(e) => setRedeemEnergyAmount(e.target.value.replace(/[^\d]/g, ''))}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                    placeholder="要兑换的能量数量"
                  />
                  <select
                    value={redeemBindingId}
                    onChange={(e) => setRedeemBindingId(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 8, cursor: 'pointer' }}
                  >
                    <option value="">请选择收款方式（必选）</option>
                    {paymentBindings.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {payChannelLabel(b.channel_type, payChannelOptions)} · {b.label || '未命名'} · {b.account_mask}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: '#4b2a67', marginBottom: 8 }}>
                    预计到账约：¥
                    {(() => {
                      const epy = Number(wallet?.energyPolicies?.energyPerYuan) || 100;
                      const n = Math.floor(Number(redeemEnergyAmount) || 0);
                      return (Math.floor((n * 100) / epy) / 100).toFixed(2);
                    })()}
                  </div>
                  <button type="button" onClick={submitRedeemEnergyCash} className="cosmic-btn" style={{ ...ghostBtn, width: '100%' }}>
                    提交兑换申请
                  </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>已保存</div>
                  {paymentBindings.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#6b4b8b' }}>暂无，请在下方添加。</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {paymentBindings.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            border: '1px solid rgba(123,44,191,0.2)',
                            borderRadius: 12,
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.5)',
                            fontSize: 13,
                            lineHeight: 1.5
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>
                            {payChannelLabel(b.channel_type, payChannelOptions)}
                            {Number(b.is_default) === 1 ? (
                              <span style={{ marginLeft: 8, fontSize: 11, color: '#7b2cbf' }}>默认</span>
                            ) : null}
                          </div>
                          <div style={{ color: '#4b2a67' }}>
                            {b.label ? `${b.label} · ` : ''}
                            {b.account_mask || '--'}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {Number(b.is_default) !== 1 ? (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultBinding(b.id)}
                                className="cosmic-btn"
                                style={{ ...ghostBtn, padding: '6px 12px', fontSize: 12 }}
                              >
                                设为默认
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentBinding(b.id)}
                              className="cosmic-btn"
                              style={{ ...ghostBtn, padding: '6px 12px', fontSize: 12 }}
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(123,44,191,0.12)',
                    paddingTop: 14
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 10 }}>添加</div>
                  <label style={{ fontSize: 12, color: '#4b2a67', display: 'block', marginBottom: 4 }}>渠道</label>
                  <select
                    value={bindChannelType}
                    onChange={(e) => setBindChannelType(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 10, cursor: 'pointer' }}
                  >
                    {payChannelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <label style={{ fontSize: 12, color: '#4b2a67', display: 'block', marginBottom: 4 }}>备注名（可选）</label>
                  <input
                    value={bindLabel}
                    onChange={(e) => setBindLabel(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
                    placeholder="例如：本人微信 / 公司卡"
                  />
                  <label style={{ fontSize: 12, color: '#4b2a67', display: 'block', marginBottom: 4 }}>
                    账户标识（脱敏，至少 2 字）
                  </label>
                  <input
                    value={bindAccountMask}
                    onChange={(e) => setBindAccountMask(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
                    placeholder="尾号 1234 / 地址 0xabc…末尾"
                  />
                  <label style={{ fontSize: 12, color: '#4b2a67', display: 'block', marginBottom: 4 }}>
                    外部参考号（可选）
                  </label>
                  <input
                    value={bindAccountRef}
                    onChange={(e) => setBindAccountRef(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
                    placeholder="订单号、商户侧 ID 等"
                  />
                  <label style={{ fontSize: 12, color: '#4b2a67', display: 'block', marginBottom: 4 }}>补充说明（可选）</label>
                  <input
                    value={bindExtraNote}
                    onChange={(e) => setBindExtraNote(e.target.value)}
                    style={{ ...inputStyle, width: '100%', marginBottom: 10 }}
                  />
                  <label
                    style={{
                      fontSize: 12,
                      color: '#4b2a67',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bindSetDefault}
                      onChange={(e) => setBindSetDefault(e.target.checked)}
                    />
                    添加后设为默认
                  </label>
                  <button type="button" onClick={submitPaymentBinding} className="cosmic-btn" style={{ ...primaryBtn, width: '100%' }}>
                    保存支付方式
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" onClick={() => setShowPaymentBindModal(false)} className="cosmic-btn" style={ghostBtn}>
                    关闭
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