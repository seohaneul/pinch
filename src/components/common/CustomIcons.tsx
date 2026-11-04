/**
 * Pinchi Custom Icon Set
 *
 * 스타일 규칙 ("Soft Mono"):
 *  - 단색(한 가지 색)만 사용한다.
 *  - 기본 상태: 둥근 2px 외곽선 + 같은 색의 은은한 면 채움(20% 불투명도)
 *  - `fill` prop 전달 시(활성/선택 상태): 면이 솔리드로 채워지고 내부 디테일은 흰색으로 반전
 *  - 모서리/끝은 모두 round 처리하여 여행 앱의 부드럽고 친근한 톤 유지
 *
 * 사용법은 기존 lucide 아이콘과 동일: <MapPin size={20} color="#1B2A4A" fill="#1B2A4A" />
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse, G, SvgProps } from 'react-native-svg';

export interface IconProps extends Omit<SvgProps, 'color'> {
  size?: number | string;
  color?: any;
  strokeWidth?: number | string;
  fill?: any;
  style?: any;
  className?: string;
}

const DEFAULT_COLOR = '#2B2D42';
const TINT_OPACITY = 0.2;

interface Kit {
  c: string;
  sw: number;
  solid: boolean;
  tint: string;
  tintOpacity: number;
  inner: string;
}

const isWhite = (v: any) =>
  typeof v === 'string' && ['#fff', '#ffffff', 'white'].includes(v.toLowerCase());

/** 면(바디): 은은한 채움 + 외곽선 */
const b = (k: Kit) => ({
  fill: k.tint,
  fillOpacity: k.tintOpacity,
  stroke: k.c,
  strokeWidth: k.sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** 선: onBody=true 이면 솔리드 상태에서 흰색으로 반전되는 내부 디테일 */
const l = (k: Kit, onBody = false) => ({
  fill: 'none',
  stroke: onBody ? k.inner : k.c,
  strokeWidth: k.sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** 점(채움 전용) */
const d = (k: Kit, onBody = false) => ({ fill: onBody ? k.inner : k.c });

/** 외곽선 없이 면만 */
const t = (k: Kit) => ({ fill: k.tint, fillOpacity: k.tintOpacity });

function makeIcon(name: string, draw: (k: Kit) => React.ReactNode): React.FC<IconProps> {
  const Icon: React.FC<IconProps> = ({
    size = 20,
    color = DEFAULT_COLOR,
    strokeWidth = 2,
    fill = 'none',
    style,
    className: _className,
    ...rest
  }) => {
    const solid = !!fill && fill !== 'none' && fill !== 'transparent';
    const kit: Kit = {
      c: color,
      sw: Number(strokeWidth),
      solid,
      tint: solid ? fill : color,
      tintOpacity: solid ? 1 : TINT_OPACITY,
      inner: solid ? (isWhite(fill) ? 'rgba(0,0,0,0.22)' : '#FFFFFF') : color,
    };
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
        {draw(kit)}
      </Svg>
    );
  };
  Icon.displayName = name;
  return Icon;
}

// ==============================================================================
// 1. 탭 & 브랜드
// ==============================================================================

export const Compass = makeIcon('Compass', (k) => (
  <>
    <Circle cx="12" cy="12" r="9" {...b(k)} />
    <G transform="rotate(40 12 12)">
      <Path d="M12 6.2l2.3 5.8H9.7z" {...d(k, true)} />
      <Path d="M12 17.8l2.3-5.8H9.7z" {...l(k, true)} strokeWidth={k.sw * 0.75} />
    </G>
  </>
));

export const Bookmark = makeIcon('Bookmark', (k) => (
  <>
    <Path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V20.2l-6-3.9-6 3.9z" {...b(k)} />
    <Circle cx="12" cy="9" r="1.6" {...d(k, true)} />
  </>
));

export const MapPin = makeIcon('MapPin', (k) => (
  <>
    <Path d="M12 19.8S5.5 14.4 5.5 9.5a6.5 6.5 0 0 1 13 0c0 4.9-6.5 10.3-6.5 10.3z" {...b(k)} />
    <Circle cx="12" cy="9.5" r="2.3" {...l(k, true)} />
    <Path d="M9.5 22.2h5" {...l(k)} />
  </>
));

export const Wallet = makeIcon('Wallet', (k) => (
  <>
    <Path d="M5.5 6.2l9.3-2.9a1.6 1.6 0 0 1 2 1.1l.5 1.8" {...l(k)} />
    <Rect x="3" y="6.2" width="18" height="14" rx="3.5" {...b(k)} />
    <Rect x="14.5" y="10.9" width="6.5" height="4.6" rx="2.3" {...l(k, true)} />
    <Circle cx="17" cy="13.2" r="0.9" {...d(k, true)} />
  </>
));

export const User = makeIcon('User', (k) => (
  <>
    <Circle cx="12" cy="8" r="3.8" {...b(k)} />
    <Path d="M4.6 20.2c.7-3.8 3.7-5.8 7.4-5.8s6.7 2 7.4 5.8a.9.9 0 0 1-.9 1H5.5a.9.9 0 0 1-.9-1z" {...b(k)} />
  </>
));

export const Users = makeIcon('Users', (k) => (
  <>
    <Path d="M15.6 5.2a3.2 3.2 0 0 1 0 6.2" {...l(k)} />
    <Path d="M17.6 14.8c2.1.6 3.5 2.2 3.9 4.5" {...l(k)} />
    <Circle cx="9" cy="8.5" r="3.3" {...b(k)} />
    <Path d="M2.6 19.9c.6-3.3 3.1-5.1 6.4-5.1s5.8 1.8 6.4 5.1a.8.8 0 0 1-.8.9H3.4a.8.8 0 0 1-.8-.9z" {...b(k)} />
  </>
));

// ==============================================================================
// 2. 장소 & 카테고리
// ==============================================================================

export const Home = makeIcon('Home', (k) => (
  <>
    <Path d="M16.5 7.4V4.6" {...l(k)} />
    <Path d="M4 10.6 12 4l8 6.6V18.8a2.2 2.2 0 0 1-2.2 2.2H6.2A2.2 2.2 0 0 1 4 18.8z" {...b(k)} />
    <Path d="M10 21v-4.2a2 2 0 0 1 4 0V21" {...l(k, true)} />
  </>
));

export const Building = makeIcon('Building', (k) => (
  <>
    <Path d="M15 9h2.6A1.4 1.4 0 0 1 19 10.4V21h-4z" {...b(k)} />
    <Rect x="5" y="3" width="10" height="18" rx="2" {...b(k)} />
    {[7, 10.5, 14].map((y) => (
      <React.Fragment key={y}>
        <Circle cx="8.5" cy={y} r="0.95" {...d(k, true)} />
        <Circle cx="11.5" cy={y} r="0.95" {...d(k, true)} />
      </React.Fragment>
    ))}
    <Path d="M3 21h18" {...l(k)} />
  </>
));

export const Hotel = makeIcon('Hotel', (k) => (
  <>
    <Path d="M3 6.5v14M21 18v2.5" {...l(k)} />
    <Path d="M3 12.5h15a3 3 0 0 1 3 3V18H3z" {...b(k)} />
    <Rect x="5.5" y="8.8" width="5" height="3.7" rx="1.6" {...b(k)} />
  </>
));

export const Utensils = makeIcon('Utensils', (k) => (
  <>
    <Path d="M6.5 3v5a2.5 2.5 0 0 0 5 0V3M9 3v4.5M9 10.5V21" {...l(k)} />
    <Path d="M17.2 3c-2.2 1-3.6 3.6-3.6 6.8V13h3.6z" {...b(k)} />
    <Path d="M17.2 13v8" {...l(k)} />
  </>
));

export const Coffee = makeIcon('Coffee', (k) => (
  <>
    <Path d="M8 2.5c-.6.8-.6 1.7 0 2.5M11.5 2.5c-.6.8-.6 1.7 0 2.5" {...l(k)} />
    <Path d="M15.5 10.5H17a2.5 2.5 0 0 1 0 5h-1.8" {...l(k)} />
    <Path d="M4.5 8.5h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" {...b(k)} />
    <Path d="M3.5 22h14" {...l(k)} />
  </>
));

export const Camera = makeIcon('Camera', (k) => (
  <>
    <Path
      d="M3 9a2.5 2.5 0 0 1 2.5-2.5h1.8l1.5-2h6.4l1.5 2h1.8A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"
      {...b(k)}
    />
    <Circle cx="12" cy="13" r="3.3" {...l(k, true)} />
    <Circle cx="17.6" cy="9.6" r="0.9" {...d(k, true)} />
  </>
));

export const ShoppingBag = makeIcon('ShoppingBag', (k) => (
  <>
    <Path d="M5 8h14l-1 11.3a2 2 0 0 1-2 1.7H8a2 2 0 0 1-2-1.7z" {...b(k)} />
    <Path d="M9 11V6.5a3 3 0 0 1 6 0V11" {...l(k, true)} />
  </>
));

export const Sparkles = makeIcon('Sparkles', (k) => (
  <>
    <Path d="M10 3.5c.5 3.6 2 5.1 5.5 5.5-3.5.5-5 2-5.5 5.5-.5-3.5-2-5-5.5-5.5 3.5-.4 5-1.9 5.5-5.5z" {...b(k)} />
    <Path d="M17.5 13c.3 2 1.2 2.9 3 3.2-1.8.3-2.7 1.2-3 3.2-.3-2-1.2-2.9-3-3.2 1.8-.3 2.7-1.2 3-3.2z" {...b(k)} />
    <Circle cx="5.5" cy="18.5" r="1.1" {...d(k)} />
  </>
));

export const Star = makeIcon('Star', (k) => (
  <Path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" {...b(k)} />
));

export const Heart = makeIcon('Heart', (k) => (
  <>
    <Path d="M12 20s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.4 12 20 12 20z" {...b(k)} />
    <Path d="M7.2 9.4a1.9 1.9 0 0 1 1.6-1.5" {...l(k, true)} />
  </>
));

export const Tag = makeIcon('Tag', (k) => (
  <>
    <Path
      d="M3.5 4.8v6.1a2 2 0 0 0 .6 1.4l8.4 8.4a1.8 1.8 0 0 0 2.6 0l5.6-5.6a1.8 1.8 0 0 0 0-2.6L12.3 4.1a2 2 0 0 0-1.4-.6H4.8a1.3 1.3 0 0 0-1.3 1.3z"
      {...b(k)}
    />
    <Circle cx="8" cy="8" r="1.4" {...l(k, true)} />
  </>
));

export const Ticket = makeIcon('Ticket', (k) => (
  <>
    <Path
      d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z"
      {...b(k)}
    />
    <Path d="M14.5 7.8v1.4M14.5 11.3v1.4M14.5 14.8v1.4" {...l(k, true)} />
  </>
));

export const Image = makeIcon('Image', (k) => (
  <>
    <Rect x="3" y="4" width="18" height="16" rx="3" {...b(k)} />
    <Circle cx="8.5" cy="9" r="1.8" {...d(k, true)} />
    <Path d="M3.8 17.5l4.7-4.7 4 4 2.5-2.5 5.2 5" {...l(k, true)} />
  </>
));

export const Globe = makeIcon('Globe', (k) => (
  <>
    <Circle cx="12" cy="12" r="9" {...b(k)} />
    <Path d="M12 3.2c-2.4 2.4-3.7 5.4-3.7 8.8s1.3 6.4 3.7 8.8c2.4-2.4 3.7-5.4 3.7-8.8S14.4 5.6 12 3.2z" {...l(k, true)} />
    <Path d="M3.4 12h17.2" {...l(k, true)} />
  </>
));

export const Map = makeIcon('Map', (k) => (
  <>
    <Path d="M3.5 6.2 9 4l6 2.5 5.5-2.2v13.5L15 20l-6-2.5-5.5 2.2z" {...b(k)} />
    <Path d="M9 4v13.5M15 6.5V20" {...l(k, true)} />
  </>
));

export const Layers = makeIcon('Layers', (k) => (
  <>
    <Path d="M3 12.5l9 5 9-5M3 17l9 5 9-5" {...l(k)} />
    <Path d="M12 3l9 5-9 5-9-5z" {...b(k)} />
  </>
));

export const Navigation = makeIcon('Navigation', (k) => (
  <Path d="M12 3l6.9 17.2a.6.6 0 0 1-.8.8L12 17.6 5.9 21a.6.6 0 0 1-.8-.8z" {...b(k)} />
));

// ==============================================================================
// 3. 교통수단
// ==============================================================================

export const Plane = makeIcon('Plane', (k) => (
  <Path
    d="M20.9 4.2c-.7-.7-2-.6-2.9.3L14.5 8 5.8 5.6 4 7.4l7 4.3-3.3 3.3H5.2L4 16.2l3.3 1.5 1.5 3.3 1.2-1.2v-2.5l3.3-3.3 4.3 7 1.8-1.8L17 10.5l3.5-3.6c.9-.9 1.1-2 .4-2.7z"
    {...b(k)}
  />
));

export const Train = makeIcon('Train', (k) => (
  <>
    <Path d="M8 17l-2.5 4M16 17l2.5 4" {...l(k)} />
    <Rect x="5" y="3" width="14" height="14" rx="4" {...b(k)} />
    <Rect x="7.5" y="6" width="9" height="4.5" rx="1.5" {...l(k, true)} />
    <Circle cx="8.8" cy="13.5" r="1" {...d(k, true)} />
    <Circle cx="15.2" cy="13.5" r="1" {...d(k, true)} />
  </>
));

export const Bus = makeIcon('Bus', (k) => (
  <>
    <Path d="M7 18.5v2M17 18.5v2" {...l(k)} />
    <Rect x="4" y="3.5" width="16" height="15" rx="3.5" {...b(k)} />
    <Path d="M4.5 11h15M8.5 6.5h7" {...l(k, true)} />
    <Circle cx="7.6" cy="15" r="1" {...d(k, true)} />
    <Circle cx="16.4" cy="15" r="1" {...d(k, true)} />
  </>
));

export const Car = makeIcon('Car', (k) => (
  <>
    <Path
      d="M3 15.5v-2.3a2 2 0 0 1 .6-1.4l2-2 1.6-3.4A2 2 0 0 1 9 5.3h6a2 2 0 0 1 1.8 1.1l1.6 3.4 2 2a2 2 0 0 1 .6 1.4v2.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5z"
      {...b(k)}
    />
    <Path d="M6.5 10h11" {...l(k, true)} />
    <Circle cx="7.5" cy="17.5" r="1.9" {...b(k)} />
    <Circle cx="16.5" cy="17.5" r="1.9" {...b(k)} />
  </>
));

export const Bike = makeIcon('Bike', (k) => (
  <>
    <Circle cx="6" cy="16.5" r="3.5" {...b(k)} />
    <Circle cx="18" cy="16.5" r="3.5" {...b(k)} />
    <Path d="M6 16.5 9.5 9h5.5l3 7.5M9.5 9l3.2 7.5H6M8 6.5h3M15 9l-1-3h2.5" {...l(k)} />
  </>
));

export const Ship = makeIcon('Ship', (k) => (
  <>
    <Path d="M12 8.5V4.5h3" {...l(k)} />
    <Rect x="7" y="8.5" width="10" height="5.5" rx="1.5" {...b(k)} />
    <Path d="M3 14h18l-2.2 4.6a2 2 0 0 1-1.8 1.2H7a2 2 0 0 1-1.8-1.2z" {...b(k)} />
    <Path d="M4 22.2c1.3 0 1.3-.8 2.7-.8s1.3.8 2.6.8 1.3-.8 2.7-.8 1.3.8 2.6.8 1.3-.8 2.7-.8 1.3.8 2.7.8" {...l(k)} />
  </>
));

export const Footprints = makeIcon('Footprints', (k) => (
  <>
    <Ellipse cx="8" cy="8" rx="2.8" ry="4.3" {...b(k)} />
    <Rect x="6" y="13.8" width="4" height="3" rx="1.5" {...b(k)} />
    <Ellipse cx="16" cy="11.5" rx="2.8" ry="4.3" {...b(k)} />
    <Rect x="14" y="17.3" width="4" height="3" rx="1.5" {...b(k)} />
  </>
));

// ==============================================================================
// 4. 일정 & 시간
// ==============================================================================

export const Calendar = makeIcon('Calendar', (k) => (
  <>
    <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...b(k)} />
    <Path d="M3.5 10h17" {...l(k, true)} />
    <Path d="M8 3v4M16 3v4" {...l(k)} />
    <Circle cx="8" cy="14" r="1" {...d(k, true)} />
    <Circle cx="12" cy="14" r="1" {...d(k, true)} />
    <Circle cx="16" cy="14" r="1" {...d(k, true)} />
    <Circle cx="8" cy="17.2" r="1" {...d(k, true)} />
  </>
));

export const Clock = makeIcon('Clock', (k) => (
  <>
    <Circle cx="12" cy="12" r="9" {...b(k)} />
    <Path d="M12 7.5V12l3 2" {...l(k, true)} />
  </>
));

// ==============================================================================
// 5. 돈 & 가계부
// ==============================================================================

export const Coins = makeIcon('Coins', (k) => (
  <>
    <Circle cx="15" cy="9" r="5.5" {...b(k)} />
    <Circle cx="9" cy="15" r="5.5" {...b(k)} />
    <Path d="M9 12.8v4.4" {...l(k, true)} />
  </>
));

export const DollarSign = makeIcon('DollarSign', (k) => (
  <>
    <Circle cx="12" cy="12" r="9" {...b(k)} />
    <Path
      d="M14.5 9.2c-.4-1-1.4-1.6-2.5-1.6-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2.1 2.6.9 2.6 2.1-1.1 2.1-2.6 2.1c-1.2 0-2.2-.6-2.6-1.6M12 6v1.6M12 16.4V18"
      {...l(k, true)}
      strokeWidth={k.sw * 0.85}
    />
  </>
));

export const Receipt = makeIcon('Receipt', (k) => (
  <>
    <Path d="M5.5 3h13v18l-2.2-1.5-2.2 1.5-2.1-1.5L9.9 21l-2.2-1.5L5.5 21z" {...b(k)} />
    <Path d="M9 8h6M9 11.5h6M9 15h3.5" {...l(k, true)} />
  </>
));

export const PieChart = makeIcon('PieChart', (k) => (
  <>
    <Circle cx="11" cy="13" r="8" {...b(k)} />
    <Path d="M14 2.5V10h7.5A7.5 7.5 0 0 0 14 2.5z" {...b(k)} />
  </>
));

// ==============================================================================
// 6. 상태 & 피드백
// ==============================================================================

export const Check = makeIcon('Check', (k) => <Path d="M5 12.5l4.5 4.5L19 7.5" {...l(k)} />);

export const CheckCircle = makeIcon('CheckCircle', (k) => (
  <>
    <Circle cx="12" cy="12" r="9" {...b(k)} />
    <Path d="M8 12.3l2.8 2.8 5.4-5.6" {...l(k, true)} />
  </>
));

export const CheckCircle2 = CheckCircle;

export const Info = makeIcon('Info', (k) => (
  <>
    <Circle cx="12" cy="12" r="9" {...b(k)} />
    <Path d="M12 11v5.5" {...l(k, true)} />
    <Circle cx="12" cy="7.8" r="1.1" {...d(k, true)} />
  </>
));

export const Shield = makeIcon('Shield', (k) => (
  <Path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" {...b(k)} />
));

export const ShieldCheck = makeIcon('ShieldCheck', (k) => (
  <>
    <Path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" {...b(k)} />
    <Path d="M9 12l2.2 2.2L15.5 10" {...l(k, true)} />
  </>
));

export const Lock = makeIcon('Lock', (k) => (
  <>
    <Path d="M8 10V7.5a4 4 0 0 1 8 0V10" {...l(k)} />
    <Rect x="4.5" y="10" width="15" height="11" rx="3" {...b(k)} />
    <Path d="M12 14.5V17" {...l(k, true)} />
  </>
));

export const KeyRound = makeIcon('KeyRound', (k) => (
  <>
    <Path d="M12 12l8-8M17 7l2.5 2.5M15 9l1.8 1.8" {...l(k)} />
    <Circle cx="8.5" cy="15.5" r="4.8" {...b(k)} />
    <Circle cx="8.5" cy="15.5" r="1.4" {...l(k, true)} />
  </>
));

export const Zap = makeIcon('Zap', (k) => <Path d="M13.5 2.5 4.5 13.5h7l-1 8 9-11h-7z" {...b(k)} />);

export const Cloud = makeIcon('Cloud', (k) => (
  <Path d="M7 19a4.5 4.5 0 0 1-.8-8.9A6 6 0 0 1 17.6 9a5.1 5.1 0 0 1-.1 10z" {...b(k)} />
));

export const DownloadCloud = makeIcon('DownloadCloud', (k) => (
  <>
    <Path d="M7 19a4.5 4.5 0 0 1-.8-8.9A6 6 0 0 1 17.6 9a5.1 5.1 0 0 1-.1 10z" {...b(k)} />
    <Path d="M12 11.5V17M9.5 14.5 12 17l2.5-2.5" {...l(k, true)} />
  </>
));

export const UploadCloud = makeIcon('UploadCloud', (k) => (
  <>
    <Path d="M7 19a4.5 4.5 0 0 1-.8-8.9A6 6 0 0 1 17.6 9a5.1 5.1 0 0 1-.1 10z" {...b(k)} />
    <Path d="M12 17v-5.5M9.5 14 12 11.5l2.5 2.5" {...l(k, true)} />
  </>
));

export const Database = makeIcon('Database', (k) => (
  <>
    <Path d="M4.5 6c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3v12c0 1.7-3.4 3-7.5 3s-7.5-1.3-7.5-3z" {...b(k)} />
    <Path d="M4.5 6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" {...l(k, true)} />
  </>
));

// ==============================================================================
// 7. 문서 & 커뮤니케이션
// ==============================================================================

export const Clipboard = makeIcon('Clipboard', (k) => (
  <>
    <Rect x="5" y="4.5" width="14" height="17" rx="2.5" {...b(k)} />
    <Rect x="8.5" y="2.5" width="7" height="4" rx="1.5" {...b(k)} />
    <Path d="M9 11h6M9 15h4" {...l(k, true)} />
  </>
));

export const ClipboardPaste = makeIcon('ClipboardPaste', (k) => (
  <>
    <Rect x="5" y="4.5" width="14" height="17" rx="2.5" {...b(k)} />
    <Rect x="8.5" y="2.5" width="7" height="4" rx="1.5" {...b(k)} />
    <Path d="M12 10v6.5M9.5 14l2.5 2.5 2.5-2.5" {...l(k, true)} />
  </>
));

export const Copy = makeIcon('Copy', (k) => (
  <>
    <Path d="M15 5.5V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h.5" {...l(k)} />
    <Rect x="8.5" y="8.5" width="12" height="12" rx="2.5" {...b(k)} />
  </>
));

export const FileText = makeIcon('FileText', (k) => (
  <>
    <Path d="M14 3H7a2.5 2.5 0 0 0-2.5 2.5v13A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V8.5z" {...b(k)} />
    <Path d="M14 3v5.5h5.5M8.5 13h7M8.5 16.5H13" {...l(k, true)} />
  </>
));

export const Edit3 = makeIcon('Edit3', (k) => (
  <>
    <Path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8.5 17.5 4.5 19l1.5-4z" {...b(k)} />
    <Path d="M13.5 6.5l3 3" {...l(k, true)} />
    <Path d="M12.5 20.5H20" {...l(k)} />
  </>
));

export const Mail = makeIcon('Mail', (k) => (
  <>
    <Rect x="3" y="5" width="18" height="14" rx="3" {...b(k)} />
    <Path d="M3.8 7 12 13l8.2-6" {...l(k, true)} />
  </>
));

export const Phone = makeIcon('Phone', (k) => (
  <Path
    d="M8.5 3.5H6A2 2 0 0 0 4 5.6C4.4 13.6 10.4 19.6 18.4 20a2 2 0 0 0 2.1-2v-2.5a1.5 1.5 0 0 0-1.1-1.4l-2.8-.8a1.5 1.5 0 0 0-1.5.4l-1.2 1.2a12 12 0 0 1-4.9-4.9l1.2-1.2a1.5 1.5 0 0 0 .4-1.5l-.8-2.8A1.5 1.5 0 0 0 8.5 3.5z"
    {...b(k)}
  />
));

export const MessageSquareQuote = makeIcon('MessageSquareQuote', (k) => (
  <>
    <Path
      d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V14a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4.2A2.5 2.5 0 0 1 4 14z"
      {...b(k)}
    />
    <Path d="M9.5 8.3v2.4c0 1-.5 1.7-1.3 2M15 8.3v2.4c0 1-.5 1.7-1.3 2" {...l(k, true)} />
  </>
));

export const Link = makeIcon('Link', (k) => (
  <G transform="rotate(-45 12 12)">
    <Rect x="2.5" y="8.5" width="10.5" height="7" rx="3.5" {...l(k)} />
    <Rect x="11" y="8.5" width="10.5" height="7" rx="3.5" {...l(k)} />
  </G>
));

export const ExternalLink = makeIcon('ExternalLink', (k) => (
  <>
    <Rect x="3.5" y="6" width="14.5" height="14.5" rx="2.5" {...t(k)} />
    <Path d="M18 13.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8.5A2.5 2.5 0 0 1 6 6h4.5" {...l(k)} />
    <Path d="M14 3.5h6.5V10M20.5 3.5 11 13" {...l(k)} />
  </>
));

export const Share2 = makeIcon('Share2', (k) => (
  <>
    <Path d="M8.5 10.7l7-3.9M8.5 13.3l7 3.9" {...l(k)} />
    <Circle cx="18" cy="5.5" r="2.8" {...b(k)} />
    <Circle cx="6" cy="12" r="2.8" {...b(k)} />
    <Circle cx="18" cy="18.5" r="2.8" {...b(k)} />
  </>
));

export const LogOut = makeIcon('LogOut', (k) => (
  <>
    <Rect x="4" y="3.5" width="6.5" height="17" rx="2.5" {...t(k)} />
    <Path d="M10 20.5H6.5A2.5 2.5 0 0 1 4 18V6a2.5 2.5 0 0 1 2.5-2.5H10" {...l(k)} />
    <Path d="M10 12h10.5M16.5 8l4 4-4 4" {...l(k)} />
  </>
));

// ==============================================================================
// 8. 컨트롤 & 액션
// ==============================================================================

export const Search = makeIcon('Search', (k) => (
  <>
    <Path d="M15.5 15.5l5 5" {...l(k)} />
    <Circle cx="10.5" cy="10.5" r="6.5" {...b(k)} />
    <Path d="M7.8 9.2a3 3 0 0 1 2.2-1.6" {...l(k, true)} />
  </>
));

export const Filter = makeIcon('Filter', (k) => <Path d="M3.5 4.5h17l-6.5 8v6l-4 2.5v-8.5z" {...b(k)} />);

export const Sliders = makeIcon('Sliders', (k) => (
  <>
    <Path d="M4 7h16M4 17h16" {...l(k)} />
    <Circle cx="9" cy="7" r="2.6" {...b(k)} />
    <Circle cx="15" cy="17" r="2.6" {...b(k)} />
  </>
));

export const Trash2 = makeIcon('Trash2', (k) => (
  <>
    <Path d="M3.5 6.5h17M9 6.5v-2A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5v2" {...l(k)} />
    <Path d="M5.5 6.5h13l-.9 12.6a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9z" {...b(k)} />
    <Path d="M10 10.5v6M14 10.5v6" {...l(k, true)} />
  </>
));

export const Plus = makeIcon('Plus', (k) => <Path d="M12 5v14M5 12h14" {...l(k)} />);

export const X = makeIcon('X', (k) => <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...l(k)} />);

export const Maximize2 = makeIcon('Maximize2', (k) => (
  <Path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" {...l(k)} />
));

export const Minimize2 = makeIcon('Minimize2', (k) => (
  <Path d="M4 14h6v6M20 10h-6V4M10 14l-6.5 6.5M14 10l6.5-6.5" {...l(k)} />
));

export const RefreshCw = makeIcon('RefreshCw', (k) => (
  <Path
    d="M20 11.5A8 8 0 0 0 6 6.6L4 8.5M4 4v4.5h4.5M4 12.5a8 8 0 0 0 14 4.9l2-1.9M20 20v-4.5h-4.5"
    {...l(k)}
  />
));

export const RotateCcw = makeIcon('RotateCcw', (k) => (
  <Path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5" {...l(k)} />
));

export const RotateCw = makeIcon('RotateCw', (k) => (
  <Path d="M20 12a8 8 0 1 1-2.4-5.7L20 8.5M20 4v4.5h-4.5" {...l(k)} />
));

// ==============================================================================
// 9. 방향 (Chevron / Arrow)
// ==============================================================================

export const ChevronDown = makeIcon('ChevronDown', (k) => <Path d="M6.5 9.5 12 15l5.5-5.5" {...l(k)} />);
export const ChevronUp = makeIcon('ChevronUp', (k) => <Path d="M6.5 14.5 12 9l5.5 5.5" {...l(k)} />);
export const ChevronLeft = makeIcon('ChevronLeft', (k) => <Path d="M14.5 6.5 9 12l5.5 5.5" {...l(k)} />);
export const ChevronRight = makeIcon('ChevronRight', (k) => <Path d="M9.5 6.5 15 12l-5.5 5.5" {...l(k)} />);

export const ArrowRight = makeIcon('ArrowRight', (k) => <Path d="M4.5 12h15M13.5 6l6 6-6 6" {...l(k)} />);
export const ArrowUpRight = makeIcon('ArrowUpRight', (k) => <Path d="M7 17 17 7M8.5 7H17v8.5" {...l(k)} />);
export const ArrowDownRight = makeIcon('ArrowDownRight', (k) => <Path d="M7 7l10 10M17 8.5V17H8.5" {...l(k)} />);
export const ArrowUpDown = makeIcon('ArrowUpDown', (k) => (
  <Path d="M7.5 4v16M4 7.5 7.5 4 11 7.5M16.5 20V4M13 16.5l3.5 3.5 3.5-3.5" {...l(k)} />
));
export const MoveUp = makeIcon('MoveUp', (k) => <Path d="M12 20V4M8 8l4-4 4 4" {...l(k)} />);
export const MoveDown = makeIcon('MoveDown', (k) => <Path d="M12 4v16M8 16l4 4 4-4" {...l(k)} />);
