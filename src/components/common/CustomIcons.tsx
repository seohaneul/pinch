import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Polyline,
  Polygon,
  Line,
  G,
  SvgProps,
} from 'react-native-svg';

export interface IconProps extends Omit<SvgProps, 'color'> {
  size?: number | string;
  color?: any;
  strokeWidth?: number | string;
  fill?: any;
  style?: any;
  className?: string;
}

const defaultProps = {
  size: 20,
  color: '#2B2D42',
  strokeWidth: 2,
  fill: 'none',
};

// ==============================================================================
// 1. Navigation & Brand Icons
// ==============================================================================

/** 홈: 여행 나침반 & 중심 핀 */
export const Compass: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => {
  const isFilled = fill && fill !== 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
      <Circle
        cx="12"
        cy="12"
        r="9.5"
        stroke={color}
        strokeWidth={strokeWidth}
        fill={isFilled ? color : 'none'}
      />
      {isFilled ? (
        <>
          <Polygon
            points="12,5.5 14.5,12 12,10 9.5,12"
            fill="#FFFFFF"
          />
          <Polygon
            points="12,18.5 14.5,12 12,14 9.5,12"
            fill="#FFFFFF"
            fillOpacity={0.6}
          />
          <Circle cx="12" cy="12" r="1.8" fill={color} />
        </>
      ) : (
        <>
          <Polygon
            points="16.5,7.5 13.5,13.5 7.5,16.5 10.5,10.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.15}
          />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
        </>
      )}
    </Svg>
  );
};

/** 보관함: 소프트 리본 북마크 */
export const Bookmark: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => {
  const isFilled = fill && fill !== 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
      <Path
        d="M19 21l-7-4.5L5 21V5a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 5v16z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? color : 'none'}
      />
      {isFilled && (
        <Circle cx="12" cy="8" r="1.8" fill="#FFFFFF" />
      )}
    </Svg>
  );
};

/** 일정/동선: 부드러운 위치 마커 핀 */
export const MapPin: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => {
  const isFilled = fill && fill !== 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
      <Path
        d="M12 21.5c3.5-4.5 7.5-8.8 7.5-12.5a7.5 7.5 0 1 0-15 0c0 3.7 4 8 7.5 12.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? color : 'none'}
      />
      <Circle
        cx="12"
        cy="9"
        r="2.8"
        stroke={isFilled ? '#FFFFFF' : color}
        strokeWidth={isFilled ? 0 : strokeWidth}
        fill={isFilled ? '#FFFFFF' : 'none'}
      />
    </Svg>
  );
};

/** 가계부: 둥근 폴드 지갑 */
export const Wallet: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => {
  const isFilled = fill && fill !== 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
      <Path
        d="M20 7H4.5A2.5 2.5 0 0 0 2 9.5v8A2.5 2.5 0 0 0 4.5 20H20a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? color : 'none'}
      />
      <Path
        d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill={isFilled ? color : 'none'}
      />
      <Path
        d="M16.5 14.5h5.5v-5h-5.5a2.5 2.5 0 0 0 0 5z"
        stroke={isFilled ? '#FFFFFF' : color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? '#FFFFFF' : 'none'}
      />
      <Circle cx="19" cy="12" r="1" fill={isFilled ? color : color} />
    </Svg>
  );
};

/** 프로필/마이: 아늑한 사용자 실루엣 */
export const User: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => {
  const isFilled = fill && fill !== 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
      <Circle
        cx="12"
        cy="7"
        r="4.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? color : 'none'}
      />
      <Path
        d="M20 21v-1.5a5.5 5.5 0 0 0-5.5-5.5h-5A5.5 5.5 0 0 0 4 19.5V21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? color : 'none'}
      />
    </Svg>
  );
};

/** 멀티 유저: 2인 사용자 */
export const Users: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M16 21v-1.5a4.5 4.5 0 0 0-4.5-4.5H5.5A4.5 4.5 0 0 0 1 19.5V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M23 21v-1.5a4 4 0 0 0-3-3.87" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 스마트 핀치 / AI: 소프트 스타 스파클 */
export const Sparkles: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path
      d="M12 3c0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8 0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill !== 'none' ? fill : 'none'}
    />
    <Path
      d="M19 3c0 1.5-1 2.5-2.5 2.5 1.5 0 2.5 1 2.5 2.5 0-1.5 1-2.5 2.5-2.5-1.5 0-2.5-1-2.5-2.5z"
      fill={color}
    />
  </Svg>
);

// ==============================================================================
// 2. Core Actions & UI Controls
// ==============================================================================

export const Plus: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const X: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Check: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckCircle: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} fill={fill !== 'none' ? fill : 'none'} />
    <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckCircle2: React.FC<IconProps> = CheckCircle;

