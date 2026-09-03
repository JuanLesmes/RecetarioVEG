import type { ReactElement, SVGProps } from 'react';
import type { Visual } from '@/domain/recipe';
import { P } from './palette';

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                 */
/* ------------------------------------------------------------------ */

const Shadow = ({ y = 134, rx = 46 }: { y?: number; rx?: number }) => <ellipse cx="80" cy={y} rx={rx} ry="7" fill={P.shadow} />;

const Plate = ({ r = 52 }: { r?: number }) => (
  <>
    <circle cx="80" cy="88" r={r} fill={P.plateRim} />
    <circle cx="80" cy="86" r={r} fill={P.plate} />
    <circle cx="80" cy="86" r={r - 9} fill="none" stroke={P.plateShade} strokeWidth="2" />
  </>
);

/** Bowl visto de frente: cuerpo semicircular + borde elíptico. */
const Bowl = ({ fill = P.bowl, dark = P.bowlDark, top = P.cream }: { fill?: string; dark?: string; top?: string }) => (
  <>
    <path d="M26 80 H134 C134 112 110 130 80 130 C50 130 26 112 26 80 Z" fill={fill} />
    <path d="M40 112 C52 124 66 130 80 130 C110 130 134 112 134 80 H122 C122 104 104 118 80 118 C66 118 52 116 40 112 Z" fill={dark} opacity="0.55" />
    <ellipse cx="80" cy="80" rx="54" ry="12" fill={dark} />
    <ellipse cx="80" cy="79" rx="48" ry="9" fill={top} />
  </>
);

const Steam = ({ x = 80, y = 52 }: { x?: number; y?: number }) => (
  <g fill="none" stroke={P.gray} strokeWidth="3" strokeLinecap="round" opacity="0.8">
    <path d={`M${x - 14} ${y} c-4 -8 4 -10 0 -18`} />
    <path d={`M${x} ${y - 4} c-4 -8 4 -10 0 -18`} />
    <path d={`M${x + 14} ${y} c-4 -8 4 -10 0 -18`} />
  </g>
);

