import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Sparkles,
  Users,
  Film,
  Tv,
  Gamepad2,
  MapPin,
  Utensils,
  User as UserIcon,
  LogOut,
  Info,
  Cpu,
  Layers,
  ShieldAlert,
  Sun,
  Moon,
  Camera,
} from "lucide-react";
import {
  usePendingRequestsQuery,
  useUpdateProfilePictureMutation,
} from "../api/queries";
import { useToast } from "../context/ToastContext";

const resolveImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `/api/v1/uploads/${img}`;
};

// Import local image assets for background switcher
import cyberCityImg from "../assets/cyber_future_city.png";
import skyRealmImg from "../assets/sky_realm.png";

// High-fidelity Marvel & Cyberpunk background theme pool
const BACKDROP_POOL = [
  cyberCityImg,
  skyRealmImg,
  // Marvel / Superhero themed backgrounds
  "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1200", // Spider-Man Suit Vibe
  "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1200", // Superhero Comics Art
  "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?q=80&w=1200", // Iron Man Neon Mask Vibe
  "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=1200", // Neon Marvel Concept Art
  // Travel / Places themed backgrounds
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200", // Scenic Canyon Travel Route
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200", // Scenic Mountain Travel Lake
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200", // Tropical Beach Travel Location
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200", // Scenic Travel Lake & Sunset
  // Movies & Web Series themed backgrounds
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200", // Cinema Seats / Theater Hall
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200", // Classic Movie Theater Neon Front
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200", // Movie Roll & Production
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200", // Film Camera Lens / Cinema Projector
  // Restaurants / Cuisine themed backgrounds
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200", // Cozy Elegant Restaurant Interior
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200", // Premium Plated Gourmet Dining
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", // Restaurant Kitchen / Food Curation
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200", // Premium Steakhouse Dining Table Vibe
];

