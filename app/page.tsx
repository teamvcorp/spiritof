import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-green-900">
      {/* Snowflake decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-white/20 text-6xl">❄</div>
        <div className="absolute top-40 right-20 text-white/15 text-4xl">❄</div>
        <div className="absolute bottom-20 left-1/4 text-white/10 text-5xl">❄</div>
        <div className="absolute top-1/3 right-1/3 text-white/20 text-3xl">❄</div>
      </div>

      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo/Title Section */}
        <div className="mb-12 space-y-4">
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/LogoNew.svg"
              alt="Spirit of Santa Logo"
              width={200}
              height={200}
              priority
              className="animate-pulse drop-shadow-2xl"
            />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-4 drop-shadow-2xl">
            Spirit of Santa
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
        </div>

        {/* Coming Soon Badge */}
        <div className="mb-8">
          <span className="inline-block bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3 rounded-full text-xl font-semibold tracking-wide">
            Coming in 2026
          </span>
        </div>

        {/* Tagline */}
        <p className="text-2xl md:text-3xl text-white/90 max-w-3xl mb-12 font-light leading-relaxed">
          Experience the magic. Rediscover the true meaning of giving and celebration.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mb-16">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold text-white mb-2">Joy & Wonder</h3>
            <p className="text-white/80">Bringing magic back to the holidays</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-white mb-2">Tradition</h3>
            <p className="text-white/80">Celebrating timeless moments together</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Generosity</h3>
            <p className="text-white/80">Spreading kindness and cheer</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-6">
          <h2 className="text-2xl text-white/90 font-light">Be the first to know</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-80"
            />
            <button className="px-8 py-4 bg-white text-red-800 rounded-full font-semibold hover:bg-white/90 transition-all duration-300 hover:scale-105 w-full sm:w-auto shadow-2xl">
              Notify Me
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-white/60 text-sm">
          © 2026 Spirit of Santa. All rights reserved.
        </div>
      </main>
    </div>
  );
}
