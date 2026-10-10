import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

/**
 * IMAGE SETUP
 * Copy the provided "images/landing" folder into your project's  public/  folder
 * so the files end up at  public/images/landing/*.png|jpg
 */
const IMG = '/images/landing/';

/**
 * Gallery layout. Every value is a % of the gallery box (aspect 1024:560),
 * so the composition scales exactly like the mockup on any screen width.
 * x/y = left/top, w = width, r = rotation (deg), z = stacking order.
 * `card` = poster card with rounded corners + shadow; otherwise a floating object.
 */
const GALLERY = [
  // ---- Poster cards ----
  { src: 'dune.jpg',          alt: 'Dune',          x: 8.5,  y: 20, w: 18.5, r: -8, z: 20, card: true, h: 41 },
  { src: 'spiderman.jpg',     alt: 'Spider-Man',    x: 27,   y: 30, w: 15,   r: -5, z: 25, card: true, h: 36 },
  { src: 'oppenheimer.jpg',   alt: 'Oppenheimer',   x: 41.5, y: 25, w: 18.5, r: 2,  z: 30, card: true, h: 43 },
  { src: 'godofwar.jpg',      alt: 'God of War',    x: 59.5, y: 30, w: 17,   r: 4,  z: 25, card: true, h: 36, glass: true },
  { src: 'zelda.jpg',         alt: 'Zelda',         x: 77,   y: 36, w: 15,   r: 8,  z: 20, card: true, h: 28 },

  // ---- Floating objects (transparent PNGs) ----
  { src: 'cola.png',          alt: 'Cola',          x: 5,    y: 3,  w: 6,    r: 0,   z: 15 },
  { src: 'sushi-nigiri.png',  alt: 'Sushi',         x: 0,    y: 23, w: 6.5,  r: 0,   z: 15 },
  { src: 'planet-ring.png',   alt: 'Planet',        x: 25.5, y: 21, w: 8,    r: 0,   z: 12, float: true },
  { src: 'popcorn2.png',      alt: 'Popcorn',       x: 38,   y: 14, w: 8,    r: 0,   z: 35 },
  { src: 'sushi-roll.png',    alt: 'Sushi roll',    x: 53,   y: 16, w: 8.5,  r: 0,   z: 15 },
  { src: 'switch.png',        alt: 'Nintendo Switch', x: 73, y: 15, w: 22,   r: 0,   z: 35 },
  { src: 'taco.png',          alt: 'Taco',          x: 87.5, y: 0,  w: 6.5,  r: 0,   z: 15 },
  { src: 'planet-ring2.png',  alt: 'Planet',        x: 93,   y: 41, w: 7,    r: 0,   z: 12, float: true },
  { src: 'aloy.png',          alt: 'Horizon hero',  x: 0,    y: 49, w: 13.5, r: 0,   z: 40 },
  { src: 'ps5-controller.png',alt: 'Controller',    x: 14.5, y: 62, w: 15.5, r: 0,   z: 40 },
  { src: 'cola2.png',         alt: 'Cola',          x: 36,   y: 65, w: 8,    r: 0,   z: 40 },
  { src: 'taco2.png',         alt: 'Taco',          x: 52.5, y: 69, w: 10.5, r: 0,   z: 40 },
  { src: 'cola3.png',         alt: 'Cola',          x: 66.5, y: 66, w: 6.5,  r: 0,   z: 40 },
  { src: 'planet.png',        alt: 'Planet',        x: 77.5, y: 70, w: 6.5,  r: 0,   z: 15, float: true },
  { src: 'popcorn2.png',      alt: 'Popcorn',       x: 90,   y: 64, w: 9.5,  r: 0,   z: 40 },
];

// small glowing dots / blobs
const DOTS = [
  { x: 15.5, y: 6,  s: 2.4, c: 'bg-purple-500' },
  { x: 6,    y: 78, s: 2.2, c: 'bg-orange-400' },
  { x: 63,   y: 8,  s: 3.6, c: 'bg-orange-400' },
  { x: 68,   y: 35, s: 1.4, c: 'bg-purple-600' },
  { x: 82,   y: 7,  s: 1.1, c: 'bg-orange-500' },
  { x: 96,   y: 8,  s: 2.4, c: 'bg-indigo-500' },
  { x: 94,   y: 82, s: 2,   c: 'bg-orange-400' },
];