const LogoutHelper = () => {
  return (
    <div className="relative w-64 h-48 flex items-center justify-center select-none mb-6">
      <svg
        viewBox="0 0 240 180"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="helperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE047" />
            <stop offset="100%" stopColor="#F5B800" />
          </linearGradient>
          <linearGradient id="exitDoorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient
            id="doorLightGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="#000"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        <style>{`
          .mascot-group {
            animation: walkBob 0.7s infinite ease-in-out;
            transform-origin: 100px 95px;
          }
          .mascot-left-leg {
            transform-origin: 94px 115px;
            animation: walkLegLeft 0.7s infinite alternate ease-in-out;
          }
          .mascot-right-leg {
            transform-origin: 106px 115px;
            animation: walkLegRight 0.7s infinite alternate ease-in-out;
          }
          .mascot-wave-arm {
            transform-origin: 82px 95px;
            animation: waveGoodbye 0.35s infinite alternate ease-in-out;
          }
          .mascot-suitcase-arm {
            transform-origin: 118px 95px;
            animation: carrySuitcase 0.7s infinite alternate ease-in-out;
          }
          .exit-door {
            animation: doorGlowPulse 2.5s infinite alternate ease-in-out;
          }

          @keyframes walkBob {
            0%, 100% { transform: translateY(0) rotate(1deg); }
            50% { transform: translateY(-4px) rotate(-1deg); }
          }
          @keyframes walkLegLeft {
            0% { transform: rotate(-20deg); }
            100% { transform: rotate(15deg); }
          }
          @keyframes walkLegRight {
            0% { transform: rotate(15deg); }
            100% { transform: rotate(-20deg); }
          }
          @keyframes waveGoodbye {
            0% { transform: rotate(20deg); }
            100% { transform: rotate(65deg); }
          }
          @keyframes carrySuitcase {
            0% { transform: rotate(-8deg); }
            100% { transform: rotate(12deg); }
          }
          @keyframes doorGlowPulse {
            0% { opacity: 0.7; }
            100% { opacity: 1.0; }
          }
        `}</style>

        {/* Light Beam from Exit Door */}
        <polygon
          points="175,40 240,10 240,170 175,130"
          fill="url(#doorLightGrad)"
        />

        {/* Floor Line */}
        <line
          x1="20"
          y1="130"
          x2="220"
          y2="130"
          stroke="#334155"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse
          cx="100"
          cy="132"
          rx="35"
          ry="5"
          fill="#000"
          fillOpacity="0.3"
        />

        {/* Exit Door */}
        <g className="exit-door" filter="url(#softShadow)">
          <rect
            x="165"
            y="38"
            width="40"
            height="92"
            rx="3"
            fill="#1F2937"
            stroke="#10B981"
            strokeWidth="3"
          />
          <rect
            x="169"
            y="42"
            width="32"
            height="84"
            rx="1"
            fill="url(#exitDoorGrad)"
          />

          <rect x="173" y="48" width="24" height="8" rx="1" fill="#065F46" />
          <text
            x="185"
            y="54"
            fill="#34D399"
            fontSize="5"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            EXIT
          </text>

          <circle cx="173" cy="85" r="2.5" fill="#FBBF24" />
        </g>

        {/* Mascot */}
        <g className="mascot-group" filter="url(#softShadow)">
          <ellipse
            cx="100"
            cy="126"
            rx="20"
            ry="4"
            fill="#000"
            fillOpacity="0.25"
          />

          <g className="mascot-left-leg">
            <rect x="91" y="112" width="6" height="15" rx="3" fill="#F5B800" />
            <circle cx="94" cy="126" r="4" fill="#FFE047" />
          </g>

          <g className="mascot-right-leg">
            <rect x="103" y="112" width="6" height="15" rx="3" fill="#F5B800" />
            <circle cx="106" cy="126" r="4" fill="#FFE047" />
          </g>

          <path
            d="M84 94 Q70 82 62 70"
            stroke="#FFE047"
            strokeWidth="7"
            strokeLinecap="round"
            className="mascot-wave-arm"
          />

          <g className="mascot-suitcase-arm">
            <path
              d="M116 94 Q128 102 128 108"
              stroke="#FFE047"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <g transform="translate(122, 106)">
              <rect
                x="0"
                y="2"
                width="16"
                height="12"
                rx="2"
                fill="#B91C1C"
                stroke="#7F1D1D"
                strokeWidth="1"
              />
              <path
                d="M5 2V0H11V2"
                stroke="#4B5563"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="4" cy="5" r="1" fill="#F5B800" />
              <circle cx="12" cy="5" r="1" fill="#F5B800" />
            </g>
          </g>

          <circle cx="100" cy="95" r="22" fill="url(#helperGrad)" />

          <circle cx="112" cy="92" r="2" fill="#0F172A" />
          <circle cx="119" cy="92" r="2" fill="#0F172A" />
          <circle cx="117" cy="97" r="2.5" fill="#F43F5E" fillOpacity="0.5" />
          <path
            d="M111 96 Q114 99 116 96"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

const LogoutOverlay = () => {
  return (
    <div className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-[9999] transition-all">
      <div className="text-center p-8 glass max-w-sm rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
        <LogoutHelper />
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
          Goodbye!
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          You have been logged out
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const { data: pendingRequests = [] } = usePendingRequestsQuery();
  const updateProfilePictureMutation = useUpdateProfilePictureMutation();
  const pendingCount = pendingRequests.length;

  const [scrolled, setScrolled] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [showLogoutScreen, setShowLogoutScreen] = useState(false);

  // Auto-rotating Background States
  const [bgUrl, setBgUrl] = useState(() => {
    const saved = localStorage.getItem("nexora-bg-url");
    return saved && BACKDROP_POOL.includes(saved) ? saved : BACKDROP_POOL[0];
  });

  useEffect(() => {
    localStorage.setItem("nexora-bg-url", bgUrl);
  }, [bgUrl]);

  // Rotates background every 1 minute randomly
  useEffect(() => {
    const interval = setInterval(() => {
      setBgUrl((prev) => {
        let next = prev;
        while (next === prev) {
          next =
            BACKDROP_POOL[Math.floor(Math.random() * BACKDROP_POOL.length)];
        }
        return next;
      });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor page scroll to condense header nav
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Define tab properties
  const navTabs = [
    {
      id: "feed",
      path: "/feed",
      icon: <Users className="h-5 w-5" />,
      label: "Moments",
      desc: "Private friend feed. Upload posts and interact only with accepted friends.",
    },
    {
      id: "movies",
      path: "/discover?module=movies",
      icon: <Film className="h-5 w-5" />,
      label: "Movies",
      desc: "Open movie directory. Search by title, director or cast; filter by OTT platform and genre.",
    },
    {
      id: "webseries",
      path: "/discover?module=webseries",
      icon: <Tv className="h-5 w-5" />,
      label: "Web Series",
      desc: "Community web series listings. Track seasons, release dates and OTT streaming locations.",
    },
    {
      id: "games",
      path: "/discover?module=games",
      icon: <Gamepad2 className="h-5 w-5" />,
      label: "Games",
      desc: "Public games curation database. Track gaming platforms and action/RPG categories.",
    },
    {
      id: "places",
      path: "/discover?module=places",
      icon: <MapPin className="h-5 w-5" />,
      label: "Places",
      desc: "Travel spots knowledge base. Filter by local entry fees and travel distances.",
    },
    {
      id: "restaurants",
      path: "/discover?module=restaurants",
      icon: <Utensils className="h-5 w-5" />,
      label: "Restaurants",
      desc: "Dining recommendations. Upload menu cards, special recipes, and filter price brackets.",
    },

    {
      id: "profile",
      path: "/profile",
      icon: <UserIcon className="h-5 w-5" />,
      label: "Profile",
      desc: "Manage your profile and review your personal directory contributions.",
    },
  ];

  if (user?.role === "ADMIN") {
    navTabs.push({
      id: "admin",
      path: "/admin",
      icon: <ShieldAlert className="h-5 w-5" />,
      label: "Admin",
      desc: "Admin-only manager for deleting movie recommendations.",
    });
  }

  // Helper to determine active tab based on current path and query
  const getActiveTabIdx = () => {
    const currentPath = location.pathname;
    const currentQuery = location.search;

    if (currentPath === "/feed") return 0;
    if (currentPath === "/discover") {
      const searchParams = new URLSearchParams(currentQuery);
      const moduleVal = searchParams.get("module");
      if (moduleVal === "movies") return 1;
      if (moduleVal === "webseries") return 2;
      if (moduleVal === "games") return 3;
      if (moduleVal === "places") return 4;
      if (moduleVal === "restaurants") return 5;
      return 1; // Default to Movies if on /discover with no query param
    }
    if (currentPath.startsWith("/profile")) return 6;
    if (currentPath === "/admin") return 7;
    return 0;
  };

  const activeIdx = getActiveTabIdx();

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  const handleLogout = () => {
    setShowLogoutScreen(true);
    setTimeout(() => {
      logout();
      navigate("/login");
    }, 2800);
  };

  // Profile Picture Upload
  const handleProfilePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateProfilePictureMutation.mutate(file, {
        onSuccess: () => {
          showToast("Profile picture updated successfully!", "success");
        },
        onError: (error) => {
          const message = error.response?.data;
          showToast(
            typeof message === "string" && message.trim()
              ? message
              : "Failed to update profile picture.",
            "error"
          );
        },
      });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 z-10 pb-20 md:pb-0">
      {showLogoutScreen && <LogoutOverlay />}

      {/* Auto-rotating Backdrop Image with theme-based opacity */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out z-[-1] transform scale-[1.02] pointer-events-none"
        style={{
          backgroundImage: `url(${bgUrl})`,
          opacity: "var(--backdrop-opacity)",
        }}
      />
      {/* Semi-transparent overlay for high readability */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none transition-all duration-500"
        style={{
          backgroundColor: "var(--overlay-bg)",
          backdropFilter: "blur(1px)",
        }}
      />

      {/* TOP DESKTOP FLOATING PILL NAVBAR */}
      <header className="hidden md:flex fixed top-0  left-0 right-0 z-50 justify-center px-4 pt-4 pointer-events-none">
        <div
          className={`w-full max-w-5xl  glass-nav rounded-full flex justify-between items-center transition-all duration-300 pointer-events-auto relative ${
            scrolled
              ? "px-5 py-2 mt-1 shadow-lg bg-slate-900/85 scale-98"
              : "px-7 py-4 "
          }`}
        >
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0 z-20"
            onClick={() => navigate("/feed")}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent hidden sm:inline">
              Nexora
            </span>
          </div>

          {/* Core Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/40 p-1.5 rounded-full border border-white/5 relative z-20">
            {/* Sliding Active Tab Background */}
            <div
              className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/35 rounded-full transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: `${activeIdx * 44 + 6}px`, // 40px width + 4px gap + padding
                width: "40px",
              }}
            />

            {navTabs.map((tab, idx) => (
              <div
                key={tab.id}
                className="relative"
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <button
                  onClick={() => handleTabClick(tab)}
                  className={`h-10 w-10 flex items-center justify-center rounded-full transition-all relative z-10 ${
                    activeIdx === idx
                      ? "text-purple-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  aria-label={tab.label}
                >
                  {tab.icon}
                  {tab.id === "feed" && pendingCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[8px] font-bold text-white nav-badge-glow">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* Tooltip Preview Card */}
                {hoveredTab === tab.id && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 p-4 glass rounded-2xl shadow-xl z-50 pointer-events-none animate-fade-in text-xs leading-relaxed">
                    <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
                      {tab.icon}
                      {tab.label}
                    </div>
                    <p className="text-slate-400 font-medium">{tab.desc}</p>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-3 z-20">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-purple-300 hover:border-purple-500 transition overflow-hidden"
                  title="Open profile"
                >
                  {user?.profilePicture ? (
                    <img
                      src={resolveImageUrl(user.profilePicture)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : user ? (
                    user.firstName.charAt(0)
                  ) : (
                    "U"
                  )}
                </button>
                <label
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-900/95 text-purple-300 shadow-lg cursor-pointer hover:border-purple-500 hover:text-purple-200 transition"
                  title="Upload profile photo"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleProfilePictureUpload}
                  />
                  <Camera className="h-3 w-3" />
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="text-sm font-medium text-slate-300 hover:text-purple-300 transition hidden lg:inline"
              >
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-purple-500/10 text-slate-400 hover:text-purple-400 border border-transparent hover:border-purple-500/20 transition-all flex items-center justify-center cursor-pointer"
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE HEADER (Brand + Logout) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass-nav px-6 py-3 flex justify-between items-center overflow-hidden">
        <div
          onClick={() => navigate("/feed")}
          className="flex items-center gap-2 cursor-pointer z-20"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Nexora
          </span>
        </div>

        <div className="flex items-center gap-1 z-20">
          <label
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-purple-300 shadow-lg cursor-pointer hover:border-purple-500 hover:text-purple-200 transition"
            title="Upload profile photo"
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleProfilePictureUpload}
            />
            <Camera className="h-4 w-4" />
          </label>
          <button
            onClick={toggleTheme}
            className="text-slate-400 hover:text-purple-400 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* DOCK BAR (Mobile Navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-white/5 py-2 px-4 flex justify-around items-center">
        {navTabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className="flex flex-col items-center gap-1 justify-center relative py-1"
          >
            {/* active state spring bubble */}
            {activeIdx === idx && (
              <span className="absolute inset-x-0 -top-2 mx-auto h-1 w-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow shadow-purple-500"></span>
            )}
            <div
              className={`p-1.5 rounded-full transition relative ${
                activeIdx === idx
                  ? "text-purple-400 scale-110"
                  : "text-slate-500"
              }`}
            >
              {tab.icon}
              {tab.id === "feed" && pendingCount > 0 && (
                <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-500 text-[8px] font-bold text-white nav-badge-glow">
                  {pendingCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold transition ${
                activeIdx === idx ? "text-purple-300" : "text-slate-500"
              }`}
            >
              {tab.label === "Moments" ? "Feed" : tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="relative flex-grow w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
