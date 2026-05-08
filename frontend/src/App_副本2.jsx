import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import LotteryWheel from './components/common/LotteryWheel';
import { chickenSoup } from './data/chickenSoup';
import bgImage from './a_digital_2d_illustration_features_a_mystical_fort.png';
import "./styles/cosmic-v42.css";

const API = 'http://127.0.0.1:3001/api';

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
        zIndex: 2,
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
  const [loading, setLoading] = useState(false);
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [wheelResult, setWheelResult] = useState(null);
  const [combo, setCombo] = useState(0);
  const [todaySpinCount, setTodaySpinCount] = useState(0);
  const [maxSpinCount] = useState(20);
  const [dailyScore, setDailyScore] = useState(null);
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
    if (currentToken === 'test-token') {
      setWallet((prev) => ({
        points_balance: prev?.points_balance ?? 1000,
        energy_balance: prev?.energy_balance ?? 100
      }));
      return;
    }

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

  useEffect(() => {
    setCheckedToday(isTodayChecked());
  }, []);

  useEffect(() => {
    if (token) {
      fetchWallet(token);
    }
  }, [token]);

  async function handleLogin() {
    const fakeUser = {
      id: 1,
      username: 'test_user'
    };

    const fakeToken = 'test-token';

    localStorage.setItem('member_token', fakeToken);
    localStorage.setItem('member_user', JSON.stringify(fakeUser));

    setToken(fakeToken);
    setUser(fakeUser);

    setWallet({
      points_balance: 1000,
      energy_balance: 100
    });

    setShowLoginModal(false);

    alert('测试登录成功 🚀');
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
  }

  function handleRegisterSubmit() {
    if (
      !registerForm.name ||
      !registerForm.account ||
      !registerForm.password ||
      !registerForm.contact
    ) {
      alert('请先填写姓名、登录账号、登录密码、联系方式');
      return;
    }

    console.log('注册信息：', registerForm);
    alert('注册信息已填写完成，后续再接入真实注册接口');

    setShowRegisterModal(false);

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
      const score = generateRandomScore();

      const fakeResult = {
        reward_type: 'score',
        reward_value: score,
        pointsBefore: wallet?.points_balance ?? 1000,
        pointsAfter: wallet?.points_balance ?? 1000,
        boosted: false,
        usedEnergy: 0,
        energyAfter: wallet?.energy_balance ?? 100
      };

      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('last_check_date', today);
      setCheckedToday(true);

      setSpinResult(fakeResult);
      setDailyScore(score);

      setWheelResult({
        score,
        label: `${score}分`,
        spinId: nextSpinId
      });

      setCombo((prev) => prev + 1);
      setTodaySpinCount((prev) => prev + 1);

      setPendingRewardSpinId(nextSpinId);
    } catch (err) {
      alert('测试抽奖失败');
      setSpinLoading(false);
    }
  }

  async function handleRecharge(packageId) {
    if (token === 'test-token') {
      const energyMap = {
        1: 10,
        2: 80,
        3: 300
      };

      const nameMap = {
        1: '体验包 8.8',
        2: '推荐包 58.8',
        3: '高能包 188'
      };

      const addEnergy = energyMap[packageId] || 0;

      setWallet((prev) => {
        const beforeEnergy = prev?.energy_balance ?? 100;
        const nextWallet = {
          points_balance: prev?.points_balance ?? 1000,
          energy_balance: beforeEnergy + addEnergy
        };

        alert(`充值成功：${nameMap[packageId]}\n能量值：${beforeEnergy} → ${nextWallet.energy_balance}`);
        return nextWallet;
      });

      return;
    }

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
    } catch (err) {
      alert(err?.response?.data?.message || '充值失败');
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

  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 480;

  const outerCorner = isMobile ? 18 : 24;
  const cornerSize = 240;
  const cornerOffset = 10;
  const wheelVisualSize = isMobile ? Math.min(windowWidth - 24, 340) : 720;

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr',
    gap: 10,
    alignItems: 'stretch'
  };
