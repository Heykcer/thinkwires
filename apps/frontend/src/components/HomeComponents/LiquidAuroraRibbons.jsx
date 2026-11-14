import React from 'react';

/**
 * Premium Full-Width Orbital Liquid Glass Animation for Thinkwires Homepage Hero.
 * Highly optimized for 60fps GPU-composited performance.
 *
 * Visual Components:
 * A. Liquid Aurora: Continuously traveling fluid gradient formations spanning
 *    the entire hero width (Cobalt #2563EB, Royal Blue #1551D1, Cyan #38BDF8,
 *    Lavender #A5B4FC, subtle Green #22C55E).
 * B. 3D Glass Ribbons: Full-width orbital glass ribbon system with independent
 *    orbital flows framing the left headline area, bridging across the center,
 *    and encircling the right job carousel.
 *
 * Pure CSS transform/opacity animations. Absolutely NO particles, dots, or laggy filters.
 * Fully text-safe: ribbons gracefully frame the content without obstructing readability.
 */
const LiquidAuroraRibbons = React.memo(() => {
  return (
    <div className="tw-liquid-aurora-root" aria-hidden="true">
      {/* ------------------------------------------------------------------
          A. Liquid Aurora Layer (Fluid Volumetric Moving Gradients)
          ------------------------------------------------------------------ */}
      <div className="tw-aurora-mesh-container">
        {/* Blob 1: Cobalt / Royal Blue Swell */}
        <div className="tw-aurora-blob tw-aurora-blob-primary" />

        {/* Blob 2: Cyan & Lavender Luminescence */}
        <div className="tw-aurora-blob tw-aurora-blob-cyan" />

        {/* Blob 3: Subtle Emerald / Green Accent */}
        <div className="tw-aurora-blob tw-aurora-blob-green" />

        {/* Blob 4: Soft Lavender Veil behind Left Headline */}
        <div className="tw-aurora-blob tw-aurora-blob-lavender" />

        {/* Blob 5: Center Orbital Aurora Connector */}
        <div className="tw-aurora-blob tw-aurora-blob-center" />
      </div>

      {/* ------------------------------------------------------------------
          B. 3D Glass Ribbons Layer (Translucent Flowing Geometry & Dynamic Sheen)
          ------------------------------------------------------------------ */}
      <div className="tw-glass-ribbons-svg-wrap">
        <svg
          className="tw-glass-ribbon-svg"
          viewBox="0 0 1440 850"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ribbon 1 Gradient: Cyan / Cobalt / Lavender Glass (Right Carousel) */}
            <linearGradient
              id="twGlassGrad1"
              x1="900"
              y1="-20"
              x2="1380"
              y2="780"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
              <stop offset="30%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="68%" stopColor="#A5B4FC" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1551D1" stopOpacity="0.12" />
            </linearGradient>

            {/* Ribbon 1 Specular Rim Light */}
            <linearGradient
              id="twSpecularGrad1"
              x1="920"
              y1="-40"
              x2="1360"
              y2="800"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#A5B4FC" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Ribbon 2 Gradient: Interlaced Cyan / Emerald Glass */}
            <linearGradient
              id="twGlassGrad2"
              x1="1380"
              y1="80"
              x2="940"
              y2="800"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.28" />
              <stop offset="36%" stopColor="#22C55E" stopOpacity="0.16" />
              <stop offset="70%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.1" />
            </linearGradient>

            {/* Ribbon 2 Specular Rim Light */}
            <linearGradient
              id="twSpecularGrad2"
              x1="1360"
              y1="70"
              x2="950"
              y2="820"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#22C55E" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Ribbon 3 Gradient: Deep Ambient Glass */}
            <linearGradient
              id="twGlassGrad3"
              x1="800"
              y1="60"
              x2="1280"
              y2="760"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.08" />
            </linearGradient>

            {/* Ribbon 4 Gradient: Left Orbital Ribbon (Frames text safe zone) */}
            <linearGradient
              id="twGlassGradLeft"
              x1="40"
              y1="30"
              x2="780"
              y2="780"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.28" />
              <stop offset="28%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="62%" stopColor="#A5B4FC" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#22C55E" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#1551D1" stopOpacity="0.10" />
            </linearGradient>

            {/* Ribbon 4 Specular Rim Light */}
            <linearGradient
              id="twSpecularGradLeft"
              x1="30"
              y1="25"
              x2="720"
              y2="760"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="46%" stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="78%" stopColor="#A5B4FC" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Ribbon 5 Gradient: Full-Width Orbital Bridge (Connects Left & Right) */}
            <linearGradient
              id="twGlassGradBridge"
              x1="120"
              y1="40"
              x2="1220"
              y2="150"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="65%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="88%" stopColor="#22C55E" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.22" />
            </linearGradient>

            {/* Ribbon 5 Specular Rim Light */}
            <linearGradient
              id="twSpecularGradBridge"
              x1="140"
              y1="35"
              x2="1200"
              y2="140"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="52%" stopColor="#38BDF8" stopOpacity="0.65" />
              <stop offset="78%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ribbon 5: Full-Width Orbital Connecting Bridge (Upper corridor between Left & Right) */}
          <g className="tw-glass-ribbon-bridge tw-glass-group-bridge">
            <path
              d="M 140 50 C 440 108, 700 138, 940 115 C 1050 95, 1160 52, 1220 35 L 1195 10 C 1135 30, 1030 75, 920 95 C 680 115, 420 85, 160 25 Z"
              fill="url(#twGlassGradBridge)"
            />
            {/* Specular crest rim highlight */}
            <path
              d="M 145 48 C 445 106, 705 136, 945 113 C 1055 93, 1165 50, 1215 33"
              stroke="url(#twSpecularGradBridge)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Fine crystalline edge reflection */}
            <path
              d="M 220 62 C 480 112, 720 135, 910 118"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeOpacity="0.38"
              strokeDasharray="140 50"
              strokeLinecap="round"
            />
          </g>

          {/* Ribbon 4: Left-Side & Lower Orbital Ribbon (Gracefully frames text safe zone) */}
          <g className="tw-glass-ribbon-left tw-glass-group-left">
            <path
              d="M 45 38 C 260 70, 520 100, 680 135 L 660 165 C 500 130, 245 100, 30 70 C 10 200, 2 370, 16 525 C 40 660, 260 750, 545 740 C 675 730, 775 645, 805 615 L 825 645 C 790 680, 680 765, 540 775 C 240 785, 15 690, -10 535 C -25 365, -15 190, 10 38 Z"
              fill="url(#twGlassGradLeft)"
            />
            {/* Specular crest rim highlight along upper and outer curve */}
            <path
              d="M 48 36 C 265 68, 525 98, 685 133"
              stroke="url(#twSpecularGradLeft)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Fine crystalline reflection along lower sweep */}
            <path
              d="M 12 530 C 35 665, 255 755, 538 745 C 668 735, 768 650, 798 620"
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeOpacity="0.45"
              strokeDasharray="160 60"
              strokeLinecap="round"
            />
            {/* Internal glass illumination streak */}
            <path
              d="M 42 65 C 255 98, 475 125, 615 152"
              stroke="#FFFFFF"
              strokeWidth="0.9"
              strokeOpacity="0.4"
              strokeDasharray="120 40"
              strokeLinecap="round"
            />
          </g>

          {/* Ribbon 3: Deep Ambient Glass Veil (Floating independently) */}
          <g className="tw-glass-ribbon-3">
            <path
              d="M 820 60 C 1040 160, 1240 320, 1280 540 C 1310 700, 1180 810, 860 860 L 835 825 C 1140 775, 1255 675, 1225 530 C 1185 330, 1005 180, 795 90 Z"
              fill="url(#twGlassGrad3)"
            />
          </g>

          {/* Ribbon 2: Secondary Flowing Glass (Floating opposite direction) */}
          <g className="tw-glass-ribbon-2 tw-glass-group-secondary">
            <path
              d="M 1390 80 C 1160 180, 1010 320, 990 490 C 970 660, 1060 730, 1160 820 L 1120 845 C 1015 745, 930 655, 950 480 C 970 300, 1120 160, 1350 60 Z"
              fill="url(#twGlassGrad2)"
            />
            {/* Specular crest rim highlight */}
            <path
              d="M 1385 78 C 1158 178, 1008 318, 988 488 C 968 658, 1058 728, 1158 818"
              stroke="url(#twSpecularGrad2)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Internal light refraction streak */}
            <path
              d="M 1320 110 C 1130 210, 1015 340, 995 495 C 980 620, 1050 710, 1110 780"
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeOpacity="0.45"
              strokeDasharray="140 50"
              strokeLinecap="round"
            />
          </g>

          {/* Ribbon 1: Primary Foreground Flowing Glass */}
          <g className="tw-glass-ribbon-1 tw-glass-group-primary">
            <path
              d="M 920 -40 C 1140 80, 1340 240, 1370 430 C 1400 620, 1260 720, 960 790 L 935 830 C 1285 770, 1435 640, 1405 420 C 1375 200, 1175 40, 955 -40 Z"
              fill="url(#twGlassGrad1)"
            />
            {/* Specular crest rim highlight */}
            <path
              d="M 925 -38 C 1143 82, 1343 242, 1373 428 C 1403 618, 1263 718, 963 788"
              stroke="url(#twSpecularGrad1)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Fine crystalline edge reflection */}
            <path
              d="M 960 -36 C 1178 44, 1378 204, 1408 424 C 1438 644, 1288 774, 938 834"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeOpacity="0.4"
              strokeDasharray="180 70"
            />
            {/* Internal glass illumination streak */}
            <path
              d="M 980 20 C 1170 140, 1320 280, 1350 440 C 1370 560, 1280 670, 1020 750"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeOpacity="0.5"
              strokeDasharray="120 40"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Dynamic Specular Light Sweep Overlays (Left & Right) */}
        <div className="tw-glass-light-sweep" />
        <div className="tw-glass-light-sweep-left" />

        {/* Caustic Optical Glow Flares (Orbital Nodes) */}
        <div className="tw-glass-caustic-flare tw-glass-caustic-1" />
        <div className="tw-glass-caustic-flare tw-glass-caustic-2" />
        <div className="tw-glass-caustic-flare tw-glass-caustic-3" />
        <div className="tw-glass-caustic-flare tw-glass-caustic-4" />
      </div>

      {/* Soft Bottom Light Diffusion Bed */}
      <div className="tw-aurora-bottom-diffusion" />
    </div>
  );
});

LiquidAuroraRibbons.displayName = 'LiquidAuroraRibbons';

export default LiquidAuroraRibbons;
