import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors as c } from '../constants/theme';
import { Label } from './ui';

export function Athlete({ size = 230 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 260 260"
      accessibilityLabel="Illustration of an athlete lifting a dumbbell"
    >
      <Circle cx="142" cy="134" r="109" fill="#B5DE61" />
      <Circle cx="142" cy="134" r="87" stroke="#9AC04C" strokeWidth="1" fill="none" />
      <Circle cx="142" cy="134" r="63" stroke="#9AC04C" strokeWidth="1" fill="none" />
      <Path d="M28 224H239" stroke="#6F8B37" strokeWidth="2" />
      <Path d="M100 144L69 181L39 214L60 224L104 190L132 158" fill="#303D2D" />
      <Path d="M144 148L176 178L188 215L211 215L202 169L169 126" fill="#182319" />
      <Path d="M101 70Q126 62 148 79L170 126L141 157L100 142L109 105Z" fill="#F3F2DE" />
      <Path d="M111 70L84 94L70 65L57 71L70 119Q77 127 89 118L115 98" fill="#DA9273" />
      <Path d="M146 81L174 105L201 83L211 97L178 129Q172 132 163 126L143 111" fill="#EBA685" />
      <Path d="M129 38Q144 33 153 43L156 63L142 78L125 66Z" fill="#EBA685" />
      <Path d="M123 57Q110 31 137 29Q155 27 156 47L141 45L136 56L130 51L127 62Z" fill="#1B271B" />
      <Circle cx="149" cy="54" r="2" fill="#182319" />
      <Path d="M142 66L149 66" stroke="#9B5F4A" strokeWidth="2" />
      <G transform="rotate(-18 61 61)">
        <Rect x="31" y="57" width="60" height="9" rx="4" fill="#283826" />
        <Rect x="34" y="39" width="12" height="45" rx="4" fill="#182319" />
        <Rect x="48" y="45" width="8" height="33" rx="2" fill="#43573A" />
        <Rect x="76" y="39" width="12" height="45" rx="4" fill="#182319" />
      </G>
      <Path d="M39 211L57 218L63 232L25 232Q20 222 39 211Z" fill="#FAF9E9" />
      <Path d="M188 211L211 211L226 230H187Z" fill="#FAF9E9" />
      <Path d="M216 35V51M208 43H224M25 137V149M19 143H31" stroke="#526B2E" strokeWidth="2" />
    </Svg>
  );
}
export function MiniChart({
  data,
  labels,
  color = c.lime,
  suffix = '',
}: {
  data: number[];
  labels: string[];
  color?: string;
  suffix?: string;
}) {
  const max = Math.max(...data, 1);
  const width = 340;
  const height = 135;
  const step = width / Math.max(data.length, 1);
  return (
    <View
      accessibilityLabel={data
        .map((d, i) => `${labels[i]}: ${Math.round(d * 10) / 10}${suffix}`)
        .join(', ')}
    >
      <Svg width="100%" height={160} viewBox="0 0 340 160" preserveAspectRatio="none">
        {[0, 0.5, 1].map((v) => (
          <Line
            key={v}
            x1={0}
            x2={340}
            y1={height - v * 115}
            y2={height - v * 115}
            stroke={c.border}
            strokeDasharray="3 5"
          />
        ))}
        {data.map((v, i) => (
          <G key={i}>
            <Rect
              x={i * step + step * 0.26}
              y={height - (v / max) * 110}
              width={step * 0.48}
              height={Math.max(2, (v / max) * 110)}
              rx={Math.min(6, step / 5)}
              fill={v ? color : c.border}
            />
            <SvgText
              x={i * step + step / 2}
              y={155}
              fontSize={9}
              fill={c.secondary}
              textAnchor="middle"
            >
              {labels[i]}
            </SvgText>
            {v > 0 && data.length <= 8 && (
              <SvgText
                x={i * step + step / 2}
                y={height - (v / max) * 110 - 6}
                fontSize={10}
                fill={c.text}
                textAnchor="middle"
              >
                {Math.round(v * 10) / 10}
              </SvgText>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
}
export function Ring({
  value,
  size = 92,
  color = c.lime,
}: {
  value: number;
  size?: number;
  color?: string;
}) {
  const r = 36;
  const circumference = Math.PI * 2 * r;
  return (
    <Svg width={size} height={size} viewBox="0 0 90 90">
      <Circle cx={45} cy={45} r={r} stroke={c.raised} strokeWidth={7} fill="none" />
      <Circle
        cx={45}
        cy={45}
        r={r}
        stroke={color}
        strokeWidth={7}
        strokeDasharray={`${Math.min(1, value) * circumference} ${circumference}`}
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 45 45)"
      />
      <SvgText x={45} y={50} textAnchor="middle" fill={c.text} fontSize={19} fontWeight="700">
        {Math.round(value * 100)}%
      </SvgText>
    </Svg>
  );
}
export function Metric({
  value,
  label,
  color = c.lime,
  detail,
}: {
  value: string;
  label: string;
  color?: string;
  detail?: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: 120, gap: 8 }}>
      <Label style={{ color: c.secondary, fontSize: 12 }}>{label}</Label>
      <Label style={{ fontSize: 31, lineHeight: 38, letterSpacing: -1, fontWeight: '700', color }}>
        {value}
      </Label>
      {detail && <Label style={{ color: c.muted, fontSize: 11 }}>{detail}</Label>}
    </View>
  );
}