const CATEGORIES = ['Movies', 'Gaming', 'Culinary', 'Music', 'Events', 'Podcasts'];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fafbff] flex flex-col font-sans text-slate-900 relative overflow-x-hidden">
      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 w-full px-6 sm:px-12 py-4 flex justify-between items-center z-50 bg-[#fafbff]/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
            Nexora
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/login?tab=signin')}
            className="px-7 py-2.5 text-sm font-medium text-slate-800 rounded-full border border-slate-800 bg-white hover:bg-slate-50 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/login?tab=signup')}
            className="px-7 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center pt-32 px-4 text-center z-10 w-full">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.08] mb-6">
          <span className="bg-gradient-to-r from-orange-500 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
            All Your Favorites.
          </span>
          <br />
          <span className="bg-gradient-to-r from-orange-500 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
            One Place.
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-800 max-w-xl mb-8 leading-relaxed">
          Discover the ultimate destination for endless entertainment. Stream movies, play games, and
          explore culinary experiences instantly.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-xl relative mb-6 z-20">
          <input
            type="text"
            placeholder="Explore movies, games, food..."
            className="w-full pl-6 pr-14 py-4 rounded-full border border-slate-200 bg-white/80 shadow-lg shadow-slate-300/40 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-slate-800 placeholder:text-slate-400 transition-all"
          />
          <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 z-20">
          {CATEGORIES.map((cat, i) => (
            <span
              key={cat}
              className={`px-5 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
                i === 0
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/70 text-slate-800 border border-slate-300 hover:bg-white hover:border-slate-400'
              }`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Floating gallery (matches mockup) */}
        <div
          className="relative w-full max-w-[1600px] mx-auto pointer-events-none -mt-16 sm:-mt-24"
          style={{ aspectRatio: '1024 / 560' }}
        >
          {/* soft colour glows */}
          <div className="absolute left-[-4%] top-[20%] w-[30%] h-[60%] rounded-full bg-orange-300/50 blur-3xl" />
          <div className="absolute left-[40%] top-[15%] w-[25%] h-[50%] rounded-full bg-orange-300/40 blur-3xl" />
          <div className="absolute right-[-4%] top-[15%] w-[34%] h-[70%] rounded-full bg-indigo-400/40 blur-3xl" />
          <div className="absolute right-[2%] bottom-[0%] w-[22%] h-[40%] rounded-full bg-purple-400/40 blur-3xl" />

          {/* dots */}
          {DOTS.map((d, i) => (
            <span
              key={i}
              className={`absolute rounded-full ${d.c} shadow-md`}
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.s}%`, aspectRatio: '1 / 1', zIndex: 10 }}
            />
          ))}

          {GALLERY.map((it, i) => (
            <div
              key={i}
              className={`absolute ${it.float ? 'animate-pulse' : ''}`}
              style={{
                left: `${it.x}%`,
                top: `${it.y}%`,
                width: `${it.w}%`,
                height: it.card ? `${it.h}%` : 'auto',
                transform: `rotate(${it.r}deg)`,
                zIndex: it.z,
              }}
            >
              {it.card ? (
                <img
                  src={IMG + it.src}
                  alt={it.alt}
                  className={`w-full h-full object-cover rounded-2xl shadow-2xl shadow-slate-900/25 ${
                    it.glass ? 'border border-white/70 opacity-95' : ''
                  }`}
                />
              ) : (
                <img
                  src={IMG + it.src}
                  alt={it.alt}
                  className="w-full h-auto drop-shadow-2xl"
                />
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-12 py-6 px-6 sm:px-12 border-t border-slate-300 z-10 bg-[#fafbff]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-800">
          <div className="flex flex-wrap justify-center md:justify-start gap-8">
            <a href="#" className="hover:text-purple-600 transition-colors">About</a>
            {/* <a href="#" className="hover:text-purple-600 transition-colors">Careers</a> */}
            {/* <a href="#" className="hover:text-purple-600 transition-colors">Press</a> */}
            {/* <a href="#" className="hover:text-purple-600 transition-colors">Terms</a> */}
            <a href="mailto:nexora.entertainment18@gmail.com" className="hover:text-purple-600 transition-colors">
              Support
            </a>
          </div>
          <div className="font-normal text-slate-800">copyright @s-tech solutions 2026</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