export const Search: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="11" cy="11" r="7.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.5 20.5L16.2 16.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const Trash2: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const Edit3: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path
      d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 18.5l-4 1 1-4 12.5-12z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Share2: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const Copy: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="9" y="9" width="12" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Clipboard: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="4" y="5" width="16" height="16" rx="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 3h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);

export const ClipboardPaste: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M15 4h1a2 2 0 0 1 2 2v2M8 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M9 3h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <Path d="M12 11h6M12 15h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const Link: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ExternalLink: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RotateCw: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M21 4v5h-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.5 13.5A9 9 0 1 1 18 8l3 1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RotateCcw: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M3 4v5h5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.5 13.5A9 9 0 1 0 6 8L3 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RefreshCw: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M21 3v5h-5M3 21v-5h5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.5 10A9 9 0 0 0 5.6 5.6L3 8M3.5 14A9 9 0 0 0 18.4 18.4L21 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Filter: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Sliders: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const Maximize2: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const Minimize2: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ==============================================================================
// 3. Chevrons & Arrows
// ==============================================================================

export const ChevronDown: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronUp: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronLeft: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRight: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowRight: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowUpRight: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M7 17L17 7M7 7h10v10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowDownRight: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M7 7l10 10M17 7v10H7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowUpDown: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MoveDown: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M12 5v14M7 14l5 5 5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MoveUp: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M12 19V5M7 10l5-5 5 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ==============================================================================
// 4. Travel & Mobility
// ==============================================================================

/** 항공기 */
export const Plane: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path
      d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 20 2.5s-3.5-1-5 0.5L11.5 6.5 3.3 4.7c-.8-.2-1.6.3-1.8 1.1s.3 1.6 1.1 1.8l6.8 3.8-3.5 3.5-2.5-.5c-.6-.1-1.2.2-1.4.8s.2 1.2.8 1.4l3 1.5 1.5 3c.2.6.8 1 1.4.8s.9-.8.8-1.4l-.5-2.5 3.5-3.5 3.8 6.8c.2.8 1 1.3 1.8 1.1s1.3-1 .8-1.8z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill !== 'none' ? fill : 'none'}
    />
  </Svg>
);

/** 길찾기 네비게이션 화살표 */
export const Navigation: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Polygon points="3 11 22 2 13 21 11 13 3 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill !== 'none' ? fill : 'none'} />
  </Svg>
);

/** 자동차 */
export const Car: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M5 16h14a2 2 0 0 0 2-2l-1.5-6a2 2 0 0 0-2-1.5H6.5a2 2 0 0 0-2 1.5L3 14a2 2 0 0 0 2 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="7.5" cy="16.5" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="16.5" cy="16.5" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8.5 6.8L7.5 12h9l-1-5.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 기차 / 지하철 */
export const Train: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="5" y="3" width="14" height="15" rx="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 6h10v5H7z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="8.5" cy="14.5" r="1.2" fill={color} />
    <Circle cx="15.5" cy="14.5" r="1.2" fill={color} />
    <Path d="M4 21l4-2M20 21l-4-2M8 19h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 버스 */
export const Bus: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="4" y="3" width="16" height="15" rx="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 10h16M7 6h10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="7.5" cy="14.5" r="1.2" fill={color} />
    <Circle cx="16.5" cy="14.5" r="1.2" fill={color} />
    <Path d="M6 18v2M18 18v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 선박 / 페리 */
export const Ship: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M3 17l2 3.5h14l2-3.5-2-4H5l-2 4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 9.5h10v3.5H7zM10 5.5h4v4h-4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 21c3-1 5 1 8 0s5 1 8 0 3 1 4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 자전거 */
export const Bike: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="5.5" cy="16.5" r="3.5" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="18.5" cy="16.5" r="3.5" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M5.5 16.5l4-7h5l4 7M9.5 9.5l4.5 7M14 9.5l-4.5 7M14 9.5V7h2M8 7h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 도보 발자국 */
export const Footprints: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M6 14.5a2 2 0 0 1 2-2 1.5 1.5 0 0 1 1.5 1.5c0 2-1 3.5-2 4.5S6 16.5 6 14.5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="7.5" cy="10" r="1.1" fill={color} />
    <Path d="M14 8.5a2 2 0 0 1 2-2 1.5 1.5 0 0 1 1.5 1.5c0 2-1 3.5-2 4.5S14 10.5 14 8.5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="15.5" cy="4" r="1.1" fill={color} />
  </Svg>
);

/** 지도 맵 */
export const Map: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Polygon points="1 6 1 21 8 17 16 21 23 17 23 2 16 6 8 2 1 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="8" y1="2" x2="8" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="16" y1="6" x2="16" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ==============================================================================
// 5. Spots, Food & Lifestyle Categories
// ==============================================================================