const Herb = ({ x, y, s = 1, fill = P.greenDark }: { x: number; y: number; s?: number; fill?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <path d="M0 0 c-6 -2 -8 -8 -4 -12 c4 2 6 6 4 12 Z" />
    <path d="M1 -1 c6 -2 10 -6 8 -12 c-5 1 -8 6 -8 12 Z" />
  </g>
);

const Spoon = ({ x = 118, y = 60, rot = 35, fill = P.gray }: { x?: number; y?: number; rot?: number; fill?: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x="-3" y="0" width="6" height="56" rx="3" fill={fill} />
    <ellipse cx="0" cy="-8" rx="9" ry="12" fill={fill} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Ilustraciones                                                        */
/* ------------------------------------------------------------------ */

const ART: Record<Visual, ReactElement> = {
  bowl: (
    <>
      <Shadow />
      <Bowl fill={P.bowlBlue} dark={P.bowlBlueDark} top={P.cream} />
      <path d="M40 78 C48 62 70 60 80 66 C92 58 116 64 120 78 Z" fill={P.cream} />
      <ellipse cx="52" cy="72" rx="12" ry="8" fill={P.green} />
      <ellipse cx="52" cy="71" rx="8" ry="5" fill={P.lime} />
      <circle cx="72" cy="70" r="4" fill={P.yellow} />
      <circle cx="80" cy="74" r="4" fill={P.yellow} />
      <circle cx="66" cy="76" r="4" fill={P.yellow} />
      <circle cx="102" cy="70" r="8" fill={P.red} />
      <circle cx="102" cy="70" r="4" fill={P.tomato} />
      <ellipse cx="116" cy="74" rx="8" ry="5" fill={P.orange} />
      <ellipse cx="90" cy="76" rx="9" ry="5" fill={P.purple} opacity="0.8" />
      <Herb x={94} y={64} />
    </>
  ),
  salad: (
    <>
      <Shadow />
      <Bowl fill={P.plate} dark={P.plateShade} top={P.leaf} />
      <path d="M36 78 C40 60 58 54 70 62 C76 50 96 50 102 62 C114 54 130 62 126 78 Z" fill={P.green} />
      <path d="M44 78 C50 68 62 66 70 70 C78 62 94 62 100 70 C108 66 120 70 120 78 Z" fill={P.lime} />
      <circle cx="60" cy="70" r="9" fill={P.red} />
      <circle cx="60" cy="70" r="5" fill={P.tomato} />
      <circle cx="104" cy="72" r="9" fill={P.red} />
      <circle cx="104" cy="72" r="5" fill={P.tomato} />
      <circle cx="82" cy="66" r="8" fill={P.lime} stroke={P.green} strokeWidth="2" />
      <ellipse cx="86" cy="78" rx="6" ry="4" fill={P.chocDark} />
      <ellipse cx="72" cy="80" rx="5" ry="3" fill={P.chocDark} />
    </>
  ),
  soup: (
    <>
      <Shadow />
      <Steam />
      <Bowl fill={P.plate} dark={P.plateShade} top={P.orange} />
      <ellipse cx="80" cy="79" rx="48" ry="9" fill={P.orange} />
      <path d="M56 78 c8 -6 18 -6 26 0 c8 6 18 6 26 0" fill="none" stroke={P.cream} strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="76" r="3" fill={P.orangeDark} />
      <circle cx="96" cy="81" r="3" fill={P.orangeDark} />
      <Herb x={84} y={76} s={0.8} />
      <Spoon x={124} y={54} rot={40} />
    </>
  ),
  stew: (
    <>
      <Shadow y={136} rx={50} />
      <Steam y={48} />
      <rect x="20" y="70" width="12" height="8" rx="4" fill={P.bowlDeepDark} />
      <rect x="128" y="70" width="12" height="8" rx="4" fill={P.bowlDeepDark} />
      <path d="M28 66 H132 V110 C132 124 116 132 80 132 C44 132 28 124 28 110 Z" fill={P.bowlDeep} />
      <path d="M28 96 H132 V110 C132 124 116 132 80 132 C44 132 28 124 28 110 Z" fill={P.bowlDeepDark} />
      <ellipse cx="80" cy="66" rx="52" ry="10" fill={P.bowlDeepDark} />
      <ellipse cx="80" cy="66" rx="46" ry="7" fill={P.redDark} />
      <ellipse cx="66" cy="65" rx="7" ry="4" fill={P.brown} />
      <ellipse cx="90" cy="67" rx="7" ry="4" fill={P.brownDark} />
      <ellipse cx="104" cy="64" rx="6" ry="3.5" fill={P.orange} />
      <ellipse cx="54" cy="68" rx="5" ry="3" fill={P.corn} />
      <Herb x={80} y={66} s={0.8} fill={P.leaf} />
      <Spoon x={118} y={38} rot={30} fill={P.brown} />
    </>
  ),
  curry: (
    <>
      <Shadow />
      <Plate />
      <path d="M40 90 C40 72 56 66 66 70 C74 62 84 68 82 82 C86 96 70 108 56 104 C44 102 38 98 40 90 Z" fill={P.white} />
      <g fill={P.off}>
        <circle cx="52" cy="86" r="2" />
        <circle cx="62" cy="80" r="2" />
        <circle cx="70" cy="92" r="2" />
        <circle cx="58" cy="98" r="2" />
      </g>
      <path d="M84 78 C96 66 122 70 122 88 C122 104 104 108 90 104 C80 100 78 88 84 78 Z" fill={P.orange} />
      <circle cx="98" cy="86" r="5" fill={P.yellow} />
      <circle cx="110" cy="94" r="5" fill={P.yellow} />
      <circle cx="94" cy="98" r="4" fill={P.yellow} />
      <path d="M100 80 c6 4 12 4 16 8" fill="none" stroke={P.cream} strokeWidth="2.5" strokeLinecap="round" />
      <Herb x={104} y={98} s={0.8} />
    </>
  ),
  noodles: (
    <>
      <Shadow />
      <g stroke={P.brown} strokeWidth="5" strokeLinecap="round">
        <line x1="46" y1="20" x2="96" y2="76" />
        <line x1="60" y1="18" x2="104" y2="72" />
      </g>
      <Bowl fill={P.bowlDeep} dark={P.bowlDeepDark} top={P.corn} />
      <g fill="none" stroke={P.yellowDark} strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
        <path d="M40 78 c10 -6 20 6 30 0 s20 6 30 0 s16 4 24 0" />
        <path d="M44 82 c10 -6 20 6 30 0 s20 6 30 0 s10 4 18 0" />
      </g>
      <rect x="58" y="66" width="14" height="12" rx="2" fill={P.cream} stroke={P.creamDark} strokeWidth="1.5" />
      <rect x="84" y="68" width="14" height="12" rx="2" fill={P.cream} stroke={P.creamDark} strokeWidth="1.5" />
      <circle cx="108" cy="74" r="6" fill={P.green} />
      <circle cx="48" cy="74" r="6" fill={P.red} />
      <Herb x={78} y={74} s={0.7} />
    </>
  ),
  rice: (
    <>
      <Shadow />
      <Plate />
      <path d="M42 96 C40 72 60 62 80 62 C100 62 120 72 118 96 C110 106 50 106 42 96 Z" fill={P.white} />
      <g fill={P.off}>
        <circle cx="58" cy="82" r="2.2" />
        <circle cx="74" cy="74" r="2.2" />
        <circle cx="92" cy="78" r="2.2" />
        <circle cx="104" cy="90" r="2.2" />
        <circle cx="66" cy="94" r="2.2" />
        <circle cx="86" cy="94" r="2.2" />
      </g>
      <circle cx="62" cy="70" r="4" fill={P.green} />
      <circle cx="96" cy="68" r="4" fill={P.green} />
      <rect x="76" y="82" width="8" height="8" rx="2" fill={P.orange} />
      <rect x="98" y="84" width="7" height="7" rx="2" fill={P.orange} />
      <path d="M118 104 a10 10 0 0 1 12 -12 l0 12 Z" fill={P.lime} stroke={P.green} strokeWidth="2" />
    </>
  ),
  taco: (
    <>
      <Shadow y={132} rx={54} />
      <g transform="translate(-14 4)">
        <path d="M42 112 C42 78 66 60 92 60 C118 60 140 78 140 112 Z" fill={P.corn} />
        <path d="M52 112 C52 86 70 70 92 70 C114 70 130 86 130 112 Z" fill={P.green} />
        <circle cx="72" cy="94" r="7" fill={P.red} />
        <circle cx="96" cy="86" r="7" fill={P.red} />
        <ellipse cx="112" cy="98" rx="8" ry="5" fill={P.brown} />
        <ellipse cx="84" cy="102" rx="9" ry="5" fill={P.brownDark} />
        <path d="M42 112 C42 96 50 84 62 76 C56 88 54 100 54 112 Z" fill={P.yellowDark} />
      </g>
      <g transform="translate(26 14) scale(0.72)">
        <path d="M42 112 C42 78 66 60 92 60 C118 60 140 78 140 112 Z" fill={P.corn} />
        <path d="M52 112 C52 86 70 70 92 70 C114 70 130 86 130 112 Z" fill={P.green} />
        <circle cx="76" cy="92" r="8" fill={P.red} />
        <ellipse cx="104" cy="96" rx="9" ry="6" fill={P.brown} />
        <path d="M42 112 C42 96 50 84 62 76 C56 88 54 100 54 112 Z" fill={P.yellowDark} />
      </g>
    </>
  ),
  wrap: (
    <>
      <Shadow y={132} rx={54} />
      <g transform="rotate(-18 80 90)">
        <rect x="20" y="74" width="120" height="36" rx="18" fill={P.creamDark} />
        <rect x="20" y="74" width="120" height="30" rx="15" fill={P.cream} />
        <circle cx="138" cy="92" r="16" fill={P.creamDark} />
        <circle cx="138" cy="92" r="11" fill={P.green} />
        <circle cx="136" cy="90" r="5" fill={P.red} />
        <circle cx="142" cy="96" r="3" fill={P.brown} />
        <path d="M44 84 q6 -6 12 0" fill="none" stroke={P.crust} strokeWidth="2" strokeLinecap="round" />
        <path d="M74 92 q6 -6 12 0" fill="none" stroke={P.crust} strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  ),
  sandwich: (
    <>
      <Shadow y={132} rx={54} />
      <path d="M22 96 C22 82 36 76 80 76 C124 76 138 82 138 96 L136 106 H24 Z" fill={P.crust} />
      <path d="M24 106 H136 C136 116 122 122 80 122 C38 122 24 116 24 106 Z" fill={P.toast} />
      <path d="M26 100 C40 96 62 108 80 98 C98 90 118 106 134 98 L134 108 H26 Z" fill={P.green} />
      <path d="M28 104 h104" stroke={P.red} strokeWidth="5" strokeLinecap="round" />
      <path d="M30 98 h100" stroke={P.orange} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <path d="M40 84 q6 -8 12 0 M70 82 q6 -8 12 0 M100 84 q6 -8 12 0" fill="none" stroke={P.brown} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  toast: (
    <>
      <Shadow />
      <path d="M36 54 C36 40 50 36 60 44 C66 36 94 36 100 44 C110 36 124 40 124 54 V122 C124 128 120 132 114 132 H46 C40 132 36 128 36 122 Z" fill={P.crust} />
      <path d="M44 60 C44 50 54 48 60 54 C66 48 94 48 100 54 C106 48 116 50 116 60 V116 C116 120 114 124 108 124 H52 C46 124 44 120 44 116 Z" fill={P.toast} />
      <path d="M50 78 C62 60 100 60 110 78 C114 96 100 116 80 116 C60 116 46 96 50 78 Z" fill={P.green} />
      <path d="M56 80 C66 68 94 68 104 80 C106 94 96 108 80 108 C64 108 54 94 56 80 Z" fill={P.lime} />
      <circle cx="70" cy="86" r="6" fill={P.red} />
      <circle cx="94" cy="92" r="6" fill={P.red} />
      <g fill={P.chocDark}>
        <circle cx="82" cy="78" r="1.6" />
        <circle cx="64" cy="98" r="1.6" />
        <circle cx="100" cy="80" r="1.6" />
      </g>
    </>
  ),
  arepa: (
    <>
      <Shadow />
      <ellipse cx="96" cy="104" rx="40" ry="16" fill={P.yellowDark} />
      <ellipse cx="96" cy="100" rx="40" ry="16" fill={P.corn} />
      <path d="M62 62 C66 52 98 50 108 60 C114 68 112 84 100 90 C86 96 60 92 56 82 C54 74 58 66 62 62 Z" fill={P.corn} />
      <path d="M62 62 C66 52 98 50 108 60 C114 68 112 84 100 90 C86 96 60 92 56 82 Z" fill="none" stroke={P.yellowDark} strokeWidth="3" />
      <path d="M58 84 C70 78 92 80 104 86 L100 90 C86 96 60 92 56 82 Z" fill={P.chocDark} />
      <path d="M60 86 C72 82 90 84 100 88" fill="none" stroke={P.white} strokeWidth="4" strokeLinecap="round" />
      <path d="M66 68 l6 10 M80 66 l6 10 M94 66 l6 10" stroke={P.yellowDark} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M70 108 l6 8 M90 108 l6 8 M110 108 l6 8" stroke={P.yellowDark} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  pancakes: (
    <>
      <Shadow />
      <Plate />
      <g>
        <ellipse cx="80" cy="102" rx="40" ry="12" fill={P.brown} />
        <ellipse cx="80" cy="98" rx="40" ry="12" fill={P.toast} />
        <ellipse cx="80" cy="88" rx="38" ry="11" fill={P.brown} />
        <ellipse cx="80" cy="84" rx="38" ry="11" fill={P.toast} />
        <ellipse cx="80" cy="74" rx="36" ry="10" fill={P.brown} />
        <ellipse cx="80" cy="70" rx="36" ry="10" fill={P.toast} />
        <path d="M50 70 C56 62 104 62 110 70 C104 76 100 82 92 84 C84 86 76 78 70 82 C64 86 58 80 50 70 Z" fill={P.orange} />
        <rect x="70" y="58" width="20" height="10" rx="2" fill={P.yellow} />
        <circle cx="62" cy="66" r="4" fill={P.berry} />
        <circle cx="100" cy="66" r="4" fill={P.berry} />
        <circle cx="86" cy="62" r="3.5" fill={P.red} />
      </g>
    </>
  ),
  eggs: (
    <>
      <Shadow y={134} rx={52} />
      <rect x="118" y="80" width="34" height="10" rx="5" fill={P.bowlDeepDark} />
      <circle cx="74" cy="88" r="50" fill={P.bowlDeepDark} />
      <circle cx="74" cy="86" r="46" fill={P.bowlDeep} />
      <circle cx="74" cy="86" r="38" fill={P.chocDark} opacity="0.35" />
      <path d="M46 84 C42 66 62 56 76 60 C92 52 108 66 104 82 C110 96 94 110 78 106 C62 112 46 100 46 84 Z" fill={P.white} />
      <circle cx="76" cy="84" r="13" fill={P.yellow} />
      <circle cx="72" cy="80" r="4" fill={P.corn} />
      <circle cx="52" cy="104" r="6" fill={P.red} />
      <circle cx="98" cy="106" r="6" fill={P.red} />
      <Herb x={96} y={70} s={0.8} />
    </>
  ),
  porridge: (
    <>
      <Shadow />
      <Steam y={54} />
      <Bowl fill={P.bowlBlue} dark={P.bowlBlueDark} top={P.cream} />
      <ellipse cx="80" cy="79" rx="48" ry="9" fill={P.cream} />
      <g fill={P.corn} stroke={P.yellowDark} strokeWidth="1.5">
        <circle cx="64" cy="76" r="7" />
        <circle cx="82" cy="80" r="7" />
        <circle cx="98" cy="75" r="7" />
      </g>
      <g fill={P.berry}>
        <circle cx="52" cy="80" r="4" />
        <circle cx="72" cy="84" r="4" />
        <circle cx="110" cy="80" r="4" />
      </g>
      <Spoon x={124} y={50} rot={40} />
    </>
  ),
  parfait: (
    <>
      <Shadow y={136} rx={30} />
      <path d="M50 40 H110 L104 128 C104 132 100 134 96 134 H64 C60 134 56 132 56 128 Z" fill={P.white} opacity="0.55" />
      <path d="M56 100 L104 100 L101 128 C101 131 98 132 95 132 H65 C62 132 59 131 59 128 Z" fill={P.chocDark} />
      <path d="M54 76 L106 76 L104 100 H56 Z" fill={P.corn} />
      <path d="M52 56 L108 56 L106 76 H54 Z" fill={P.white} />
      <path d="M50 40 H110 L108 56 H52 Z" fill={P.pink} />
      <circle cx="80" cy="42" r="8" fill={P.red} />
      <circle cx="66" cy="46" r="5" fill={P.berry} />
      <circle cx="96" cy="46" r="5" fill={P.berry} />
      <path d="M50 40 H110 L104 128 C104 132 100 134 96 134 H64 C60 134 56 132 56 128 Z" fill="none" stroke={P.gray} strokeWidth="2.5" />
      <path d="M60 60 v56" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  granola: (
    <>
      <Shadow y={136} rx={34} />
      <rect x="46" y="34" width="68" height="14" rx="4" fill={P.grayDark} />
      <path d="M50 48 H110 V120 C110 128 104 134 96 134 H64 C56 134 50 128 50 120 Z" fill={P.white} opacity="0.5" />
      <path d="M53 66 H107 V120 C107 126 102 131 96 131 H64 C58 131 53 126 53 120 Z" fill={P.crust} />
      <g fill={P.brownDark}>
        <circle cx="64" cy="80" r="5" />
        <circle cx="84" cy="74" r="6" />
        <circle cx="98" cy="90" r="5" />
        <circle cx="70" cy="102" r="6" />
        <circle cx="92" cy="112" r="5" />
      </g>
      <g fill={P.berry}>
        <circle cx="76" cy="90" r="3.5" />
        <circle cx="100" cy="74" r="3.5" />
        <circle cx="60" cy="116" r="3.5" />
      </g>
      <path d="M50 48 H110 V120 C110 128 104 134 96 134 H64 C56 134 50 128 50 120 Z" fill="none" stroke={P.gray} strokeWidth="2.5" />
      <path d="M58 72 v48" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    </>
  ),
  muffin: (
    <>
      <Shadow y={136} rx={36} />
      <path d="M48 84 L54 130 C54 133 57 134 60 134 H100 C103 134 106 133 106 130 L112 84 Z" fill={P.pinkDark} />
      <g stroke={P.pink} strokeWidth="5" strokeLinecap="round">
        <line x1="62" y1="90" x2="66" y2="128" />
        <line x1="80" y1="90" x2="80" y2="130" />
        <line x1="98" y1="90" x2="94" y2="128" />
      </g>
      <path d="M40 82 C36 56 56 40 80 40 C104 40 124 56 120 82 C112 88 48 88 40 82 Z" fill={P.crust} />
      <path d="M46 78 C46 60 60 48 80 48 C100 48 114 60 114 78 Z" fill={P.toast} />
      <g fill={P.chocDark}>
        <circle cx="64" cy="64" r="3.5" />
        <circle cx="84" cy="56" r="3.5" />
        <circle cx="100" cy="70" r="3.5" />
        <circle cx="74" cy="76" r="3" />
      </g>
    </>
  ),
  dumplings: (
    <>
      <Shadow />
      <Steam y={44} />
      <ellipse cx="80" cy="114" rx="56" ry="14" fill={P.brownDark} />
      <rect x="24" y="90" width="112" height="24" fill={P.brown} />
      <ellipse cx="80" cy="90" rx="56" ry="14" fill={P.crust} />
      <ellipse cx="80" cy="90" rx="48" ry="10" fill={P.toast} />
      <g fill={P.cream} stroke={P.creamDark} strokeWidth="2">
        <path d="M44 92 C44 74 60 66 70 76 C72 84 66 92 44 92 Z" />
        <path d="M68 90 C66 70 84 62 94 72 C100 84 92 92 68 90 Z" />
        <path d="M92 92 C92 76 108 68 116 78 C120 86 112 92 92 92 Z" />
      </g>
      <g fill="none" stroke={P.creamDark} strokeWidth="2" strokeLinecap="round">
        <path d="M54 82 l4 -6 M60 80 l4 -6" />
        <path d="M78 78 l4 -6 M84 76 l4 -6" />
        <path d="M102 82 l4 -6 M108 80 l4 -6" />
      </g>
    </>
  ),
  empanada: (
    <>
      <Shadow y={132} rx={54} />
      <g transform="rotate(-10 80 90)">
        <path d="M24 100 C24 66 54 48 90 52 C122 56 140 80 136 100 Z" fill={P.crust} />
        <path d="M30 98 C32 72 58 58 90 60 C118 64 132 82 130 98 Z" fill={P.corn} />
        <path d="M24 100 H136" stroke={P.crust} strokeWidth="6" strokeLinecap="round" />
        <g fill="none" stroke={P.brown} strokeWidth="3" strokeLinecap="round">
          <path d="M34 98 l6 -8 M48 96 l6 -8 M62 94 l6 -8 M76 93 l6 -8 M90 93 l6 -8 M104 94 l6 -8 M118 96 l6 -8" />
        </g>
      </g>
      <g transform="translate(58 96) scale(0.55)">
        <path d="M24 100 C24 66 54 48 90 52 C122 56 140 80 136 100 Z" fill={P.crust} />
        <path d="M30 98 C32 72 58 58 90 60 C118 64 132 82 130 98 Z" fill={P.corn} />
        <path d="M24 100 H136" stroke={P.crust} strokeWidth="8" strokeLinecap="round" />
      </g>
    </>
  ),
  pie: (
    <>
      <Shadow />
      <ellipse cx="80" cy="104" rx="58" ry="20" fill={P.bowlDark} />
      <path d="M22 104 C22 92 48 84 80 84 C112 84 138 92 138 104 V112 C138 124 112 132 80 132 C48 132 22 124 22 112 Z" fill={P.bowl} />
      <ellipse cx="80" cy="96" rx="52" ry="16" fill={P.crust} />
      <ellipse cx="80" cy="94" rx="46" ry="12" fill={P.red} />
      <g stroke={P.toast} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M44 88 L116 100 M46 100 L114 88 M60 82 L100 106 M100 82 L60 106 M80 82 V106" />
      </g>
      <ellipse cx="80" cy="96" rx="52" ry="16" fill="none" stroke={P.crust} strokeWidth="6" />
      <Steam y={68} x={80} />
    </>
  ),
  casserole: (
    <>
      <Shadow />
      <rect x="18" y="80" width="14" height="12" rx="6" fill={P.redDark} />
      <rect x="128" y="80" width="14" height="12" rx="6" fill={P.redDark} />
      <path d="M26 74 H134 V118 C134 126 128 130 120 130 H40 C32 130 26 126 26 118 Z" fill={P.red} />
      <rect x="34" y="82" width="92" height="40" rx="4" fill={P.crust} />
      <rect x="34" y="82" width="92" height="9" fill={P.corn} />
      <rect x="34" y="91" width="92" height="8" fill={P.redDark} />
      <rect x="34" y="99" width="92" height="8" fill={P.cream} />
      <rect x="34" y="107" width="92" height="8" fill={P.redDark} />
      <rect x="34" y="115" width="92" height="7" fill={P.cream} />
      <path d="M40 80 C50 70 70 72 80 76 C92 70 112 70 122 80" fill={P.corn} />
      <ellipse cx="80" cy="74" rx="54" ry="8" fill={P.redDark} />
      <ellipse cx="80" cy="74" rx="46" ry="6" fill={P.corn} />
      <Herb x={82} y={72} s={0.8} />
    </>
  ),
  pizza: (
    <>
      <Shadow />
      <circle cx="80" cy="86" r="54" fill={P.crust} />
      <circle cx="80" cy="86" r="46" fill={P.red} />
      <circle cx="80" cy="86" r="42" fill={P.corn} />
      <g fill={P.red}>
        <circle cx="62" cy="72" r="9" />
        <circle cx="98" cy="70" r="9" />
        <circle cx="58" cy="102" r="9" />
        <circle cx="96" cy="104" r="9" />
        <circle cx="80" cy="88" r="9" />
      </g>
      <g fill={P.tomato}>
        <circle cx="62" cy="72" r="5" />
        <circle cx="98" cy="70" r="5" />
        <circle cx="58" cy="102" r="5" />
        <circle cx="96" cy="104" r="5" />
        <circle cx="80" cy="88" r="5" />
      </g>
      <Herb x={82} y={72} s={0.9} />
      <Herb x={70} y={108} s={0.9} />
      <Herb x={112} y={92} s={0.9} />
      <g stroke={P.crust} strokeWidth="2" opacity="0.5">
        <line x1="80" y1="32" x2="80" y2="140" />
        <line x1="26" y1="86" x2="134" y2="86" />
        <line x1="42" y1="48" x2="118" y2="124" />
        <line x1="118" y1="48" x2="42" y2="124" />
      </g>
    </>
  ),
  pasta: (
    <>
      <Shadow />
      <Plate />
      <g fill="none" stroke={P.corn} strokeWidth="5" strokeLinecap="round">
        <path d="M44 88 c10 -20 30 -22 42 -8 c12 -12 32 -8 34 10" />
        <path d="M40 96 c14 -14 36 -12 44 2 c10 -14 34 -12 38 6" />
        <path d="M46 106 c12 -10 32 -6 40 2 c8 -8 28 -6 32 4" />
        <path d="M50 78 c14 -6 26 -2 30 6 c6 -10 22 -10 30 -2" />
      </g>
      <g fill="none" stroke={P.yellowDark} strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <path d="M44 88 c10 -20 30 -22 42 -8 c12 -12 32 -8 34 10" />
        <path d="M40 96 c14 -14 36 -12 44 2 c10 -14 34 -12 38 6" />
      </g>
      <path d="M64 84 C70 76 90 76 96 84 C100 92 90 100 80 100 C70 100 60 92 64 84 Z" fill={P.red} />
      <circle cx="74" cy="86" r="3" fill={P.tomato} />
      <circle cx="88" cy="92" r="3" fill={P.tomato} />
      <Herb x={82} y={82} s={0.9} />
    </>
  ),
  stuffed: (
    <>
      <Shadow y={134} rx={52} />
      <g transform="translate(-8 0)">
        <path d="M30 76 C30 58 46 50 62 52 C78 50 92 58 92 76 V112 C92 122 80 128 61 128 C42 128 30 122 30 112 Z" fill={P.red} />
        <path d="M40 74 C40 64 50 60 61 60 C72 60 82 64 82 74 C82 88 74 92 61 92 C48 92 40 88 40 74 Z" fill={P.corn} />
        <circle cx="52" cy="74" r="4" fill={P.green} />
        <circle cx="70" cy="70" r="4" fill={P.brown} />
        <circle cx="62" cy="82" r="4" fill={P.orange} />
        <path d="M58 46 q3 -10 8 -12" fill="none" stroke={P.greenDark} strokeWidth="4" strokeLinecap="round" />
      </g>
      <g transform="translate(60 10) scale(0.8)">
        <path d="M30 76 C30 58 46 50 62 52 C78 50 92 58 92 76 V112 C92 122 80 128 61 128 C42 128 30 122 30 112 Z" fill={P.yellow} />
        <path d="M40 74 C40 64 50 60 61 60 C72 60 82 64 82 74 C82 88 74 92 61 92 C48 92 40 88 40 74 Z" fill={P.cream} />
        <circle cx="54" cy="74" r="4" fill={P.green} />
        <circle cx="68" cy="78" r="4" fill={P.red} />
        <path d="M58 46 q3 -10 8 -12" fill="none" stroke={P.greenDark} strokeWidth="4" strokeLinecap="round" />
      </g>
    </>
  ),
  skillet: (
    <>
      <Shadow y={134} rx={52} />
      <path d="M118 78 L156 62" stroke={P.chocDark} strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="72" cy="90" rx="50" ry="40" fill={P.bowlDeepDark} />
      <ellipse cx="72" cy="86" rx="46" ry="36" fill={P.bowlDeep} />
      <ellipse cx="72" cy="86" rx="38" ry="28" fill={P.chocDark} opacity="0.35" />
      <g>
        <circle cx="54" cy="78" r="9" fill={P.green} />
        <circle cx="54" cy="78" r="5" fill={P.greenDark} />
        <circle cx="86" cy="72" r="9" fill={P.green} />
        <circle cx="86" cy="72" r="5" fill={P.greenDark} />
        <rect x="60" y="92" width="24" height="8" rx="4" fill={P.red} transform="rotate(-20 72 96)" />
        <rect x="76" y="94" width="24" height="8" rx="4" fill={P.orange} transform="rotate(15 88 98)" />
        <ellipse cx="46" cy="98" rx="8" ry="6" fill={P.brown} />
        <ellipse cx="98" cy="90" rx="8" ry="6" fill={P.brown} />
        <rect x="64" y="70" width="12" height="12" rx="2" fill={P.cream} />
      </g>
    </>
  ),
  flatbread: (
    <>
      <Shadow />
      <ellipse cx="86" cy="106" rx="50" ry="18" fill={P.crust} />
      <ellipse cx="86" cy="102" rx="50" ry="18" fill={P.corn} />
      <ellipse cx="76" cy="90" rx="50" ry="18" fill={P.crust} />
      <ellipse cx="76" cy="86" rx="50" ry="18" fill={P.cream} />
      <g fill={P.crust} opacity="0.8">
        <circle cx="56" cy="84" r="4" />
        <circle cx="78" cy="78" r="3.5" />
        <circle cx="98" cy="86" r="4" />
        <circle cx="70" cy="94" r="3" />
        <circle cx="92" cy="94" r="3" />
      </g>
      <g fill={P.brown} opacity="0.5">
        <circle cx="106" cy="104" r="3" />
        <circle cx="120" cy="110" r="3" />
      </g>
      <Herb x={112} y={78} s={0.9} />
    </>
  ),
  bread: (
    <>
      <Shadow y={134} rx={54} />
      <path d="M40 130 V80 C40 62 56 50 80 50 C104 50 120 62 120 80 V130 Z" fill={P.crust} />
      <path d="M46 130 V82 C46 68 60 58 80 58 C100 58 114 68 114 82 V130 Z" fill={P.toast} />
      <path d="M56 68 q6 -8 12 0 M84 62 q6 -8 12 0 M70 60 q6 -8 12 0" fill="none" stroke={P.brown} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <g transform="translate(112 74) rotate(20)">
        <path d="M0 0 H30 V62 H0 Z" fill={P.crust} />
        <path d="M4 4 H26 V58 H4 Z" fill={P.cream} />
        <circle cx="12" cy="20" r="3" fill={P.creamDark} />
        <circle cx="20" cy="34" r="3" fill={P.creamDark} />
        <circle cx="10" cy="46" r="3" fill={P.creamDark} />
      </g>
    </>
  ),
  tortilla: (
    <>
      <Shadow />
      <Plate />
      <path d="M46 104 L80 58 L114 104 Z" fill={P.yellowDark} />
      <path d="M46 96 L80 50 L114 96 Z" fill={P.corn} />
      <path d="M46 96 L80 50 L114 96" fill="none" stroke={P.yellowDark} strokeWidth="2" />
      <g fill={P.cream} stroke={P.creamDark} strokeWidth="1.5">
        <circle cx="80" cy="78" r="6" />
        <circle cx="66" cy="90" r="5" />
        <circle cx="96" cy="90" r="5" />
        <circle cx="82" cy="64" r="4" />
      </g>
      <path d="M46 96 H114 V104 H46 Z" fill={P.yellowDark} />
      <Herb x={104} y={70} s={0.8} />
    </>
  ),
  falafel: (
    <>
      <Shadow />
      <Plate />
      <path d="M60 96 C70 90 90 90 100 96 C104 100 100 104 96 104 H64 C60 104 56 100 60 96 Z" fill={P.cream} />
      <g fill={P.brown} stroke={P.brownDark} strokeWidth="2">
        <circle cx="62" cy="80" r="13" />
        <circle cx="94" cy="78" r="13" />
        <circle cx="80" cy="96" r="13" />
      </g>
      <g fill={P.green}>
        <circle cx="58" cy="76" r="2" />
        <circle cx="66" cy="84" r="2" />
        <circle cx="90" cy="74" r="2" />
        <circle cx="98" cy="82" r="2" />
        <circle cx="76" cy="92" r="2" />
        <circle cx="84" cy="100" r="2" />
      </g>
      <path d="M48 104 c8 -4 16 4 24 0" fill="none" stroke={P.cream} strokeWidth="3" strokeLinecap="round" />
      <Herb x={112} y={94} s={0.9} />
    </>
  ),
  plantain: (
    <>
      <Shadow />
      <Plate />
      <g fill={P.corn} stroke={P.yellowDark} strokeWidth="3">
        <ellipse cx="58" cy="94" rx="24" ry="14" />
        <ellipse cx="94" cy="98" rx="24" ry="14" />
        <ellipse cx="76" cy="74" rx="24" ry="14" />
      </g>
      <g fill={P.yellowDark} opacity="0.6">
        <circle cx="50" cy="92" r="2.5" />
        <circle cx="66" cy="98" r="2.5" />
        <circle cx="88" cy="94" r="2.5" />
        <circle cx="104" cy="102" r="2.5" />
        <circle cx="70" cy="72" r="2.5" />
        <circle cx="84" cy="78" r="2.5" />
      </g>
      <path d="M100 68 C104 58 118 58 122 68 C124 76 116 82 110 80 C104 80 98 76 100 68 Z" fill={P.green} />
      <path d="M104 68 C106 62 116 62 118 68 C118 74 112 76 110 76 C106 76 102 72 104 68 Z" fill={P.lime} />
    </>
  ),
  tofu: (
    <>
      <Shadow />
      <Plate />
      <g>
        <path d="M46 84 L70 78 L90 84 L66 90 Z" fill={P.brown} />
        <path d="M46 84 L66 90 V104 L46 98 Z" fill={P.cream} />
        <path d="M66 90 L90 84 V98 L66 104 Z" fill={P.creamDark} />
        <path d="M70 72 L94 66 L114 72 L90 78 Z" fill={P.brown} />
        <path d="M70 72 L90 78 V92 L70 86 Z" fill={P.cream} />
        <path d="M90 78 L114 72 V86 L90 92 Z" fill={P.creamDark} />
      </g>
      <g fill={P.white} stroke={P.gray} strokeWidth="0.5">
        <circle cx="60" cy="84" r="1.6" />
        <circle cx="76" cy="82" r="1.6" />
        <circle cx="94" cy="72" r="1.6" />
        <circle cx="104" cy="70" r="1.6" />
      </g>
      <g stroke={P.green} strokeWidth="3" strokeLinecap="round">
        <line x1="56" y1="78" x2="64" y2="76" />
        <line x1="98" y1="66" x2="106" y2="64" />
        <line x1="80" y1="98" x2="88" y2="96" />
      </g>
    </>
  ),
  tempura: (
    <>
      <Shadow />
      <Plate />
      <g fill={P.corn} stroke={P.crust} strokeWidth="3" strokeLinejoin="round">
        <path d="M44 92 c4 -12 10 -16 18 -18 c6 -2 12 4 14 10 c2 8 -4 16 -12 18 c-8 2 -22 0 -20 -10 Z" />
        <path d="M80 82 c6 -12 16 -12 24 -8 c8 4 10 14 4 20 c-6 6 -18 8 -26 2 c-6 -4 -6 -8 -2 -14 Z" />
        <path d="M62 104 c8 -4 20 -6 30 0 c6 4 4 12 -4 14 c-10 2 -24 2 -30 -4 c-4 -4 -2 -8 4 -10 Z" />
      </g>
      <g fill={P.crust} opacity="0.6">
        <circle cx="54" cy="86" r="2" />
        <circle cx="66" cy="94" r="2" />
        <circle cx="96" cy="84" r="2" />
        <circle cx="78" cy="110" r="2" />
      </g>
      <circle cx="120" cy="106" r="12" fill={P.bowlDeep} />
      <circle cx="120" cy="104" r="9" fill={P.chocDark} />
    </>
  ),
  sushi: (
    <>
      <Shadow />
      <Plate />
      <g>
        <circle cx="56" cy="84" r="17" fill={P.nori} />
        <circle cx="56" cy="84" r="12" fill={P.white} />
        <circle cx="56" cy="84" r="5" fill={P.green} />
        <circle cx="90" cy="76" r="17" fill={P.nori} />
        <circle cx="90" cy="76" r="12" fill={P.white} />
        <circle cx="88" cy="74" r="4" fill={P.orange} />
        <circle cx="94" cy="80" r="3" fill={P.lime} />
        <circle cx="82" cy="108" r="17" fill={P.nori} />
        <circle cx="82" cy="108" r="12" fill={P.white} />
        <circle cx="82" cy="108" r="5" fill={P.red} />
      </g>
      <path d="M112 100 c6 -6 14 -2 14 6 c0 6 -8 8 -14 4 Z" fill={P.pink} />
      <Herb x={118} y={80} s={0.8} />
    </>
  ),
  cake: (
    <>
      <Shadow />
      <Plate />
      <g transform="translate(0 -2)">
        <path d="M48 108 L80 60 L118 96 L118 110 L48 122 Z" fill={P.crust} />
        <path d="M48 108 L80 60 L118 96 L48 108 Z" fill={P.cream} />
        <path d="M50 110 L118 98 L118 104 L50 116 Z" fill={P.pink} />
        <path d="M50 116 L118 104 L118 110 L50 122 Z" fill={P.crust} />
        <path d="M56 100 L84 74 L112 96" fill="none" stroke={P.pink} strokeWidth="4" strokeLinecap="round" />
        <circle cx="82" cy="60" r="6" fill={P.red} />
        <path d="M82 54 q2 -6 6 -8" stroke={P.greenDark} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    </>
  ),
  cookie: (
    <>
      <Shadow />
      <Plate />
      <g fill={P.toast} stroke={P.crust} strokeWidth="2.5">
        <circle cx="60" cy="80" r="18" />
        <circle cx="100" cy="76" r="18" />
        <circle cx="80" cy="106" r="18" />
      </g>
      <g fill={P.chocDark}>
        <circle cx="54" cy="74" r="3" />
        <circle cx="66" cy="84" r="3" />
        <circle cx="58" cy="88" r="2.4" />
        <circle cx="94" cy="70" r="3" />
        <circle cx="106" cy="80" r="3" />
        <circle cx="98" cy="84" r="2.4" />
        <circle cx="74" cy="100" r="3" />
        <circle cx="86" cy="112" r="3" />
        <circle cx="84" cy="100" r="2.4" />
      </g>
    </>
  ),
  brownie: (
    <>
      <Shadow />
      <Plate />
      <g>
        <path d="M48 96 L84 84 L114 94 L78 108 Z" fill={P.chocDark} />
        <path d="M48 96 L78 108 V122 L48 110 Z" fill={P.choc} />
        <path d="M78 108 L114 94 V108 L78 122 Z" fill={P.chocDark} />
        <path d="M56 76 L86 66 L112 74 L82 86 Z" fill={P.chocDark} />
        <path d="M56 76 L82 86 V98 L56 88 Z" fill={P.choc} />
        <path d="M82 86 L112 74 V86 L82 98 Z" fill={P.chocDark} />
        <g fill="none" stroke={P.crust} strokeWidth="1.5" opacity="0.7" strokeLinecap="round">
          <path d="M66 74 l8 -2 M84 70 l10 2 M62 100 l8 -2 M94 100 l8 -4" />
        </g>
        <circle cx="96" cy="66" r="5" fill={P.red} />
      </g>
    </>
  ),
  pudding: (
    <>
      <Shadow />
      <Plate />
      <path d="M52 92 C52 72 64 62 80 62 C96 62 108 72 108 92 C108 98 96 102 80 102 C64 102 52 98 52 92 Z" fill={P.corn} />
      <path d="M52 92 C52 84 64 78 80 78 C96 78 108 84 108 92 C108 98 96 102 80 102 C64 102 52 98 52 92 Z" fill={P.yellow} />
      <path d="M56 78 C60 66 70 62 80 62 C90 62 100 66 104 78 C98 84 90 82 84 78 C78 84 68 84 62 80 C60 80 58 80 56 78 Z" fill={P.brown} />
      <path d="M60 80 c4 8 8 8 10 0" fill={P.brown} />
      <path d="M92 80 c4 8 8 8 10 0" fill={P.brown} />
      <ellipse cx="80" cy="102" rx="34" ry="6" fill={P.brown} opacity="0.55" />
      <circle cx="80" cy="64" r="5" fill={P.red} />
    </>
  ),
  icecream: (
    <>
      <Shadow />
      <path d="M32 84 H128 C128 110 108 128 80 128 C52 128 32 110 32 84 Z" fill={P.bowlBlueDark} />
      <path d="M32 84 H128 C128 104 108 120 80 120 C52 120 32 104 32 84 Z" fill={P.bowlBlue} />
      <circle cx="62" cy="72" r="20" fill={P.pink} />
      <circle cx="98" cy="70" r="20" fill={P.cream} />
      <circle cx="80" cy="56" r="18" fill={P.choc} />
      <g fill={P.pinkDark} opacity="0.7">
        <circle cx="54" cy="66" r="2.5" />
        <circle cx="68" cy="78" r="2.5" />
      </g>
      <g fill={P.creamDark} opacity="0.7">
        <circle cx="92" cy="64" r="2.5" />
        <circle cx="104" cy="76" r="2.5" />
      </g>
      <ellipse cx="80" cy="84" rx="50" ry="8" fill={P.bowlBlueDark} />
      <ellipse cx="80" cy="84" rx="44" ry="5" fill={P.bowlBlue} />
      <Herb x={96} y={50} s={0.9} />
      <circle cx="80" cy="40" r="5" fill={P.red} />
    </>
  ),
  truffles: (
    <>
      <Shadow />
      <Plate />
      <g fill={P.choc} stroke={P.chocDark} strokeWidth="2">
        <circle cx="58" cy="82" r="14" />
        <circle cx="90" cy="74" r="14" />
        <circle cx="104" cy="102" r="14" />
        <circle cx="70" cy="106" r="14" />
      </g>
      <g fill={P.white} opacity="0.9">
        <circle cx="88" cy="70" r="2" />
        <circle cx="94" cy="78" r="2" />
        <circle cx="84" cy="78" r="1.6" />
        <circle cx="66" cy="102" r="2" />
        <circle cx="74" cy="110" r="2" />
        <circle cx="72" cy="100" r="1.6" />
      </g>
      <g fill={P.crust} opacity="0.8">
        <circle cx="54" cy="78" r="2" />
        <circle cx="62" cy="86" r="2" />
        <circle cx="100" cy="98" r="2" />
        <circle cx="108" cy="106" r="2" />
      </g>
    </>
  ),
  churros: (
    <>
      <Shadow />
      <g transform="rotate(-30 80 90)">
        <rect x="30" y="74" width="100" height="12" rx="6" fill={P.crust} />
        <rect x="34" y="90" width="100" height="12" rx="6" fill={P.crust} />
        <rect x="26" y="106" width="100" height="12" rx="6" fill={P.crust} />
        <g stroke={P.brownDark} strokeWidth="1.5" opacity="0.6">
          <path d="M40 76 v8 M50 76 v8 M60 76 v8 M70 76 v8 M80 76 v8 M90 76 v8 M100 76 v8 M110 76 v8 M120 76 v8" />
          <path d="M44 92 v8 M54 92 v8 M64 92 v8 M74 92 v8 M84 92 v8 M94 92 v8 M104 92 v8 M114 92 v8 M124 92 v8" />
          <path d="M36 108 v8 M46 108 v8 M56 108 v8 M66 108 v8 M76 108 v8 M86 108 v8 M96 108 v8 M106 108 v8 M116 108 v8" />
        </g>
      </g>
      <circle cx="122" cy="108" r="18" fill={P.bowlBlueDark} />
      <circle cx="122" cy="106" r="15" fill={P.bowlBlue} />
      <circle cx="122" cy="106" r="11" fill={P.choc} />
      <g fill={P.white} opacity="0.7">
        <circle cx="58" cy="60" r="1.5" />
        <circle cx="72" cy="52" r="1.5" />
        <circle cx="96" cy="70" r="1.5" />
        <circle cx="46" cy="98" r="1.5" />
      </g>
    </>
  ),
  dip: (
    <>
      <Shadow />
      <g fill={P.corn} stroke={P.crust} strokeWidth="2">
        <path d="M108 60 L146 74 L118 96 Z" />
        <path d="M118 46 L150 52 L132 82 Z" />
      </g>
      <Bowl fill={P.bowlBlue} dark={P.bowlBlueDark} top={P.cream} />
      <ellipse cx="80" cy="79" rx="48" ry="9" fill={P.cream} />
      <path d="M50 78 c10 -6 20 -4 30 0 c10 4 20 2 30 -2" fill="none" stroke={P.creamDark} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="78" cy="78" rx="14" ry="5" fill={P.yellow} opacity="0.8" />
      <g fill={P.redDark}>
        <circle cx="60" cy="76" r="1.5" />
        <circle cx="96" cy="82" r="1.5" />
        <circle cx="84" cy="74" r="1.5" />
      </g>
      <Herb x={70} y={80} s={0.8} />
    </>
  ),
  sauce: (
    <>
      <Shadow y={136} rx={34} />
      <rect x="54" y="30" width="52" height="14" rx="4" fill={P.grayDark} />
      <path d="M50 44 H110 V122 C110 129 104 134 96 134 H64 C56 134 50 129 50 122 Z" fill={P.white} opacity="0.5" />
      <path d="M53 62 H107 V122 C107 127 102 131 97 131 H63 C58 131 53 127 53 122 Z" fill={P.green} />
      <path d="M53 62 H107 V80 H53 Z" fill={P.greenDark} opacity="0.35" />
      <g fill={P.greenDark}>
        <circle cx="66" cy="90" r="3" />
        <circle cx="90" cy="100" r="3" />
        <circle cx="78" cy="116" r="3" />
        <circle cx="96" cy="80" r="2.5" />
      </g>
      <path d="M50 44 H110 V122 C110 129 104 134 96 134 H64 C56 134 50 129 50 122 Z" fill="none" stroke={P.gray} strokeWidth="2.5" />
      <path d="M58 70 v48" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <Spoon x={120} y={64} rot={20} fill={P.brown} />
      <Herb x={126} y={126} s={1.2} />
    </>
  ),
  drink: (
    <>
      <Shadow y={136} rx={30} />
      <path d="M52 40 H108 L102 128 C102 132 98 134 94 134 H66 C62 134 58 132 58 128 Z" fill={P.white} opacity="0.5" />
      <path d="M55 70 H105 L100 126 C100 129 97 131 94 131 H66 C63 131 60 129 60 126 Z" fill={P.corn} />
      <g fill={P.white} opacity="0.7" stroke={P.gray} strokeWidth="1">
        <rect x="62" y="76" width="16" height="16" rx="3" transform="rotate(-12 70 84)" />
        <rect x="82" y="88" width="16" height="16" rx="3" transform="rotate(14 90 96)" />
      </g>
      <path d="M52 40 H108 L102 128 C102 132 98 134 94 134 H66 C62 134 58 132 58 128 Z" fill="none" stroke={P.gray} strokeWidth="2.5" />
      <path d="M62 56 v56" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <rect x="92" y="14" width="8" height="90" rx="4" fill={P.red} transform="rotate(12 96 60)" />
      <circle cx="108" cy="44" r="13" fill={P.lime} stroke={P.green} strokeWidth="3" />
      <path d="M108 31 V57 M95 44 H121" stroke={P.green} strokeWidth="2" />
      <Herb x={70} y={46} s={1} />
    </>
  ),
  hotdrink: (
    <>
      <Shadow y={134} rx={40} />
      <Steam y={48} x={78} />
      <path d="M112 76 H124 C136 76 136 104 124 104 H112" fill="none" stroke={P.red} strokeWidth="9" />
      <path d="M40 66 H116 V116 C116 126 108 132 98 132 H58 C48 132 40 126 40 116 Z" fill={P.red} />
      <path d="M40 66 H116 V78 H40 Z" fill={P.redDark} opacity="0.3" />
      <ellipse cx="78" cy="66" rx="38" ry="9" fill={P.redDark} />
      <ellipse cx="78" cy="66" rx="32" ry="6" fill={P.cream} />
      <path d="M62 66 c6 -4 12 4 18 0 s12 4 16 0" fill="none" stroke={P.crust} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="64" r="3" fill={P.brown} opacity="0.7" />
    </>
  ),
  snack: (
    <>
      <Shadow />
      <Bowl fill={P.bowlBlue} dark={P.bowlBlueDark} top={P.corn} />
      <g fill={P.orange} stroke={P.orangeDark} strokeWidth="1.5">
        <circle cx="52" cy="72" r="7" />
        <circle cx="66" cy="66" r="7" />
        <circle cx="80" cy="70" r="7" />
        <circle cx="94" cy="64" r="7" />
        <circle cx="108" cy="70" r="7" />
        <circle cx="72" cy="78" r="6" />
        <circle cx="100" cy="78" r="6" />
        <circle cx="86" cy="80" r="6" />
      </g>
      <g fill={P.yellow} stroke={P.yellowDark} strokeWidth="1.5">
        <circle cx="128" cy="112" r="6" />
        <circle cx="140" cy="120" r="5" />
        <circle cx="30" cy="118" r="5" />
      </g>
    </>
  ),
};

interface DishIllustrationProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: Visual;
  title?: string;
}

/** Ilustración vectorial plana de un plato, en un lienzo de 160×160. */
export function DishIllustration({ name, title, className, ...rest }: DishIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={['dish', className ?? ''].join(' ').trim()}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {ART[name]}
    </svg>
  );
}