const centerWheelWrap = {
  position: isMobile ? 'relative' : 'absolute',
  top: isMobile ? 'auto' : '50%',
  left: isMobile ? 'auto' : '50%',
  transform: isMobile ? 'none' : 'translate(-50%, -50%)',
  zIndex: 4,
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

  const pageShell = {
    minHeight: '100vh',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: isMobile ? 8 : 10
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
  zIndex: 3,
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
    left: 6
  };

  const actionCard = {
    ...cornerCard,
    top: 10,
    right: 6
  };

  const walletCard = {
    ...cornerCard,
    left: 6,
    bottom: 10
  };

  const rechargeCard = {
    ...cornerCard,
    right: 6,
    bottom: 10
  };

  return (
    <div className="cosmic-ui">
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
      <div className="glass-panel panel-top-left" style={titleCard}>
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
                paddingLeft: 2
              }}
            >
              <div>每日状态检测</div>
              <div>能量补给</div>
              <div>行动驱动</div>
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
            textAlign: 'left',
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
            连续测试次数：{combo}
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
      <div className="wheel-wrapper">
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
          padding: 14
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
          <div
            style={{
              background: 'rgba(255,255,255,0.30)',
              borderRadius: 12,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.28)',
              fontWeight: 'bold',
              color: '#4b2a67'
            }}
          >
            课程目录
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.30)',
              borderRadius: 12,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.28)',
              fontWeight: 'bold',
              color: '#4b2a67'
            }}
          >
            学习分享
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.30)',
              borderRadius: 12,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.28)',
              fontWeight: 'bold',
              color: '#4b2a67'
            }}
          >
            在线答疑
          </div>
        </div>
      </div>

      <div className="glass-panel panel-bottom-right" style={rechargeCard}>
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
            快速充值
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
            onClick={() => handleRecharge(1)}
            className="cosmic-btn"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.22)',
              fontWeight: 'bold',
              fontSize: 13,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.36)',
              color: '#4b2a67'
            }}
          >
            体验包 8.8
          </button>

          <button
            onClick={() => handleRecharge(2)}
            className="cosmic-btn recharge-hot"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.22)',
              fontWeight: 'bold',
              fontSize: 13,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(250,173,20,0.92), rgba(183,110,255,0.88))',
              color: '#fff',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.18)'
            }}
          >
            推荐包 58.8
          </button>

          <button
            onClick={() => handleRecharge(3)}
            className="cosmic-btn"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.22)',
              fontWeight: 'bold',
              fontSize: 13,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(191,137,255,0.96), rgba(123,44,191,0.92))',
              color: '#fff'
            }}
          >
            高能包 188
          </button>

          <div
            className="panel-text"
            style={{
              marginTop: 2,
              fontSize: 11,
              lineHeight: 1.6,
              color: '#6b4b8b'
            }}
          >
            能量越充足，越适合持续检测与冲击高状态表现。
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
    width: 240,
    height: 'auto',
    minHeight: 0,
    padding: 14
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
        gap: 8
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.26)',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.24)',
          fontWeight: 'bold',
          color: '#4b2a67'
        }}
      >
        每日状态检测
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.26)',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.24)',
          fontWeight: 'bold',
          color: '#4b2a67'
        }}
      >
        能量补给
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.26)',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.24)',
          fontWeight: 'bold',
          color: '#4b2a67'
        }}
      >
        行动驱动
      </div>
    </div>
  </div>
</div>

<div
  className="glass-panel panel-bottom-left"
  style={{
    ...walletCard,
    width: 240,
    height: 'auto',
    minHeight: 0,
    padding: 14
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
      gap: 8
    }}
  >
    <div
      style={{
        background: 'rgba(255,255,255,0.26)',
        borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.24)',
        fontWeight: 'bold',
        color: '#4b2a67',
        fontSize: 14,
        lineHeight: 1.3
      }}
    >
      课程目录
    </div>

    <div
      style={{
        background: 'rgba(255,255,255,0.26)',
        borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.24)',
        fontWeight: 'bold',
        color: '#4b2a67',
        fontSize: 14,
        lineHeight: 1.3
      }}
    >
      学习分享
    </div>

    <div
      style={{
        background: 'rgba(255,255,255,0.26)',
        borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.24)',
        fontWeight: 'bold',
        color: '#4b2a67',
        fontSize: 14,
        lineHeight: 1.3
      }}
    >
      在线答疑
    </div>
  </div>
</div>  

  <div
  className="glass-panel panel-top-right"
  style={{
    ...actionCard,
    height: 'auto',
    minHeight: 0,
    padding: 12,      // ← 改这里（从14变12）
    width: isMobile ? '100%' : 240,
    lineHeight: 1.6   // ← 在这里新增
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
      textAlign: 'left',
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
      连续测试次数：{combo}
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
</div>                
</div>
</div>

                <div className="glass-panel panel-bottom-right" style={rechargeCard}>
                  <div>
                    <h3
                      className="panel-title"
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        color: '#2f1b45',
                        fontSize: 18,
                        fontWeight: 'bold'
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
                      flex: 1
                    }}
                  >
                    <button
                      onClick={() => handleRecharge(1)}
                      className="cosmic-btn"
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.22)',
                        fontWeight: 'bold',
                        fontSize: 14,
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.36)',
                        color: '#4b2a67'
                      }}
                    >
                      体验包 8.8
                    </button>

                    <button
                      onClick={() => handleRecharge(2)}
                      className="cosmic-btn recharge-hot"
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.22)',
                        fontWeight: 'bold',
                        fontSize: 14,
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(250,173,20,0.92), rgba(183,110,255,0.88))',
                        color: '#fff',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.18)'
                      }}
                    >
                      推荐包 58.8
                    </button>

                    <button
                      onClick={() => handleRecharge(3)}
                      className="cosmic-btn"
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.22)',
                        fontWeight: 'bold',
                        fontSize: 14,
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(191,137,255,0.96), rgba(123,44,191,0.92))',
                        color: '#fff'
                      }}
                    >
                      高能包 188
                    </button>

                    <div
                      className="panel-text"
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: '#6b4b8b'
                      }}
                    >
                      能量越充足，越适合持续检测与冲击高状态表现。
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
                  <div className="wheel-wrapper">
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
                    onClick={async () => {
                      await handleLogin();
                      setShowLoginModal(false);
                    }}
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
      className="glass-panel"
      style={{
        width: 420,
        maxWidth: '92vw',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,236,255,0.86))',
        color: '#2f1b45',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 24px 60px rgba(80,42,120,0.18)',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.38)'
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
        💬 再往前一步，今天就可能出结果。
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
                推荐先使用 58.8 推荐包，再继续检测，更容易冲击高状态结果。
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