/** 카페 & 커피 */
export const Coffee: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 8h12a1 1 0 0 1 1 1v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9a1 1 0 0 1 1-1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill !== 'none' ? fill : 'none'} />
    <Path d="M17 10h2a2.5 2.5 0 0 1 0 5h-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 레스토랑 & 식사 */
export const Utensils: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M5 3v5a2 2 0 0 0 2 2v11M5 3v3M7 3v3M9 3v3M17 3c0 5 1.5 6 1.5 8v10M17 3a2 2 0 0 1 2 2v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 숙소 & 호텔 */
export const Hotel: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 8v5M15 8v5M9 10.5h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M10 21v-4h4v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 빌딩 / 도시 */
export const Building: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 집 / 홈 */
export const Home: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V10.5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill !== 'none' ? fill : 'none'} />
    <Path d="M9 21.5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 쇼핑백 */
export const ShoppingBag: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 8l1.5 13a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1L20 8H4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 8V5a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 카메라 */
export const Camera: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="14" r="3.5" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

/** 이미지 사진 액자 */
export const Image: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path d="M21 16l-5.5-5.5-8.5 8.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 티켓 / 바우처 */
export const Ticket: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M3 8a3 3 0 0 0 0 6v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5a3 3 0 0 0 0-6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="13" y1="5" x2="13" y2="19" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2,2" strokeLinecap="round" />
  </Svg>
);

/** 태그 */
export const Tag: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="7" cy="7" r="1.5" fill={color} />
  </Svg>
);

/** 코인 & 지출 */
export const Coins: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="15.5" cy="8.5" r="5.5" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="8.5" cy="15.5" r="5.5" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8.5 13.5v4M7 15.5h3M15.5 6.5v4M14 8.5h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 달러 기호 */
export const DollarSign: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 영수증 */
export const Receipt: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M4 2v18l3-1.5 3 1.5 3-1.5 3 1.5 4-2V2l-4 2-3-1.5-3 1.5-3-1.5L4 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="8" y1="7" x2="16" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 파이 차트 */
export const PieChart: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 12A10 10 0 0 0 12 2v10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 시계 & 일정 시간 */
export const Clock: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} />
    <Polyline points="12 6.5 12 12 15.5 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 캘린더 달력 */
export const Calendar: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="8" cy="13" r="0.8" fill={color} />
    <Circle cx="12" cy="13" r="0.8" fill={color} />
    <Circle cx="16" cy="13" r="0.8" fill={color} />
    <Circle cx="8" cy="16.5" r="0.8" fill={color} />
    <Circle cx="12" cy="16.5" r="0.8" fill={color} />
  </Svg>
);

/** 별점 */
export const Star: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill !== 'none' ? fill : 'none'}
    />
  </Svg>
);

/** 하트 */
export const Heart: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill !== 'none' ? fill : 'none'}
    />
  </Svg>
);

/** 전화 */
export const Phone: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 메일 */
export const Mail: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 7l9 6 9-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 자물쇠 */
export const Lock: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Rect x="4" y="11" width="16" height="10" rx="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="16" r="1.5" fill={color} />
  </Svg>
);

/** 열쇠 */
export const KeyRound: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M10.8 12.2L20 3M17 6l2 2M14 9l2 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 로그아웃 */
export const LogOut: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** 방패 / 보안 */
export const Shield: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 인증 방패 */
export const ShieldCheck: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 레이어 층 */
export const Layers: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Polygon points="12 2 2 7 12 12 22 7 12 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="2 17 12 22 22 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="2 12 12 17 22 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 클라우드 구름 */
export const Cloud: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 클라우드 업로드 */
export const UploadCloud: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M16 16l-4-4-4 4M12 12v9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 클라우드 다운로드 */
export const DownloadCloud: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M8 17l4 4 4-4M12 12v9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 데이터베이스 */
export const Database: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M21 5c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** 지구본 */
export const Globe: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="2.5" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 2.5a15.3 15.3 0 0 1 4 9.5 15.3 15.3 0 0 1-4 9.5 15.3 15.3 0 0 1-4-9.5 15.3 15.3 0 0 1 4-9.5z" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

/** 번개 */
export const Zap: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  fill = defaultProps.fill,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill !== 'none' ? fill : 'none'} />
  </Svg>
);

/** 인포메이션 안내 */
export const Info: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="12" cy="8" r="0.8" fill={color} />
  </Svg>
);

/** 후기 말풍선 */
export const MessageSquareQuote: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 9h2v2H8zm6 0h2v2h-2z" fill={color} />
  </Svg>
);

/** 텍스트 파일 문서 */
export const FileText: React.FC<IconProps> = ({
  size = defaultProps.size,
  color = defaultProps.color,
  strokeWidth = defaultProps.strokeWidth,
  style,
  ...rest
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} {...rest}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);
