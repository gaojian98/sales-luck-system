import { useEffect, useMemo, useRef, useState } from 'react';

const rewards = Array.from({ length: 81 }, (_, i) => {
  const score = i + 20;
  return {
    label: `${score}分`,
    score
  };
});

function getRewardIndex(result) {
  const index = rewards.findIndex((item) => item.score === result.score);
  return index >= 0 ? index : 0;
}

export default function LotteryWheel({
  onSpin,
  spinning = false,
  result = null,
  onSpinEnd
}) {
  const canvasRef = useRef(null);
  const displayAngleRef = useRef(0);
  const tickAudioRef = useRef(null);
  const rafRef = useRef(null);
  const wrapRef = useRef(null);
  const tickAudioPoolRef = useRef([]);
  const [displayAngle, setDisplayAngle] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [pointerOffset, setPointerOffset] = useState(0);
  const [wheelSize, setWheelSize] = useState(620);
  const [illusionActive, setIllusionActive] = useState(false);
  const [illusionStrength, setIllusionStrength] = useState(0);

  const isSpinning = spinning || animating;
  const START_SCORE = 100;

  useEffect(() => {
    function updateWheelSize() {
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      let nextSize;

      if (viewportW <= 480) {
        nextSize = Math.min(viewportW - 32, 320);
      } else if (viewportW <= 768) {
        nextSize = Math.min(viewportW - 48, 420);
      } else if (viewportW <= 1024) {
        nextSize = Math.min(viewportW * 0.52, viewportH * 0.58, 520);
      } else {
        nextSize = Math.min(viewportW * 0.5, viewportH * 0.7, 620);
      }

      setWheelSize(Math.max(260, Math.floor(nextSize)));
    }

    updateWheelSize();
    window.addEventListener('resize', updateWheelSize);
    return () => window.removeEventListener('resize', updateWheelSize);
  }, []);

  const layout = useMemo(() => {
    const size = wheelSize;
    const center = size / 2;
    const radius = size * 0.47;
    const outerGlow = size * 0.49;
    const outerBase = size * 0.484;
    const goldRing = size * 0.468;
    const innerGoldRing = size * 0.455;
    const ringRadius = size * 0.413;
    const arc1 = size * 0.506;
    const arc2 = size * 0.519;

    const stars = [
      { angle: -Math.PI / 2, r: size * 0.5, size: size * 0.0105 },
      { angle: Math.PI * 0.2, r: size * 0.5, size: size * 0.0088 },
      { angle: Math.PI * 0.55, r: size * 0.509, size: size * 0.0100 },
      { angle: Math.PI * 0.95, r: size * 0.503, size: size * 0.0082 },
      { angle: Math.PI * 1.35, r: size * 0.515, size: size * 0.0094 }
    ];

    const centerOuterWhite = size * 0.122;
    const centerButton = size * 0.106;
    const centerGlow = size * 0.119;
    const topHighlightY = size * 0.028;
    const topHighlightR = size * 0.05;

    const pointerTop = size * 0.006;
    const pointerHalfWidth = size * 0.038;
    const pointerHeight = size * 0.064;

    const wrapperWidth = size + 40;
    const wrapperHeight = size + 80;

    const wheelBoxTop = size * 0.064;
    const wheelBoxLeft = 20;
    const wheelBoxSize = size;

    const buttonTop = wheelBoxTop + size / 2;
    const overlayButton = size * 0.225;

    return {
      size,
      center,
      radius,
      outerGlow,
      outerBase,
      goldRing,
      innerGoldRing,
      ringRadius,
      arc1,
      arc2,
      stars,
      centerOuterWhite,
      centerButton,
      centerGlow,
      topHighlightY,
      topHighlightR,
      pointerTop,
      pointerHalfWidth,
      pointerHeight,
      wrapperWidth,
      wrapperHeight,
      wheelBoxTop,
      wheelBoxLeft,
      wheelBoxSize,
      buttonTop,
      overlayButton
    };
  }, [wheelSize]);

  const size = layout.size;

  useEffect(() => {
    drawWheel(displayAngle);
  }, [displayAngle, layout]);

  useEffect(() => {
    drawWheel(0);
  }, [layout]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    tickAudioPoolRef.current = Array.from({ length: 5 }, () => {
      const a = new Audio('/sounds/tick.mp3');
      a.volume = 0.25;
      return a;
    });
  }, []);

  useEffect(() => {
    if (!result) return;
    const rewardIndex = getRewardIndex(result);
    animateToReward(rewardIndex, result.spinId);
  }, [result]);

  function getSegmentColor(score) {
    const ratio = (score - 20) / 80;

    const start = { r: 248, g: 242, b: 255 };
    const mid = { r: 186, g: 120, b: 230 };
    const end = { r: 92, g: 28, b: 155 };

    let r;
    let g;
    let b;

    if (ratio < 0.6) {
      const t = ratio / 0.6;
      r = Math.round(start.r + (mid.r - start.r) * t);
      g = Math.round(start.g + (mid.g - start.g) * t);
      b = Math.round(start.b + (mid.b - start.b) * t);
    } else {
      const t = (ratio - 0.6) / 0.4;
      r = Math.round(mid.r + (end.r - mid.r) * t);
      g = Math.round(mid.g + (end.g - mid.g) * t);
      b = Math.round(mid.b + (end.b - mid.b) * t);
    }

    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawWheel(angleDeg) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const center = layout.center;
    const radius = layout.radius;

    ctx.clearRect(0, 0, size, size);

    const glow = ctx.createRadialGradient(
      center,
      center,
      size * 0.126,
      center,
      center,
      layout.outerGlow
    );
    glow.addColorStop(0, 'rgba(255,255,255,0.00)');
    glow.addColorStop(0.72, 'rgba(171, 94, 255, 0.00)');
    glow.addColorStop(0.92, 'rgba(171, 94, 255, 0.18)');
    glow.addColorStop(1, 'rgba(255,255,255,0.00)');

    ctx.beginPath();
    ctx.arc(center, center, layout.outerGlow, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
ctx.arc(center, center, layout.outerBase, 0, Math.PI * 2);
ctx.fillStyle = '#3a2a6a';
ctx.fill();

    // ===== 外层主紫色能量环 =====
const pulse = isSpinning
  ? 0.78 + 0.22 * Math.sin(Date.now() / 110)
  : 0.72;

// 第一层：外层亮紫环
ctx.beginPath();
ctx.arc(center, center, layout.goldRing, 0, Math.PI * 2);
ctx.strokeStyle = `rgba(196, 132, 252, ${pulse})`;
ctx.lineWidth = Math.max(6, size * 0.012);
ctx.shadowColor = `rgba(196, 132, 252, ${pulse})`;
ctx.shadowBlur = isSpinning ? 28 + 14 * pulse : 18;
ctx.stroke();

// 第二层：内层白紫高光环
ctx.beginPath();
ctx.arc(center, center, layout.goldRing - Math.max(6, size * 0.01), 0, Math.PI * 2);
ctx.strokeStyle = `rgba(255, 240, 255, ${0.85 * pulse})`;
ctx.lineWidth = Math.max(2.5, size * 0.0045);
ctx.shadowColor = `rgba(255, 255, 255, ${0.55 * pulse})`;
ctx.shadowBlur = isSpinning ? 14 + 8 * pulse : 8;
ctx.stroke();

// 第三层：外扩柔光
ctx.beginPath();
ctx.arc(center, center, layout.goldRing + Math.max(8, size * 0.014), 0, Math.PI * 2);
ctx.strokeStyle = `rgba(168, 85, 247, ${0.28 * pulse})`;
ctx.lineWidth = Math.max(12, size * 0.02);
ctx.shadowColor = `rgba(168, 85, 247, ${0.45 * pulse})`;
ctx.shadowBlur = isSpinning ? 36 + 18 * pulse : 20;
ctx.stroke();

// 画完后清掉阴影，避免影响后面图形
ctx.shadowBlur = 0;
ctx.shadowColor = 'transparent';

    ctx.beginPath();
ctx.arc(center, center, layout.innerGoldRing, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(192,132,252,0.5)';
ctx.lineWidth = Math.max(1.5, size * 0.004);
ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.translate(-center, -center);

    // ===== 标准 Benham's Disk =====

// 白色底盘
ctx.beginPath();
ctx.arc(center, center, radius, 0, Math.PI * 2);
ctx.fillStyle = '#ffffff';
ctx.fill();
// ===== 在白色底盘上直接画黑色短弧线 =====
const benhamArcs = [
  { r: radius * 0.88, start: 0.98 * Math.PI, end: 1.18 * Math.PI, w: 8 },
  { r: radius * 0.80, start: 1.06 * Math.PI, end: 1.28 * Math.PI, w: 8 },
  { r: radius * 0.72, start: 1.14 * Math.PI, end: 1.36 * Math.PI, w: 7 },
  { r: radius * 0.64, start: 1.22 * Math.PI, end: 1.42 * Math.PI, w: 7 },
  { r: radius * 0.56, start: 1.30 * Math.PI, end: 1.48 * Math.PI, w: 6 },
  { r: radius * 0.48, start: 1.38 * Math.PI, end: 1.54 * Math.PI, w: 6 }
];

benhamArcs.forEach((a) => {
  ctx.beginPath();
  ctx.arc(center, center, a.r, a.start, a.end);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = a.w;
  ctx.lineCap = 'butt';
  ctx.stroke();
});

ctx.beginPath();
ctx.moveTo(center, center);
ctx.arc(center, center, radius, -Math.PI / 2, Math.PI / 2, false);
ctx.closePath();

const spaceGradient = ctx.createRadialGradient(
  center,
  center,
  radius * 0.2,
  center,
  center,
  radius
);

spaceGradient.addColorStop(0, '#0a0a1a');   // 深蓝黑
spaceGradient.addColorStop(0.4, '#120a2a'); // 深紫
spaceGradient.addColorStop(0.7, '#1a103a'); // 宇宙紫
spaceGradient.addColorStop(1, '#000000');   // 外圈黑

ctx.fillStyle = spaceGradient;
ctx.fill();
// ===== 星空星点 + 轻微拖尾发光 =====
for (let i = 0; i < 120; i++) {
  const angle = Math.random() * Math.PI; // 只在右半圆
  const dist = radius * (0.3 + Math.random() * 0.9);

  const x = center + Math.cos(angle) * dist;
  const y = center + Math.sin(angle) * dist;

  const starSize = 0.3 + Math.random() * 1.2;

  // 拖尾方向：沿着旋转切线方向
  const tailAngle = angle + Math.PI / 2;
  const tailLen = 4 + Math.random() * 10;

  const tx = x - Math.cos(tailAngle) * tailLen;
  const ty = y - Math.sin(tailAngle) * tailLen;

  // 拖尾
  const tailGradient = ctx.createLinearGradient(x, y, tx, ty);
  tailGradient.addColorStop(0, 'rgba(255,255,255,0.45)');
  tailGradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = tailGradient;
  ctx.lineWidth = starSize;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 星点主体
  ctx.beginPath();
  ctx.arc(x, y, starSize, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.shadowColor = 'rgba(200,180,255,0.8)';
  ctx.shadowBlur = 6;
  ctx.fill();
}

ctx.shadowBlur = 0;
ctx.shadowColor = 'transparent';


    const startArc = -Math.PI * 0.9;
    const endArc = Math.PI * 0.42;
    const totalArc = endArc - startArc;

    for (let i = 0; i < 16; i++) {
      const t1 = i / 16;
      const t2 = (i + 1) / 16;

      const a1 = startArc + totalArc * t1;
      const a2 = startArc + totalArc * t2;

      const alpha = 0.10 + t2 * 0.35;
      const lineWidth = Math.max(1.5, size * (0.0024 + t2 * 0.0072));

      ctx.beginPath();
      ctx.arc(center, center, layout.ringRadius + t2 * (size * 0.016), a1, a2);
      ctx.strokeStyle = `rgba(203, 143, 255, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(center, center, layout.arc1, Math.PI * 0.15, Math.PI * 0.92);
    ctx.strokeStyle = 'rgba(245, 223, 255, 0.55)';
    ctx.lineWidth = Math.max(2, size * 0.0042);
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, layout.arc2, Math.PI * 1.05, Math.PI * 1.7);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
    ctx.lineWidth = Math.max(1.6, size * 0.0029);
    ctx.lineCap = 'round';
    ctx.stroke();

    layout.stars.forEach((s) => {
      const x = center + Math.cos(s.angle) * s.r;
      const y = center + Math.sin(s.angle) * s.r;

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 236, 188, 0.95)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, s.size + size * 0.008, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 236, 188, 0.18)';
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(center, center, layout.centerOuterWhite, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const buttonGradient = ctx.createRadialGradient(
      center - size * 0.022,
      center - size * 0.028,
      size * 0.022,
      center,
      center,
      layout.centerGlow
    );
    buttonGradient.addColorStop(0, '#c77dff');
    buttonGradient.addColorStop(0.45, '#9d4edd');
    buttonGradient.addColorStop(1, '#6a1b9a');

    ctx.beginPath();
    ctx.arc(center, center, layout.centerButton, 0, Math.PI * 2);
    ctx.fillStyle = buttonGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center - layout.topHighlightY, layout.topHighlightR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, layout.centerGlow, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(233, 196, 255, 0.45)';
    ctx.lineWidth = Math.max(2, size * 0.0032);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(18, size * 0.048)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始', center, center);
    ctx.restore();
  }

  function getAngleForScore(score) {
    const segmentAngle = 360 / rewards.length;
    const index = rewards.findIndex((r) => r.score === score);

    if (index < 0) return 0;

    const rewardCenterAngle = index * segmentAngle + segmentAngle / 2;
    const pointerAngle = 270;

    return ((pointerAngle - rewardCenterAngle) % 360 + 360) % 360;
  }

  function resetToStart() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    setAnimating(false);
    setPointerOffset(0);

    const startAngle = getAngleForScore(START_SCORE);
    setDisplayAngle(startAngle);
    displayAngleRef.current = startAngle;
  }

  function animateToReward(rewardIndex, spinId) {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    setAnimating(true);

    const targetScore = rewards[rewardIndex]?.score ?? START_SCORE;
    const startAngle = getAngleForScore(START_SCORE);
    const endAngleBase = getAngleForScore(targetScore);

    const delta = ((endAngleBase - startAngle) % 360 + 360) % 360;
    const extraTurns = 100 + Math.random() * 60;
    const finalTargetAngle = startAngle + extraTurns * 360 + delta;

    const start = performance.now();
    const duration = 7000 + Math.random() * 3000;
    const segmentAngle = 360 / rewards.length;
    let lastTickIndex = -1;

    function easeSpin(t) {
      if (t < 0.12) {
        return Math.pow(t / 0.12, 2) * 0.15;
      }

      if (t < 0.68) {
        return 0.15 + (t - 0.12) * 12;
      }

      const slowT = (t - 0.68) / 0.32;
      return 0.92 + (1 - Math.pow(1 - slowT, 5)) * 0.08;
    }

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeSpin(progress);

      const nextAngle = startAngle + (finalTargetAngle - startAngle) * eased;

      setDisplayAngle(nextAngle);
      displayAngleRef.current = nextAngle;

      if (progress > 0.18 && progress < 0.72) {
        setIllusionActive(true);

        const centerBoost = 1 - Math.abs(progress - 0.45) / 0.27;
        const strength = Math.max(0, Math.min(1, centerBoost));
        setIllusionStrength(strength);
      } else {
        setIllusionStrength(0);
        setIllusionActive(false);
      }

      const normalized = ((nextAngle % 360) + 360) % 360;
      const currentTickIndex = Math.floor(normalized / segmentAngle);

      if (currentTickIndex !== lastTickIndex) {
        lastTickIndex = currentTickIndex;
        playTick();

        setPointerOffset(Math.max(4, layout.size * 0.01));
        setTimeout(() => {
          setPointerOffset(0);
        }, 40);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setDisplayAngle(finalTargetAngle);
        displayAngleRef.current = finalTargetAngle;
        setAnimating(false);
        setPointerOffset(0);

        setIllusionActive(true);
        setIllusionStrength(1);

        setTimeout(() => {
          setIllusionActive(false);
          setIllusionStrength(0);
        }, 220);

        if (typeof onSpinEnd === 'function') {
          onSpinEnd(spinId);
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }

  function playTick() {
    try {
      const pool = tickAudioPoolRef.current;
      const audio = pool.find((a) => a.paused);

      if (audio) {
        audio.currentTime = 0;
        audio.playbackRate = 0.95 + Math.random() * 0.1;
        audio.play();
      }
    } catch (e) {}
  }

  function playMysticSound() {
    const audio = new Audio('/sounds/mystic.mp3');
    audio.volume = 0.6;
    audio.play();
  }

  async function handleClick() {
    if (isSpinning) return;

    resetToStart();

    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      if (typeof onSpin === 'function') {
        await onSpin();
      }
    } catch (err) {
      console.error(err);
      setAnimating(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="wheel-cosmic-container"
      style={{
        position: 'relative',
        width: layout.wrapperWidth,
        height: layout.wrapperHeight,
        maxWidth: '100%'
      }}
    >
      <div className="wheel-outer-glow"></div>
<div className={`wheel-motion-halo ${isSpinning ? 'active' : ''}`}></div>
<div className={`wheel-motion-halo-2 ${isSpinning ? 'active' : ''}`}></div>

      <div className="wheel-inner-orbit"></div>

      <div
  className={`wheel-color-layer ${illusionActive ? 'active' : ''}`}
  style={{
    opacity: illusionActive ? 0.28 + illusionStrength * 0.55 : 0,
    transform: `scale(${1 + illusionStrength * 0.08})`,
    filter: `blur(${8 + illusionStrength * 18}px) saturate(${1.4 + illusionStrength * 1.6}) brightness(${1 + illusionStrength * 0.35})`
  }}
></div>

      <div
        className="wheel-canvas-box"
        style={{
          position: 'absolute',
          top: layout.wheelBoxTop,
          left: layout.wheelBoxLeft,
          width: layout.wheelBoxSize,
          height: layout.wheelBoxSize,
          maxWidth: '100%'
        }}
      >
        <canvas
          ref={canvasRef}
          width={layout.size}
          height={layout.size}
          style={{
            display: 'block',
            width: layout.size,
            height: layout.size,
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: '50%',
            filter: 'drop-shadow(0 0 30px rgba(160,100,255,0.35))'
          }}
        />
      </div>

      <div
        className="wheel-pointer"
        style={{
          position: 'absolute',
          top: layout.pointerTop + pointerOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: `${layout.pointerHalfWidth}px solid transparent`,
          borderRight: `${layout.pointerHalfWidth}px solid transparent`,
          borderTop: `${layout.pointerHeight}px solid #c084fc`,
          zIndex: 6,
          transition: 'top 0.06s ease',
          filter: `
            drop-shadow(0 0 12px rgba(200,140,255,0.9))
            drop-shadow(0 0 28px rgba(160,100,255,0.6))
          `
        }}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isSpinning}
        className="wheel-energy-core"
        style={{
          position: 'absolute',
          top: layout.buttonTop,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: layout.overlayButton,
          height: layout.overlayButton,
          borderRadius: '50%',
          border: 'none',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          zIndex: 7,
          background: 'radial-gradient(circle at 35% 30%, #e9c6ff, #9d4edd 55%, #5a189a)',
          boxShadow: `
            0 0 20px rgba(180,120,255,0.6),
            0 0 60px rgba(140,80,255,0.4),
            inset 0 0 20px rgba(255,255,255,0.3)
          `,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: layout.size * 0.05,
          letterSpacing: '2px'
        }}
      >
        {isSpinning ? '检测中' : '开始'}
      </button>
    </div>
  );
}